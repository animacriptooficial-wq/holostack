import { NextResponse } from "next/server"
import { execFileSync } from "child_process"
import fs from "fs/promises"
import { existsSync, readdirSync } from "fs"
import path from "path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function gitAvailable(): boolean {
  const candidates: string[] = []
  if (process.env.HOLOSTACK_GIT) candidates.push(process.env.HOLOSTACK_GIT)
  candidates.push("git")
  try {
    const desktopRoot = path.join(process.env.LOCALAPPDATA || "", "GitHubDesktop")
    if (existsSync(desktopRoot)) {
      for (const dir of readdirSync(desktopRoot).filter((d) => /^app-/.test(d)).sort().reverse()) {
        candidates.push(path.join(desktopRoot, dir, "resources", "app", "git", "cmd", "git.exe"))
      }
    }
  } catch {
    /* ignora — segue com PATH/env */
  }
  for (const bin of candidates) {
    try {
      execFileSync(bin, ["--version"], { timeout: 8000, stdio: ["ignore", "pipe", "pipe"] })
      return true
    } catch {
      continue
    }
  }
  return false
}

export async function GET() {
  const components: { name: string; ok: boolean; detail: string }[] = []

  /* Disco — tenta gravar e apagar um probe real em generated/ */
  try {
    const probeDir = path.join(process.cwd(), "generated", ".health")
    await fs.mkdir(probeDir, { recursive: true })
    const probe = path.join(probeDir, "probe.tmp")
    await fs.writeFile(probe, String(Date.now()), "utf-8")
    await fs.unlink(probe)
    components.push({ name: "filesystem", ok: true, detail: "escrita/leitura em generated/ operacional" })
  } catch (err) {
    components.push({
      name: "filesystem",
      ok: false,
      detail: `sem escrita persistente — ${err instanceof Error ? err.message.slice(0, 60) : "erro"}`,
    })
  }

  /* Git — executável resolvível */
  const git = gitAvailable()
  components.push({
    name: "git",
    ok: git,
    detail: git ? "git resolvido e executável" : "git não encontrado (PATH/env/Desktop)",
  })

  /* Runtime */
  components.push({
    name: "runtime",
    ok: true,
    detail: `node ${process.version} · uptime ${Math.round(process.uptime())}s`,
  })

  const ok = components.every((c) => c.ok)
  return NextResponse.json({ ok, components, ts: Date.now() }, { status: ok ? 200 : 503 })
}
