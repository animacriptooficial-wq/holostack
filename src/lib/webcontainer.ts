"use client"

/* ============================================================
   WEBCONTAINER ENGINE — extraído do padrão bolt.diy
   (github.com/stackblitz-labs/bolt.diy)

   Ciclo de vida completo do ambiente de dev no browser:
   boot() → mount(ficheiros) → spawn(npm install) →
   spawn(npm run dev) → server-ready → iframe.src = URL real.

   O preview deixa de ser um bloco estático — é Node.js a
   correr de verdade dentro do browser via WebAssembly.
   ============================================================ */

import type { GeneratedFile } from "./engine"
import type { FileSystemTree, WebContainer } from "@webcontainer/api"

export interface WcPreviewMessage {
  type: string
  message?: string
  pathname?: string
  port?: number
  stack?: string
}

export interface WcRunResult {
  url: string
  wc: WebContainer
}

let wcPromise: Promise<WebContainer> | null = null

export async function bootWebContainer(
  onPreviewMessage?: (msg: WcPreviewMessage) => void
): Promise<WebContainer> {
  if (!wcPromise) {
    wcPromise = (async () => {
      const { WebContainer } = await import("@webcontainer/api")
      const wc = await WebContainer.boot({
        coep: "credentialless",
        workdirName: "holostack-app",
        forwardPreviewErrors: true,
      })
      /* Erros dentro do iframe do preview são reencaminhados —
         o padrão bolt.diy (PREVIEW_UNCAUGHT_EXCEPTION etc.) */
      wc.on("preview-message", (raw) => {
        onPreviewMessage?.(raw as unknown as WcPreviewMessage)
      })
      return wc
    })()
  }
  return wcPromise
}

/* GeneratedFile[] → FileSystemTree aninhada para mount() */
export function filesToTree(files: GeneratedFile[]): FileSystemTree {
  const tree: FileSystemTree = {}
  for (const f of files) {
    const parts = f.path.replace(/\\/g, "/").replace(/^\/+/, "").split("/").filter(Boolean)
    if (parts.length === 0) continue
    let node = tree as unknown as Record<string, unknown>
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

/* Comando de arranque conforme os scripts do package.json gerado */
function devCommand(files: GeneratedFile[]): string[] {
  const pkgRaw = files.find((f) => f.path.replace(/^\.?\//, "") === "package.json")
  try {
    const pkg = pkgRaw ? JSON.parse(pkgRaw.content) : {}
    const scripts = (pkg.scripts || {}) as Record<string, string>
    if (scripts.dev) return ["run", "dev"]
    if (scripts.start) return ["start"]
  } catch {
    /* package.json inválido — fallback vite */
  }
  return ["exec", "vite", "--", "--host"]
}

async function streamOutput(
  proc: { output: ReadableStream<string> },
  log: (m: string) => void,
  tag: string
) {
  await proc.output
    .pipeTo(
      new WritableStream({
        write(chunk) {
          for (const line of String(chunk).split("\n")) {
            const t = line.trim()
            if (t) log(`${tag}: ${t.slice(0, 140)}`)
          }
        },
      })
    )
    .catch(() => {})
}

/* Executa um comando arbitrário dentro do container e aguarda exit */
export async function wcRun(
  cmd: string,
  args: string[],
  log: (m: string) => void
): Promise<number> {
  const wc = await wcPromise
  if (!wc) return -1
  const proc = await wc.spawn(cmd, args)
  streamOutput(proc, log, cmd)
  return proc.exit
}

/* Escreve/atualiza um ficheiro dentro do container ativo (HOT-EDIT) */
export async function wcWriteFile(path: string, content: string): Promise<boolean> {
  try {
    const wc = await wcPromise
    if (!wc) return false
    const dir = path.split("/").slice(0, -1).join("/")
    if (dir) await wc.fs.mkdir(dir, { recursive: true })
    await wc.fs.writeFile(path, content)
    return true
  } catch {
    return false
  }
}

/**
 * Sobe o projeto inteiro no container: mount → install → dev server.
 * Devolve o URL público do dev server para o iframe.
 */
export async function runProjectInWebContainer(
  files: GeneratedFile[],
  log: (msg: string) => void,
  onPreviewMessage?: (msg: WcPreviewMessage) => void
): Promise<WcRunResult> {
  const wc = await bootWebContainer(onPreviewMessage)
  log("⛨ WebContainer iniciado — Node.js real no browser")

  await wc.mount(filesToTree(files))
  log(`⛨ ${files.length} ficheiros montados no container`)

  /* npm install dentro do container */
  log("⛨ npm install no container...")
  const install = await wc.spawn("npm", [
    "install", "--no-audit", "--no-fund", "--loglevel", "error",
  ])
  const logPump = streamOutput(install, log, "npm")
  const installCode = await Promise.race([
    install.exit,
    new Promise<number>((_, rej) =>
      setTimeout(() => rej(new Error("npm install timeout (180s)")), 180_000)
    ),
  ])
  await logPump
  if (installCode !== 0) throw new Error(`npm install falhou (exit ${installCode})`)
  log("✓ npm install concluído")

  /* dev server — não bloqueia; o server-ready devolve o URL */
  const args = devCommand(files)
  log(`⛨ npm ${args.join(" ")} — a levantar o dev server...`)
  wc.spawn("npm", args).then((proc) => streamOutput(proc, log, "dev"))

  const url = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("timeout à espera do dev server (150s)")),
      150_000
    )
    wc.on("server-ready", (_port, readyUrl) => {
      clearTimeout(timeout)
      resolve(readyUrl)
    })
    wc.on("error", (err) => {
      clearTimeout(timeout)
      reject(new Error(err.message || "erro no container"))
    })
  })

  return { url, wc }
}
