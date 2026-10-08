/* HoloStack PSO Cron Worker — corre a cada minuto.
   - Expurgo diário (03:00 UTC): DELETE /api/pso
   - Cadência de produção: consome 1 nicho da fila por minuto
     (Supabase object `pso_queue/next.json` = { niches: [...] })
     e dispara POST /api/pso com 10 páginas — exatamente a
     cadência de 10 blocos/min do spec. */

const BASE = () => (globalThis.BASE_URL || "https://holostack.holostack.workers.dev").replace(/\/$/, "")

async function readQueue(env) {
  const url = `${env.SUPABASE_URL}/storage/v1/object/public/holostack/pso_queue/next.json`
  try {
    const res = await fetch(url, { cf: { cacheTtl: 0 } })
    if (!res.ok) return { niches: [] }
    const data = await res.json()
    return { niches: Array.isArray(data.niches) ? data.niches : [] }
  } catch {
    return { niches: [] }
  }
}

async function writeQueue(env, niches) {
  await fetch(`${env.SUPABASE_URL}/storage/v1/object/holostack/pso_queue/next.json`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      "x-upsert": "true",
    },
    body: JSON.stringify({ niches }),
  })
}

async function produceNextNiche(env) {
  const queue = await readQueue(env)
  const niche = queue.niches.shift()
  if (!niche) return { idle: true }

  await writeQueue(env, queue.niches)

  const res = await fetch(`${BASE()}/api/pso`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ niche, count: 10 }),
  })
  const data = await res.json().catch(() => ({}))
  return { niche, generated: data.generated ?? 0, ok: res.ok }
}

async function dailyPurge(env) {
  const res = await fetch(`${BASE()}/api/pso`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${env.PSO_CRON_SECRET}` },
  })
  const data = await res.json().catch(() => ({}))
  return { purged: data.purged ?? 0, ok: res.ok }
}

export default {
  async scheduled(event, env, ctx) {
    const out = {}

    // Expurgo de 30 dias — uma vez por dia às 03:00 UTC
    const hour = new Date(event.scheduledTime ?? Date.now()).getUTCHours()
    if (hour === 3) {
      out.purge = await dailyPurge(env)
    }

    // Cadência PSO — 1 nicho (10 páginas) por minuto da fila
    out.batch = await produceNextNiche(env)

    console.log(JSON.stringify(out))
  },

  // GET /run — disparo manual para testes
  async fetch(request, env, ctx) {
    const out = {}
    const url = new URL(request.url)
    if (url.searchParams.get("purge") === "1") {
      out.purge = await dailyPurge(env)
    }
    out.batch = await produceNextNiche(env)
    return new Response(JSON.stringify(out, null, 2), {
      headers: { "Content-Type": "application/json" },
    })
  },
}
