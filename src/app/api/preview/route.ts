import { NextResponse } from "next/server"
import * as esbuild from "esbuild"
import { promises as fsp } from "fs"
import path from "path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

/* ============================================================
   COMPILADOR DE PREVIEW REAL — SELF-CONTAINED
   Bundla o código-fonte gerado (TSX/TS/JS/CSS) com esbuild em
   memória. As dependências npm são descarregadas do esm.sh no
   SERVIDOR e inlinadas no bundle — o documento final não faz
   nenhum fetch externo em runtime. Determinístico, sem IA.
   ============================================================ */

interface PreviewFile {
  path: string
  content: string
}

function normPath(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\.?\//, "").replace(/\/+/g, "/")
}

function resolveRel(from: string, spec: string): string {
  const base = from.includes("/") ? from.slice(0, from.lastIndexOf("/")) : ""
  const parts = (base ? base + "/" + spec : spec).split("/")
  const out: string[] = []
  for (const part of parts) {
    if (!part || part === ".") continue
    if (part === "..") out.pop()
    else out.push(part)
  }
  return out.join("/")
}

function loaderFor(path: string): esbuild.Loader {
  const ext = path.split("?")[0].split(".").pop()?.toLowerCase() || ""
  switch (ext) {
    case "tsx": return "tsx"
    case "ts": return "ts"
    case "jsx": return "jsx"
    case "mjs": case "js": return "js"
    case "css": return "css"
    case "json": return "json"
    case "svg": case "png": case "jpg": case "jpeg": case "gif":
    case "webp": case "ico": case "woff": case "woff2": case "ttf":
      return "dataurl"
    default: return "js"
  }
}

const RESOLVE_EXTS = ["", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"]
const RESOLVE_INDEX = ["/index.tsx", "/index.ts", "/index.jsx", "/index.js", "/index.mjs"]

function pkgRoot(spec: string): string {
  const parts = spec.split("/")
  return spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]
}

function cleanVersion(v: string | undefined): string {
  if (!v) return ""
  const cleaned = v.trim().replace(/^[\^~<>=\s]+/, "")
  return /^[\w.\-]+$/.test(cleaned) && cleaned !== "latest" && cleaned !== "*" ? cleaned : ""
}

/* Versões default para deps que o código usa mas o package.json
   gerado esqueceu de declarar */
const DEFAULT_VERSIONS: Record<string, string> = {
  react: "18.3.1",
  "react-dom": "18.3.1",
  "react-router-dom": "6.30.0",
  "react-router": "6.30.0",
  zustand: "4.5.7",
  "lucide-react": "0.460.0",
  axios: "1.10.0",
  "framer-motion": "11.18.2",
}

const NODE_BUILTINS_RE =
  /^(node:)?(fs|path|os|crypto|http|https|url|util|stream|events|buffer|child_process|net|tls|zlib|querystring|assert|module|process|tty|dns|readline|worker_threads|perf_hooks|async_hooks|vm|v8|inspector|constants|sys|punycode|string_decoder|domain)$/

const STUB_MODULE =
  "const p=new Proxy(function(){},{get:(t,k)=>k==='default'?p:p,apply:()=>p,construct:()=>p});export default p;export const __esModule=true;"

function escapeInline(code: string, tag: string): string {
  return code.replace(new RegExp(`</${tag}`, "gi"), `<\\/${tag}`)
}

export async function POST(req: Request) {
  let body: { files?: PreviewFile[]; project?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Pedido inválido" }, { status: 400 })
  }

  const files = (body.files || []).filter((f) => f?.path && typeof f.content === "string")
  if (files.length === 0) {
    return NextResponse.json({ ok: false, error: "Sem ficheiros para compilar" }, { status: 400 })
  }

  const fileMap = new Map<string, string>()
  for (const f of files) fileMap.set(normPath(f.path), f.content)

  /* ---- Versões das deps a partir do package.json gerado ---- */
  const versions = new Map<string, string>()
  const pkgJson = fileMap.get("package.json")
  if (pkgJson) {
    try {
      const pj = JSON.parse(pkgJson)
      for (const scope of [pj.dependencies, pj.devDependencies]) {
        for (const [name, v] of Object.entries(scope || {})) {
          const cv = cleanVersion(v as string)
          if (cv) versions.set(name, cv)
        }
      }
    } catch { /* package.json inválido — usa defaults */ }
  }
  /* react/react-dom forçados à mesma versão — mismatch = Invalid hook call */
  const reactVer = versions.get("react") || DEFAULT_VERSIONS.react
  versions.set("react", reactVer)
  versions.set("react-dom", reactVer)

  function depUrl(spec: string): string {
    const root = pkgRoot(spec)
    const ver = versions.get(root) || DEFAULT_VERSIONS[root] || ""
    const sub = spec.slice(root.length)
    const base = `https://esm.sh/${root}${ver ? "@" + ver : ""}${sub}`
    /* ?bundle inlines sub-deps; ?deps fixa react partilhado p/ dedupe */
    const params: string[] = ["bundle"]
    if (root !== "react" && root !== "react-dom") {
      params.push(`deps=react@${reactVer},react-dom@${reactVer}`)
    }
    return `${base}?${params.join("&")}`
  }

  /* ---- Entry point: script src do index.html, ou convenções ---- */
  let entry = ""
  let htmlTitle = "Preview"
  const indexHtml = fileMap.get("index.html") || ""
  if (indexHtml) {
    const titleMatch = indexHtml.match(/<title[^>]*>([^<]*)<\/title>/i)
    if (titleMatch?.[1]?.trim()) htmlTitle = titleMatch[1].trim()
    const scripts = [...indexHtml.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
    for (const m of scripts) {
      const cand = normPath(m[1])
      if (fileMap.has(cand)) { entry = cand; break }
    }
  }
  const ENTRY_CANDIDATES = [
    "src/main.tsx", "src/main.jsx", "src/main.ts", "src/main.js",
    "src/index.tsx", "src/index.jsx", "src/index.ts", "src/index.js",
    "src/App.tsx", "src/App.jsx", "src/App.ts", "src/App.js",
    "main.tsx", "main.jsx", "index.tsx", "index.jsx", "index.ts", "index.js",
    "App.tsx", "App.jsx",
  ]
  if (!entry) {
    for (const c of ENTRY_CANDIDATES) {
      if (fileMap.has(c)) { entry = c; break }
    }
  }
  if (!entry) {
    const anyCode = files.find((f) => /\.(tsx|jsx|ts|js)$/i.test(f.path))
    if (!anyCode) {
      return NextResponse.json(
        { ok: false, error: "Nenhum ficheiro JS/TS encontrado para compilar" },
        { status: 422 }
      )
    }
    entry = normPath(anyCode.path)
  }

  /* ---- Monta sozinho? Senão criamos entry virtual com createRoot ---- */
  const mountsItself = files.some((f) =>
    /createRoot|ReactDOM\.render|hydrateRoot/.test(f.content)
  )
  if (!mountsItself) {
    const appFile = fileMap.has("src/App.tsx") ? "src/App.tsx"
      : fileMap.has("src/App.jsx") ? "src/App.jsx"
      : entry
    fileMap.set(
      "__preview_entry__.tsx",
      `import React from "react"
import { createRoot } from "react-dom/client"
import App from "./${appFile}"
let el = document.getElementById("root")
if (!el) { el = document.createElement("div"); el.id = "root"; document.body.appendChild(el) }
createRoot(el).render(React.createElement(App))`
    )
    entry = "__preview_entry__.tsx"
  }

  /* ---- Plugins: filesystem virtual + resolução HTTP (esm.sh) ---- */
  const httpCache = new Map<string, Promise<string>>()
  async function fetchText(url: string): Promise<string> {
    const cached = httpCache.get(url)
    if (cached) return cached
    const p = fetch(url, { redirect: "follow" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`)
        return r.text()
      })
    httpCache.set(url, p)
    return p
  }

  const vfsPlugin: esbuild.Plugin = {
    name: "vfs",
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        const spec = args.path

        /* já é URL absoluta (resolvida dentro de módulo http) */
        if (/^https?:\/\//.test(spec)) {
          return { path: spec, namespace: "http" }
        }
        /* relativo dentro de módulo http → resolve contra o importer */
        if (args.namespace === "http") {
          try {
            const resolved = new URL(spec, args.importer).toString()
            return { path: resolved, namespace: "http" }
          } catch {
            return { path: spec, namespace: "stub" }
          }
        }
        if (args.kind === "entry-point") {
          const cand = normPath(spec)
          if (fileMap.has(cand)) return { path: cand, namespace: "vfs" }
          return { path: spec, namespace: "stub" }
        }
        /* alias @/ → src/ */
        if (spec.startsWith("@/")) {
          const base = "src/" + spec.slice(2)
          const candidates = [
            ...RESOLVE_EXTS.map((e) => base + e),
            ...RESOLVE_INDEX.map((i) => base + i),
          ]
          for (const c of candidates) {
            if (fileMap.has(c)) return { path: c, namespace: "vfs" }
          }
          return { path: spec, namespace: "stub" }
        }
        /* relativo local */
        if (spec.startsWith(".") || spec.startsWith("/")) {
          const base = resolveRel(normPath(args.importer), spec)
          const candidates = [
            ...RESOLVE_EXTS.map((e) => base + e),
            ...RESOLVE_INDEX.map((i) => base + i),
          ]
          for (const c of candidates) {
            if (fileMap.has(c)) return { path: c, namespace: "vfs" }
          }
          return { path: spec, namespace: "stub" }
        }
        /* bare import → dep npm via esm.sh, inlinada no bundle */
        if (NODE_BUILTINS_RE.test(spec)) return { path: spec, namespace: "stub" }
        return { path: depUrl(spec), namespace: "http" }
      })

      build.onLoad({ filter: /.*/, namespace: "vfs" }, (args) => ({
        contents: fileMap.get(args.path),
        loader: loaderFor(args.path),
      }))

      build.onLoad({ filter: /.*/, namespace: "http" }, async (args) => {
        const source = await fetchText(args.path)
        const clean = args.path.split("?")[0]
        /* CSS importado de CDN descartado — não é JS */
        if (/\.css$/i.test(clean)) return { contents: "", loader: "js" }
        return { contents: source, loader: loaderFor(clean) }
      })

      build.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
        contents: STUB_MODULE,
        loader: "js",
      }))
    },
  }

  try {
    const result = await esbuild.build({
      entryPoints: [entry],
      bundle: true,
      write: false,
      format: "esm",
      jsx: "automatic",
      jsxImportSource: "react",
      minify: true,
      outfile: "preview.js",
      plugins: [vfsPlugin],
      logLevel: "silent",
      define: { "process.env.NODE_ENV": '"production"' },
    })

    let js = ""
    let css = ""
    for (const out of result.outputFiles || []) {
      if (out.path.endsWith(".css")) css += out.text + "\n"
      else js += out.text + "\n"
    }

    if (!js.trim()) {
      return NextResponse.json(
        { ok: false, error: "Bundle vazio — entry não produziu código" },
        { status: 422 }
      )
    }

    /* Tailwind CDN se o projeto declarar tailwind — className fica funcional */
    const usesTailwind =
      files.some((f) => /tailwind\.config\.(ts|js|cjs|mjs)$/i.test(f.path)) ||
      (pkgJson ? /"tailwindcss"/.test(pkgJson) : false)
    const tailwindTag = usesTailwind
      ? `<script src="https://cdn.tailwindcss.com"></script>`
      : ""

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${htmlTitle.replace(/[<>&"]/g, "")}</title>
${tailwindTag}
<style>
html, body { margin: 0; padding: 0; min-height: 100%; }
#root { min-height: 100vh; }
${css}
</style>
</head>
<body>
<div id="root"></div>
<script type="module">
${escapeInline(js, "script")}
</script>
</body>
</html>`

    /* Persiste o preview como página real em /previews/<proj>.html —
       o iframe carrega por URL (sem srcDoc, sem localStorage, F5-safe).
       Na Vercel o fs é read-only → falha silenciosa, o html é devolvido
       na mesma e o cliente usa srcDoc como fallback. */
    let url = ""
    const slug = (body.project || "preview").replace(/[^\w-]/g, "-").toLowerCase()
    try {
      const dir = path.join(process.cwd(), "public", "previews")
      await fsp.mkdir(dir, { recursive: true })
      await fsp.writeFile(path.join(dir, `${slug}.html`), html, "utf8")
      url = `/previews/${slug}.html`
    } catch {
      url = ""
    }

    return NextResponse.json({ ok: true, html, url, bundled: true, entry })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "erro"
    return NextResponse.json(
      { ok: false, error: `Falha no bundling: ${msg.slice(0, 400)}` },
      { status: 422 }
    )
  }
}
