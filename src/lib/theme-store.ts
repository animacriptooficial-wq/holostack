const PROJECT = "__settings__"
const PATH = "site_theme"

const VALID_THEMES = new Set([
  "carbon",
  "cyber",
  "obsidian",
  "royal",
  "crimson",
  "arctic",
  "solar",
  "matrix",
  "sunset",
  "titanium",
])

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "")
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return null
  return { url, key }
}

export function isValidThemeId(value: unknown): value is string {
  return typeof value === "string" && VALID_THEMES.has(value)
}

export async function getSiteTheme(): Promise<string | null> {
  const cfg = config()
  if (!cfg) return null
  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/holostack_files?project=eq.${PROJECT}&path=eq.${PATH}&select=content&limit=1`,
      {
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
        },
        cache: "no-store",
      }
    )
    if (!res.ok) return null
    const rows = (await res.json()) as { content?: string }[]
    const theme = rows[0]?.content?.trim()
    return theme && VALID_THEMES.has(theme) ? theme : null
  } catch {
    return null
  }
}

export async function setSiteTheme(theme: string): Promise<boolean> {
  const cfg = config()
  if (!cfg || !VALID_THEMES.has(theme)) return false
  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/holostack_files?on_conflict=project,path`,
      {
        method: "POST",
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({ project: PROJECT, path: PATH, content: theme }),
      }
    )
    return res.ok
  } catch {
    return false
  }
}
