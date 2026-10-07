import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"

export const dynamic = "force-dynamic"

/* Tripla validação de chaves (spec §2) — 3º fator do painel.
   Secrets no servidor: ADMIN_KEY_1, ADMIN_KEY_2, ADMIN_KEY_3 */

function safeEq(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const k1 = process.env.ADMIN_KEY_1
  const k2 = process.env.ADMIN_KEY_2
  const k3 = process.env.ADMIN_KEY_3

  if (!k1 || !k2 || !k3) {
    return NextResponse.json(
      { ok: false, error: "chaves de admin não configuradas no servidor" },
      { status: 503 }
    )
  }

  let body: { keys?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 })
  }

  const keys = body.keys ?? []
  const ok =
    keys.length === 3 &&
    safeEq(keys[0]?.trim() ?? "", k1) &&
    safeEq(keys[1]?.trim() ?? "", k2) &&
    safeEq(keys[2]?.trim() ?? "", k3)

  // Qualquer falha → negação total (spec: bloqueio imediato)
  return NextResponse.json({ ok }, { status: ok ? 200 : 403 })
}
