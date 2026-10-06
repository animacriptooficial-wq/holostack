import { NextResponse } from "next/server"
import { execFileSync } from "child_process"
import fs from "fs/promises"
import { existsSync, readdirSync } from "fs"
import path from "path"
import { githubConfig, commitFilesToGitHub } from "@/lib/github"
import { supabaseConfig, supabaseSaveFiles } from "@/lib/supabase"

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

/* Resolve o binário git de forma robusta:
   1. `git` do PATH do sistema
   2. HOLOSTACK_GIT (env)
   3. GitHub Desktop bundled — qualquer app-* (a versão muda a cada update) */
function resolveGit(): string | null {
  const candidates: string[] = []

  if (process.env.HOLOSTACK_GIT) candidates.push(process.env.HOLOSTACK_GIT)
  candidates.push("git") // PATH global

  try {
    const desktopRoot = path.join(
      process.env.LOCALAPPDATA || "",
      "GitHubDesktop"
    )
    if (existsSync(desktopRoot)) {
      const appDirs = readdirSync(desktopRoot)
        .filter((d) => /^app-/.test(d))
        .sort()
        .reverse() // versão mais recente primeiro
      for (const dir of appDirs) {
        candidates.push(
          path.join(desktopRoot, dir, "resources", "app", "git", "cmd", "git.exe")
        )
      }
    }
  } catch {
    /* sem acesso ao dir — segue com os candidatos anteriores */
  }

  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ["--version"], {
        encoding: "utf-8",
        timeout: 10000,
        stdio: ["ignore", "pipe", "pipe"],
      })
      return candidate
    } catch {
      continue
    }
  }
  return null
}

function runGit(gitBin: string, args: string[], cwd: string): { ok: boolean; output: string } {
  try {
    const output = execFileSync(gitBin, args, {
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
    return NextResponse.json({ ok: false, written: 0, log: ["Pedido inválido"] }, { status: 400 })
  }

  const projectName = safeSegment(body.projectName || "holostack-app")
  const sliceId = body.sliceId || 0
  const files = Array.isArray(body.files) ? body.files : []

  const root = process.cwd()
  const targetDir = path.join(root, "generated", projectName)

  /* ─────────────────────────────────────────────────────────────
     FASE 1 — GRAVAÇÃO FÍSICA (só em ambiente local; na Vercel o
     fs é read-only e cada write falha — detetado e tolerado)
  ───────────────────────────────────────────────────────────── */
  let written = 0
  let writePhaseFailed = false
  const isServerless = !!process.env.VERCEL
  if (!isServerless) {
    for (const file of files) {
      try {
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
      } catch (err) {
        const msg = err instanceof Error ? err.message : "falha de escrita"
        log.push(`✗ falha ao gravar ${file.path}: ${msg}`)
        writePhaseFailed = true
      }
    }
    log.push(`✓ ${written}/${files.length} ficheiros escritos em generated/${projectName}`)
  }

  /* ─────────────────────────────────────────────────────────────
     FASE 2 — SUPABASE (persistência cloud da base de dados)
  ───────────────────────────────────────────────────────────── */
  const sb = supabaseConfig()
  if (sb && files.length > 0) {
    const res = await supabaseSaveFiles(sb, projectName, files)
    log.push(
      res.ok
        ? `✓ Supabase — ${files.length} ficheiros persistidos na nuvem`
        : `✗ Supabase falhou: ${res.error}`
    )
  }

  /* ─────────────────────────────────────────────────────────────
     FASE 3 — GITHUB API (cloud-native: commit direto no repo via
     REST, sem binário git — é o caminho único na Vercel)
  ───────────────────────────────────────────────────────────── */
  const gh = githubConfig()
  if (gh && files.length > 0) {
    try {
      const sha = await commitFilesToGitHub(
        gh,
        `generated/${projectName}`,
        files,
        `feat(holostack): auto-build [Fatia ${sliceId}] - verified & self-healed`
      )
      log.push(`✓ GitHub API — commit ${sha.slice(0, 7)} pushed para ${gh.repo}`)
      return NextResponse.json({
        ok: !writePhaseFailed,
        phase: "sync",
        written,
        cloud: true,
        log,
      })
    } catch (err) {
      log.push(`✗ GitHub API falhou: ${err instanceof Error ? err.message : "erro"}`)
      /* continua para o git local se existir */
    }
  }

  /* ─────────────────────────────────────────────────────────────
     FASE 4 — GIT LOCAL (apenas dev local com binário disponível)
  ───────────────────────────────────────────────────────────── */
  if (isServerless) {
    return NextResponse.json({ ok: true, phase: "sync", written, cloud: true, log })
  }


  /* ─────────────────────────────────────────────────────────────
     FASE 2 — GIT (opcional; qualquer falha aqui é apenas warning,
     os ficheiros já estão garantidos no disco)
  ───────────────────────────────────────────────────────────── */
  const gitBin = resolveGit()
  if (!gitBin) {
    log.push(`· git não encontrado (PATH/env/GitHub Desktop) — ficheiros gravados, sync pendente`)
    return NextResponse.json({
      ok: !writePhaseFailed,
      phase: "write",
      written,
      gitSkipped: true,
      log,
    })
  }

  const add = runGit(gitBin, ["add", "-A", "generated/"], root)
  log.push(add.ok ? `✓ git add . — staging completo` : `✗ git add falhou: ${add.output.split("\n")[0]}`)

  if (add.ok) {
    const commitMsg = `feat(holostack): auto-build [Fatia ${sliceId}] - verified & self-healed`
    const commit = runGit(gitBin, ["commit", "-m", commitMsg], root)
    const nothingToCommit = /nothing to commit|working tree clean/i.test(commit.output)
    log.push(
      commit.ok
        ? `✓ git commit — "${commitMsg}"`
        : nothingToCommit
        ? `· git commit — sem alterações novas`
        : `✗ git commit falhou: ${commit.output.split("\n")[0]}`
    )

    const push = runGit(gitBin, ["push", "origin", "main"], root)
    if (push.ok) {
      log.push(`✓ git push origin main — repositório sincronizado`)
    } else {
      const reason = /authentication|Invalid username|403|could not read/i.test(push.output)
        ? "falha de autenticação GitHub (credenciais ausentes)"
        : push.output.split("\n")[0]
      log.push(`✗ git push falhou: ${reason}`)
      log.push(`· ficheiros gravados e commitados localmente — push pendente`)
    }
  } else {
    log.push(`· pipeline git abortado — ficheiros permanecem gravados no disco`)
  }

  return NextResponse.json({ ok: !writePhaseFailed, phase: "sync", written, log })
}
