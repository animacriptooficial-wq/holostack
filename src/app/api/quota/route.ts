import { NextRequest, NextResponse } from "next/server"
import { supabaseConfig, supabaseReadJson, supabaseWriteJson } from "@/lib/supabase"
import { getPlan } from "@/lib/plans"

export const dynamic = "force-dynamic"

/* Quotas por utilizador (spec §5):
   user:{id}:plan   → plano ativo
   user:{id}:limit  → teto de ativos
   user:{id}:tokens → tokens restantes no ciclo */

interface UserQuota {
  plan: string
  assetLimit: number
  assetsUsed: number
  tokens: number
  cycleResetAt: number
}

async function readQuota(cfg: NonNullable<ReturnType<typeof supabaseConfig>>, userId: string) {
  const [plan, limit, tokens] = await Promise.all([
    supabaseReadJson<{ value: string }>(cfg, `users/${userId}/plan.json`),
    supabaseReadJson<{ value: number; used: number }>(cfg, `users/${userId}/limit.json`),
    supabaseReadJson<{ value: number; resetAt: number }>(cfg, `users/${userId}/tokens.json`),
  ])

  const planId = plan?.value ?? "basic-starter"
  const p = getPlan(planId)

  return {
    plan: planId,
    assetLimit: limit?.value ?? p?.assetLimit ?? 50,
    assetsUsed: limit?.used ?? 0,
    tokens: tokens?.value ?? p?.monthlyTokens ?? 500_000,
    cycleResetAt: tokens?.resetAt ?? 0,
  } satisfies UserQuota
}

async function writeQuota(
  cfg: NonNullable<ReturnType<typeof supabaseConfig>>,
  userId: string,
  q: UserQuota
) {
  await Promise.all([
    supabaseWriteJson(cfg, `users/${userId}/plan.json`, { value: q.plan }),
    supabaseWriteJson(cfg, `users/${userId}/limit.json`, { value: q.assetLimit, used: q.assetsUsed }),
    supabaseWriteJson(cfg, `users/${userId}/tokens.json`, { value: q.tokens, resetAt: q.cycleResetAt }),
  ])
}

/* GET ?userId= — estado atual de quota */
export async function GET(req: NextRequest) {
  const cfg = supabaseConfig()
  if (!cfg) return NextResponse.json({ ok: false, error: "Supabase não configurado" }, { status: 503 })
  const userId = req.nextUrl.searchParams.get("userId")
  if (!userId) return NextResponse.json({ ok: false, error: "userId obrigatório" }, { status: 400 })
  return NextResponse.json({ ok: true, quota: await readQuota(cfg, userId) })
}

/* POST { userId, action: "generate"|"create-asset", tokens? } — valida e debita */
export async function POST(req: NextRequest) {
  const cfg = supabaseConfig()
  if (!cfg) return NextResponse.json({ ok: false, error: "Supabase não configurado" }, { status: 503 })

  let body: { userId?: string; action?: string; tokens?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 })
  }
  if (!body.userId) return NextResponse.json({ ok: false, error: "userId obrigatório" }, { status: 400 })

  const q = await readQuota(cfg, body.userId)

  // reset de ciclo mensal (30 dias)
  if (q.cycleResetAt && Date.now() > q.cycleResetAt) {
    const p = getPlan(q.plan)
    q.tokens = p?.monthlyTokens ?? 500_000
    q.cycleResetAt = Date.now() + 30 * 24 * 60 * 60 * 1000
  }

  if (body.action === "create-asset") {
    if (q.assetLimit > 0 && q.assetsUsed >= q.assetLimit) {
      return NextResponse.json(
        { ok: false, error: "limite de ativos atingido", quota: q },
        { status: 403 }
      )
    }
    q.assetsUsed++
  }

  if (body.action === "generate") {
    const cost = Math.max(1, body.tokens ?? 1000)
    if (q.tokens < cost) {
      return NextResponse.json(
        { ok: false, error: "tokens insuficientes", quota: q },
        { status: 403 }
      )
    }
    q.tokens -= cost
  }

  await writeQuota(cfg, body.userId, q)
  return NextResponse.json({ ok: true, quota: q })
}
