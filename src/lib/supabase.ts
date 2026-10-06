/* ============================================================
   SUPABASE REST CLIENT — cloud-native, zero dependência npm
   Persistência de projetos/ficheiros gerados via PostgREST.
   Env: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (ou ANON_KEY)
   Tabela: holostack_files (project text, path text, content text,
   updated_at timestamptz) — PK composta (project, path)
   ============================================================ */

export interface SupabaseConfig {
  url: string
  key: string
}

export function supabaseConfig(): SupabaseConfig | null {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim()
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  ).trim()
  if (!url || !key || !/^https?:\/\//.test(url)) return null
  return { url: url.replace(/\/+$/, ""), key }
}

function headers(cfg: SupabaseConfig, extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: cfg.key,
    Authorization: `Bearer ${cfg.key}`,
    "Content-Type": "application/json",
    ...extra,
  }
}

/* Upsert em lote — PK (project, path) com merge-duplicates */
export async function supabaseSaveFiles(
  cfg: SupabaseConfig,
  project: string,
  files: { path: string; content: string }[]
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${cfg.url}/rest/v1/holostack_files`, {
      method: "POST",
      headers: headers(cfg, { Prefer: "resolution=merge-duplicates" }),
      body: JSON.stringify(
        files.map((f) => ({ project, path: f.path, content: f.content }))
      ),
    })
    if (!res.ok) {
      const t = await res.text()
      return { ok: false, error: `Supabase ${res.status}: ${t.slice(0, 200)}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "rede" }
  }
}

export async function supabaseReadFiles(
  cfg: SupabaseConfig,
  project: string
): Promise<{ path: string; content: string }[]> {
  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/holostack_files?project=eq.${encodeURIComponent(project)}&select=path,content`,
      { headers: headers(cfg), cache: "no-store" }
    )
    if (!res.ok) return []
    const rows = (await res.json()) as { path: string; content: string }[]
    return Array.isArray(rows) ? rows : []
  } catch {
    return []
  }
}
