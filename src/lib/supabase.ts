/* ============================================================
   SUPABASE STORAGE CLIENT — cloud-native, zero dependência npm
   Persistência de ficheiros gerados no bucket público
   "holostack" via Storage API. Sem SQL, sem tabela.
   Env: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (sb_secret_)
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

const BUCKET = "holostack"

function headers(cfg: SupabaseConfig): Record<string, string> {
  return {
    apikey: cfg.key,
    Authorization: `Bearer ${cfg.key}`,
  }
}

export function supabasePublicUrl(cfg: SupabaseConfig, key: string): string {
  return `${cfg.url}/storage/v1/object/public/${BUCKET}/${key}`
}

function contentTypeFor(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || ""
  const map: Record<string, string> = {
    html: "text/html", css: "text/css", js: "text/javascript",
    mjs: "text/javascript", json: "application/json", ts: "text/plain",
    tsx: "text/plain", jsx: "text/plain", md: "text/markdown",
    txt: "text/plain", svg: "image/svg+xml", png: "image/png",
    jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp",
  }
  return map[ext] || "text/plain"
}

/* Upload de um ficheiro para o bucket (upsert). Devolve o URL público. */
export async function supabaseUploadFile(
  cfg: SupabaseConfig,
  key: string,
  content: string
): Promise<string | null> {
  try {
    const res = await fetch(`${cfg.url}/storage/v1/object/${BUCKET}/${key}`, {
      method: "POST",
      headers: {
        ...headers(cfg),
        "Content-Type": contentTypeFor(key),
        "x-upsert": "true",
        "cache-control": "3600",
      },
      body: content,
    })
    return res.ok ? supabasePublicUrl(cfg, key) : null
  } catch {
    return null
  }
}

/* Upsert em lote — cada ficheiro como objeto individual */
export async function supabaseSaveFiles(
  cfg: SupabaseConfig,
  project: string,
  files: { path: string; content: string }[]
): Promise<{ ok: boolean; saved: number; error?: string }> {
  let saved = 0
  let lastErr = ""
  for (const f of files) {
    const url = await supabaseUploadFile(cfg, `${project}/${f.path}`, f.content)
    if (url) saved++
    else lastErr = `falha upload: ${f.path}`
  }
  if (saved === 0 && files.length > 0) {
    return { ok: false, saved: 0, error: lastErr || "nenhum ficheiro gravado" }
  }
  return { ok: true, saved }
}

/* Lista recursivamente os objetos de um projeto e descarrega cada um.
   Pastas no Storage têm id null — desce até encontrar ficheiros. */
export async function supabaseReadFiles(
  cfg: SupabaseConfig,
  project: string
): Promise<{ path: string; content: string }[]> {
  const files: { path: string; content: string }[] = []

  async function walk(prefix: string, depth: number) {
    if (depth > 6) return
    const listRes = await fetch(`${cfg.url}/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: { ...headers(cfg), "Content-Type": "application/json" },
      body: JSON.stringify({ prefix, limit: 200, offset: 0 }),
    })
    if (!listRes.ok) return
    const entries = (await listRes.json()) as { name: string; id: string | null }[]
    if (!Array.isArray(entries)) return
    for (const e of entries) {
      if (!e.name) continue
      if (e.id === null) {
        await walk(`${prefix}${e.name}/`, depth + 1)
        continue
      }
      const key = `${prefix}${e.name}`
      const res = await fetch(supabasePublicUrl(cfg, key), { cache: "no-store" }).catch(() => null)
      if (!res?.ok) continue
      const content = await res.text()
      if (content.length > 512 * 1024) continue
      files.push({ path: key.slice(`${project}/`.length), content })
    }
  }

  try {
    await walk(`${project}/`, 0)
    return files
  } catch {
    return files
  }
}
