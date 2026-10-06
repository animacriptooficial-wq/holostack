import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import { githubConfig, readDirFromGitHub } from "@/lib/github"
import { supabaseConfig, supabaseReadFiles } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_FILE_BYTES = 512 * 1024
const MAX_TOTAL_BYTES = 4 * 1024 * 1024

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80) || "project"
}

/* GET /api/files?project=<nome> — re-hidrata o workspace lendo
   os ficheiros físicos de generated/<projeto>/ do disco */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const project = safeSegment(url.searchParams.get("project") || "")
  const root = path.join(process.cwd(), "generated", project)

  try {
    const stat = await fs.stat(root)
    if (!stat.isDirectory()) throw new Error("não é diretório")
  } catch {
    /* Sem disco (Vercel serverless) — fallbacks cloud */
    const sb = supabaseConfig()
    if (sb) {
      const rows = await supabaseReadFiles(sb, project)
      if (rows.length > 0) {
        return NextResponse.json({ ok: true, project, files: rows, fileCount: rows.length, source: "supabase" })
      }
    }
    const gh = githubConfig()
    if (gh) {
      const remote = await readDirFromGitHub(gh, `generated/${project}`)
      if (remote.length > 0) {
        return NextResponse.json({ ok: true, project, files: remote, fileCount: remote.length, source: "github" })
      }
    }
    return NextResponse.json(
      { ok: false, error: `Projeto "${project}" não existe em generated/ nem na nuvem` },
      { status: 404 }
    )
  }

  const files: { path: string; content: string }[] = []
  let total = 0

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const e of entries) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) {
        if (e.name === "node_modules" || e.name.startsWith(".")) continue
        await walk(full)
      } else if (e.isFile()) {
        if (total > MAX_TOTAL_BYTES) return
        const stat = await fs.stat(full)
        if (stat.size > MAX_FILE_BYTES) continue
        const content = await fs.readFile(full, "utf-8").catch(() => null)
        if (content === null) continue
        total += stat.size
        files.push({ path: path.relative(root, full).replace(/\\/g, "/"), content })
      }
    }
  }

  try {
    await walk(root)
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: `Falha a ler o projeto: ${err instanceof Error ? err.message : "erro"}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, project, files, fileCount: files.length })
}
