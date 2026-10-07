import { NextRequest, NextResponse } from "next/server"
import { getSiteTheme, setSiteTheme, isValidThemeId } from "@/lib/theme-store"

export const dynamic = "force-dynamic"

export async function GET() {
  const theme = await getSiteTheme()
  return NextResponse.json({ theme: theme ?? "carbon" })
}

export async function POST(req: NextRequest) {
  let body: { theme?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }
  if (!isValidThemeId(body.theme)) {
    return NextResponse.json({ error: "tema inválido" }, { status: 400 })
  }
  const ok = await setSiteTheme(body.theme)
  if (!ok) {
    return NextResponse.json(
      { error: "persistência indisponível" },
      { status: 503 }
    )
  }
  return NextResponse.json({ theme: body.theme })
}
