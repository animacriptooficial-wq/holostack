import { NextResponse } from "next/server"
import * as esbuild from "esbuild"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

/* ============================================================
   COMPILADOR DE PREVIEW REAL
   Bundla o código-fonte gerado (TSX/TS/JS/CSS) com esbuild em
   memória e devolve um documento HTML5 self-contained cujo JS
   corre via <script type="module"> + importmap (esm.sh) para as
   dependências npm. Determinístico — sem IA, sem bundler local.
   ============================================================ */

interface PreviewFile {
  path: string
  content: string
}

const NODE_BUILTINS = new Set([
  "fs", "path", "os", "crypto", "http", "https", "url", "util", "stream",
  "events", "buffer", "child_process", "net", "tls", "zlib", "querystring",
  "assert", "module", "process", "node:fs", "node:path", "node:os",
  "node:crypto", "node:http", "node:https", "node:url", "node:util",
  "node:stream", "node:events", "node:buffer", "node:child_process",
])

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
  const ext = path.split(".").pop()?.toLowerCase() || ""
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
    default: return "text"
  }
}

const RESOLVE_EXTS = ["", ".tsx", ".ts", ".jsx", ".js", ".json"]
const RESOLVE_INDEX = ["/index.tsx", "/index.ts", "/index.jsx", "/index.js"]

function pkgRoot(spec: string): string {
  const parts = spec.split("/")
  return spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]
}

function cleanVersion(v: string | undefined): string {
  if (!v) return ""
  const cleaned = v.trim().replace(/^[\^~<>=\s]+/, "")
  return /^[\w.\-]+$/.test(cleaned) && cleaned !== "latest" && cleaned !== "*" ? cleaned : ""
}

function escapeInline(code: string, tag: string): string {
  return code.replace(new RegExp(`</${tag}`, "gi"), `<\\/${tag}`)
}

export async function POST(req: Request) {
  let body: { files?: PreviewFile[] }
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

  /* ---- Entry point: script src do index.html, ou convenções Vite/React ---- */
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

  /* ---- O código monta React sozinho (createRoot/render)? ---- */
  const mountsItself = files.some((f) =>
    /createRoot|ReactDOM\.render|hydrateRoot|\.render\(/.test(f.content)
  )

  /* Se não monta, criamos um entry virtual que importa o App e monta */
  if (!mountsItself) {
    const appFile =
      fileMap.has("src/App.tsx") ? "src/App.tsx"
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

  /* ---- Bundling esbuild com filesystem virtual ---- */
  const vfsPlugin: esbuild.Plugin = {
    name: "vfs",
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        const spec = args.path
        if (args.kind === "entry-point") {
          const cand = normPath(spec)
          if (fileMap.has(cand)) return { path: cand, namespace: "vfs" }
          return { path: spec, external: true }
        }
        if (spec.startsWith("@/")) {
          const base = "src/" + spec.slice(2)
          const candidates = [
            ...RESOLVE_EXTS.map((e) => base + e),
            ...RESOLVE_INDEX.map((i) => base + i),
          ]
          for (const c of candidates) {
            if (fileMap.has(c)) return { path: c, namespace: "vfs" }
          }
          return { path: spec, external: true }
        }
        if (spec.startsWith(".") || spec.startsWith("/")) {
          const base = resolveRel(normPath(args.importer), spec)
          const candidates = [
            ...RESOLVE_EXTS.map((e) => base + e),
            ...RESOLVE_INDEX.map((i) => base + i),
          ]
          for (const c of candidates) {
            if (fileMap.has(c)) return { path: c, namespace: "vfs" }
          }
          return { path: spec, external: true }
        }
        return { path: spec, external: true }
      })
      build.onLoad({ filter: /.*/, namespace: "vfs" }, (args) => ({
        contents: fileMap.get(args.path),
        loader: loaderFor(args.path),
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
      outfile: "preview.js",
      plugins: [vfsPlugin],
      logLevel: "silent",
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

    /* ---- Imports bare que ficaram no bundle (externals reais) ---- */
    const specifiers = new Set<string>()
    const specRe = /(?:from|import)\s*\(?\s*["']([^"'.][^"']*)["']/g
    let sm: RegExpExecArray | null
    while ((sm = specRe.exec(js))) {
      const s = sm[1]
      if (s && !s.startsWith("@/") && !s.startsWith("data:")) specifiers.add(s)
    }

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
    /* react e react-dom têm de ser o mesmo número de versão —
       mismatch causa "Invalid hook call" no iframe */
    const reactVer = versions.get("react") || "18.3.1"
    versions.set("react", reactVer)
    versions.set("react-dom", versions.get("react-dom") || reactVer)

    const BUILTIN_STUB =
      "data:text/javascript;charset=utf-8," +
      encodeURIComponent("const p=new Proxy({},{get:()=>()=>p});export default p;")

    const imports: Record<string, string> = {}
    for (const spec of specifiers) {
      if (NODE_BUILTINS.has(spec)) { imports[spec] = BUILTIN_STUB; continue }
      const root = pkgRoot(spec)
      if (NODE_BUILTINS.has(root)) { imports[spec] = BUILTIN_STUB; continue }
      const ver = versions.get(root) || ""
      const sub = spec.slice(root.length)
      const base = `https://esm.sh/${root}${ver ? "@" + ver : ""}${sub}`
      imports[spec] =
        root === "react" ? base : `${base}?external=react,react-dom`
      if (!imports[root]) {
        imports[root] =
          root === "react"
            ? `https://esm.sh/${root}${ver ? "@" + ver : ""}`
            : `https://esm.sh/${root}${ver ? "@" + ver : ""}?external=react,react-dom`
      }
      const prefix = `${root}/`
      if (!imports[prefix]) {
        imports[prefix] = `https://esm.sh/${root}${ver ? "@" + ver : ""}/`
      }
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${htmlTitle.replace(/[<>&"]/g, "")}</title>
<style>
html, body { margin: 0; padding: 0; min-height: 100%; }
#root { min-height: 100vh; }
${css}
</style>
<script type="importmap">
${JSON.stringify({ imports }, null, 0)}
</script>
</head>
<body>
<div id="root"></div>
<script type="module">
${escapeInline(js, "script")}
</script>
</body>
</html>`

    return NextResponse.json({ ok: true, html, bundled: true, entry })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "erro"
    return NextResponse.json(
      { ok: false, error: `Falha no bundling: ${msg.slice(0, 400)}` },
      { status: 422 }
    )
  }
}
