"use client"

/* ============================================================
   WEBCONTAINER RUNTIME — padrão bolt.diy
   Corre o projeto gerado NUM NODE.JS REAL dentro do browser:
   mount(ficheiros) → npm install → npm run dev → URL do dev
   server no iframe. Sem bundle, sem reescrita — é o projeto
   verdadeiro a executar.
   ============================================================ */

import type { GeneratedFile } from "./engine"
import type { FileSystemTree, WebContainer } from "@webcontainer/api"

let wcPromise: Promise<WebContainer> | null = null

async function boot(): Promise<WebContainer> {
  if (!wcPromise) {
    wcPromise = (async () => {
      const { WebContainer } = await import("@webcontainer/api")
      return WebContainer.boot({
        coep: "credentialless",
        workdirName: "holostack-app",
        forwardPreviewErrors: true,
      })
    })()
  }
  return wcPromise
}

/* GeneratedFile[] → FileSystemTree aninhada para mount() */
function toTree(files: GeneratedFile[]): FileSystemTree {
  const tree: FileSystemTree = {}
  for (const f of files) {
    const parts = f.path.replace(/\\/g, "/").replace(/^\/+/, "").split("/").filter(Boolean)
    if (parts.length === 0) continue
    let node: Record<string, unknown> = tree as unknown as Record<string, unknown>
    for (let i = 0; i < parts.length - 1; i++) {
      const dir = parts[i]
      const existing = node[dir] as { directory?: Record<string, unknown> } | undefined
      if (!existing?.directory) node[dir] = { directory: {} }
      node = (node[dir] as { directory: Record<string, unknown> }).directory
    }
    node[parts[parts.length - 1]] = { file: { contents: f.content } }
  }
  return tree
}

/* Deteta o comando de arranque do package.json gerado */
function devCommand(pkg: Record<string, unknown>): string[] {
  const scripts = (pkg.scripts || {}) as Record<string, string>
  if (scripts.dev) return ["run", "dev"]
  if (scripts.start) return ["start"]
  return ["run", "build"]
}

/**
 * Corre o projeto num WebContainer e devolve o URL do dev server.
 * Lança erro se falhar — o chamador faz fallback para o bundle.
 */
export async function runProjectInWebContainer(
  files: GeneratedFile[],
  log: (msg: string) => void
): Promise<string> {
  const wc = await boot()
  log("⛨ WebContainer iniciado — Node.js real no browser")

  const tree = toTree(files)
  await wc.mount(tree)
  log(`⛨ ${files.length} ficheiros montados no container`)

  const pkgRaw = files.find((f) => f.path.replace(/^\.?\//, "") === "package.json")
  let pkg: Record<string, unknown> = {}
  try {
    pkg = pkgRaw ? JSON.parse(pkgRaw.content) : {}
  } catch {
    pkg = {}
  }

  /* npm install — dentro do container */
  log("⛨ npm install no container...")
  const install = await wc.spawn("npm", ["install", "--no-audit", "--no-fund", "--loglevel", "error"])
  install.output.pipeTo(
    new WritableStream({
      write(chunk) {
        const line = String(chunk).trim()
        if (line && /error|warn|added/i.test(line)) log(`npm: ${line.slice(0, 120)}`)
      },
    })
  ).catch(() => {})
  const installCode = await install.exit
  if (installCode !== 0) throw new Error(`npm install falhou (exit ${installCode})`)
  log("✓ npm install concluído")

  /* dev server — npm run dev (vite/next) */
  const args = devCommand(pkg)
  log(`⛨ npm ${args.join(" ")} — a levantar o dev server...`)
  wc.spawn("npm", args).then((proc) => {
    proc.output.pipeTo(
      new WritableStream({
        write(chunk) {
          const line = String(chunk).trim()
          if (line) log(`dev: ${line.slice(0, 120)}`)
        },
      })
    ).catch(() => {})
  })

  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("timeout à espera do dev server (120s)")),
      120_000
    )
    wc.on("server-ready", (_port, url) => {
      clearTimeout(timeout)
      resolve(url)
    })
    wc.on("error", (err) => {
      clearTimeout(timeout)
      reject(new Error(err.message || "erro no container"))
    })
  })
}
