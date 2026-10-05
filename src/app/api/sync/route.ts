import { NextResponse } from "next/server"
import { execFileSync } from "child_process"
import fs from "fs/promises"
import path from "path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface SyncFile {
  path: string
  content: string
}

interface SyncRequest {
  projectName?: string
  files?: SyncFile[]
  sliceId?: number
}

const GIT_BIN =
  process.env.HOLOSTACK_GIT ||
  "C:\\Users\\tete1\\AppData\\Local\\GitHubDesktop\\app-3.6.6\\resources\\app\\git\\cmd\\git.exe"

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80) || "project"
}

function safeRelativePath(p: string): string | null {
  const normalized = p.replace(/\\/g, "/").replace(/^\/+/, "")
  if (!normalized || normalized.split("/").some((part) => part === ".." || part === "")) {
    return null
  }
  return normalized
}

function runGit(args: string[], cwd: string): { ok: boolean; output: string } {
  try {
    const output = execFileSync(GIT_BIN, args, {
      cwd,
      encoding: "utf-8",
      timeout: 60000,
      stdio: ["ignore", "pipe", "pipe"],
    })
    return { ok: true, output: output.trim() }
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message?: string }
    return {
      ok: false,
      output: (e.stderr || e.stdout || e.message || "git falhou").trim(),
    }
  }
}

export async function POST(req: Request) {
  const log: string[] = []

  let body: SyncRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, log: ["Pedido inválido"] }, { status: 400 })
  }

  const projectName = safeSegment(body.projectName || "holostack-app")
  const sliceId = body.sliceId || 0
  const files = Array.isArray(body.files) ? body.files : []

  const root = process.cwd()
  const targetDir = path.join(root, "generated", projectName)

  /* 1. Escrever ficheiros físicos */
  let written = 0
  try {
    for (const file of files) {
      const rel = safeRelativePath(file.path)
      if (!rel) {
        log.push(`✗ caminho inválido ignorado: ${file.path}`)
        continue
      }
      const fullPath = path.join(targetDir, rel)
      if (!fullPath.startsWith(targetDir)) {
        log.push(`✗ caminho fora do diretório ignorado: ${file.path}`)
        continue
      }
      await fs.mkdir(path.dirname(fullPath), { recursive: true })
      await fs.writeFile(fullPath, file.content, "utf-8")
      written++
    }
    log.push(`✓ ${written}/${files.length} ficheiros escritos em generated/${projectName}`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "falha de escrita"
    log.push(`✗ Escrita de ficheiros falhou: ${msg}`)
    return NextResponse.json(
      { ok: false, phase: "write", log },
      { status: 500 }
    )
  }

  /* 2. git add */
  const add = runGit(["add", "-A", "generated/"], root)
  log.push(add.ok ? `✓ git add . — staging completo` : `✗ git add falhou: ${add.output}`)
  if (!add.ok) {
    return NextResponse.json({ ok: false, phase: "git-add", log }, { status: 500 })
  }

  /* 3. git commit */
  const commitMsg = `feat(holostack): auto-build [Fatia ${sliceId}] - verified & self-healed`
  const commit = runGit(["commit", "-m", commitMsg], root)
  const nothingToCommit = /nothing to commit|working tree clean/i.test(commit.output)
  log.push(
    commit.ok
      ? `✓ git commit — "${commitMsg}"`
      : nothingToCommit
      ? `· git commit — sem alterações novas`
      : `✗ git commit falhou: ${commit.output.split("\n")[0]}`
  )

  /* 4. git push */
  const push = runGit(["push", "origin", "main"], root)
  if (push.ok) {
    log.push(`✓ git push origin main — repositório sincronizado`)
  } else {
    const reason = /authentication|Invalid username|403/i.test(push.output)
      ? "falha de autenticação GitHub (token/credenciais ausentes)"
      : push.output.split("\n")[0]
    log.push(`✗ git push falhou: ${reason}`)
    log.push(`· ficheiros commitados localmente — push pendente`)
    return NextResponse.json({ ok: false, phase: "git-push", log, written }, { status: 200 })
  }

  return NextResponse.json({ ok: true, log, written })
}
