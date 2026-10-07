import { NextRequest, NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { supabaseConfig, supabaseWriteJson } from "@/lib/supabase"
import { getPlan } from "@/lib/plans"

export const dynamic = "force-dynamic"

/* Webhook Stripe (spec §5):
   - checkout.session.completed → ativa plano + quotas
   - customer.subscription.deleted → revoga para starter mínimo
   Assinatura: Stripe-Signature "t=...,v1=..." → HMAC-SHA256(t.body) */

function verifyStripeSignature(rawBody: string, header: string, secret: string): boolean {
  const parts = Object.fromEntries(
    header.split(",").map((kv) => kv.split("=", 2) as [string, string])
  )
  const t = parts["t"]
  const v1 = parts["v1"]
  if (!t || !v1) return false

  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex")
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(v1))
  } catch {
    return false
  }
}

async function activatePlan(userId: string, planId: string) {
  const cfg = supabaseConfig()
  if (!cfg) return false
  const p = getPlan(planId)
  if (!p) return false
  await Promise.all([
    supabaseWriteJson(cfg, `users/${userId}/plan.json`, { value: p.id }),
    supabaseWriteJson(cfg, `users/${userId}/limit.json`, {
      value: p.assetLimit ?? 0,
      used: 0,
    }),
    supabaseWriteJson(cfg, `users/${userId}/tokens.json`, {
      value: p.monthlyTokens ?? 0,
      resetAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    }),
  ])
  return true
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const rawBody = await req.text()
  const sig = req.headers.get("stripe-signature") ?? ""

  // Sem secret configurado: aceita apenas em dev local (nunca em produção)
  if (secret) {
    if (!verifyStripeSignature(rawBody, sig, secret)) {
      return NextResponse.json({ ok: false, error: "assinatura inválida" }, { status: 400 })
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: "STRIPE_WEBHOOK_SECRET não configurado" },
      { status: 503 }
    )
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ ok: false, error: "payload inválido" }, { status: 400 })
  }

  const obj = event.data?.object ?? {}
  const meta = (obj.metadata ?? {}) as Record<string, string>
  const userId =
    meta.userId || (obj.customer_email as string) || (obj.customer as string) || ""
  const planId = meta.plan || ""

  if (event.type === "checkout.session.completed" && userId && planId) {
    const ok = await activatePlan(userId, planId)
    if (!ok) {
      return NextResponse.json({ ok: false, error: "falha ao ativar plano" }, { status: 500 })
    }
    return NextResponse.json({ ok: true, activated: planId, userId })
  }

  if (event.type === "customer.subscription.deleted" && userId) {
    await activatePlan(userId, "basic-starter")
    return NextResponse.json({ ok: true, downgraded: true, userId })
  }

  return NextResponse.json({ ok: true, ignored: event.type ?? "unknown" })
}
