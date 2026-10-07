import { NextRequest, NextResponse } from "next/server"
import { supabaseConfig, supabaseWriteJson, supabaseDeleteFile, supabaseReadFiles } from "@/lib/supabase"
import {
  generatePsoBatch,
  isPurgeable,
  PSO_CADENCE_PER_MINUTE,
  PSO_DAILY_TARGET,
  PSO_PURGE_DAYS,
  type PsoPage,
} from "@/lib/pso-engine"

export const dynamic = "force-dynamic"

const PSO_PREFIX = "pso"

async function loadPages(): Promise<{ slug: string; page: PsoPage }[]> {
  const cfg = supabaseConfig()
  if (!cfg) return []
  const files = await supabaseReadFiles(cfg, PSO_PREFIX)
  const pages: { slug: string; page: PsoPage }[] = []
  for (const f of files) {
    if (!f.path.endsWith(".json")) continue
    try {
      const page = JSON.parse(f.content) as PsoPage
      if (page.slug) pages.push({ slug: f.path, page })
    } catch {}
  }
  return pages
}

/* GET — stats do motor */
export async function GET() {
  const cfg = supabaseConfig()
  if (!cfg) {
    return NextResponse.json({ ok: false, error: "Supabase não configurado" }, { status: 503 })
  }
  const entries = await loadPages()
  const now = Date.now()
  const purgeable = entries.filter((e) => isPurgeable(e.page, now)).length
  return NextResponse.json({
    ok: true,
    engine: {
      cadencePerMinute: PSO_CADENCE_PER_MINUTE,
      dailyTarget: PSO_DAILY_TARGET,
      purgeAfterDays: PSO_PURGE_DAYS,
    },
    stats: {
      totalPages: entries.length,
      conversions: entries.reduce((s, e) => s + e.page.conversions, 0),
      purgeable,
    },
  })
}

/* POST — gerar lote { niche, count } (máx. 200 por chamada) */
export async function POST(req: NextRequest) {
  const cfg = supabaseConfig()
  if (!cfg) {
    return NextResponse.json({ ok: false, error: "Supabase não configurado" }, { status: 503 })
  }

  let body: { niche?: string; count?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 })
  }

  const niche = (body.niche ?? "").trim()
  if (!niche) {
    return NextResponse.json({ ok: false, error: "niche obrigatório" }, { status: 400 })
  }
  const count = Math.max(1, Math.min(body.count ?? PSO_CADENCE_PER_MINUTE, 200))

  const batch = generatePsoBatch(niche, count)
  let saved = 0
  for (const page of batch) {
    const ok = await supabaseWriteJson(cfg, `${PSO_PREFIX}/${page.slug}.json`, page)
    if (ok) saved++
  }

  return NextResponse.json({
    ok: true,
    generated: batch.length,
    saved,
    niche,
    slugs: batch.map((p) => p.slug),
  })
}

/* DELETE — expurgo automático: apaga páginas sem conversão > 30 dias */
export async function DELETE() {
  const cfg = supabaseConfig()
  if (!cfg) {
    return NextResponse.json({ ok: false, error: "Supabase não configurado" }, { status: 503 })
  }
  const entries = await loadPages()
  const now = Date.now()
  let purged = 0
  for (const e of entries) {
    if (isPurgeable(e.page, now)) {
      const key = e.slug.startsWith(`${PSO_PREFIX}/`) ? e.slug : `${PSO_PREFIX}/${e.slug}`
      if (await supabaseDeleteFile(cfg, key)) purged++
    }
  }
  return NextResponse.json({ ok: true, purged, remaining: entries.length - purged })
}
