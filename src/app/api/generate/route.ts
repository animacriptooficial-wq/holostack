import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* ============================================================
   PROXY SERVER-SIDE PARA MODELOS DE IA
   O browser nunca fala diretamente com OpenAI/Anthropic/etc —
   remove falhas de CORS e garante headers de autenticação
   corretos construídos no servidor.
   ============================================================ */

interface GenerateRequest {
  providerId?: string
  key?: string
  systemPrompt?: string
  userPrompt?: string
  maxTokens?: number
  model?: string
  endpoint?: string
}

const PROVIDER_ENDPOINTS: Record<string, { endpoint: string; model: string; kind: string; envKey: string }> = {
  luna: {
    kind: "openai",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    model: "openai/gpt-4o",
    envKey: "OPENROUTER_API_KEY",
  },
  openai: {
    kind: "openai",
    endpoint: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o",
    envKey: "OPENAI_API_KEY",
  },
  anthropic: {
    kind: "anthropic",
    endpoint: "https://api.anthropic.com/v1/messages",
    model: "claude-3-5-sonnet-20241022",
    envKey: "ANTHROPIC_API_KEY",
  },
  google: {
    kind: "google",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
    model: "gemini-1.5-pro",
    envKey: "GOOGLE_API_KEY",
  },
}

/* Chaves de ambiente do servidor (.env) — fallback quando o
   cliente não envia chave. Nunca expostas no bundle do browser. */
function envKeyFor(providerId: string): string {
  return (process.env[PROVIDER_ENDPOINTS[providerId]?.envKey || ""] || "").trim()
}

function envConfiguredProviders(): string[] {
  return Object.keys(PROVIDER_ENDPOINTS).filter((id) => envKeyFor(id).length > 0)
}

/* GET — pré-voo: quais providers têm chave server-side disponível */
export async function GET() {
  return NextResponse.json({ providers: envConfiguredProviders() })
}

async function callOpenAICompatible(
  endpoint: string,
  key: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  extraHeaders: Record<string, string>
): Promise<Response> {
  return fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key.trim()}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: maxTokens,
    }),
  })
}

export async function POST(req: Request) {
  let body: GenerateRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Pedido inválido" }, { status: 400 })
  }

  /* Provider: usa o pedido, senão escolhe o primeiro com chave env */
  let providerId = body.providerId || ""
  if (!PROVIDER_ENDPOINTS[providerId]) {
    providerId = envConfiguredProviders()[0] || ""
  }

  const spec = PROVIDER_ENDPOINTS[providerId]
  if (!spec) {
    return NextResponse.json(
      { ok: false, error: `Provider desconhecido: ${providerId}` },
      { status: 400 }
    )
  }

  /* Chave: cliente (localStorage) → fallback .env do servidor */
  const key = (body.key || "").trim() || envKeyFor(providerId)
  const systemPrompt = body.systemPrompt || ""
  const userPrompt = body.userPrompt || ""
  const maxTokens = Math.min(body.maxTokens || 16000, 32000)

  if (!key) {
    return NextResponse.json(
      { ok: false, status: 401, error: "Chave de API em falta — configure em /settings ou .env" },
      { status: 401 }
    )
  }

  try {
    let text = ""
    let upstream: Response

    if (spec.kind === "anthropic") {
      upstream = await fetch(spec.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: spec.model,
          system: systemPrompt,
          max_tokens: maxTokens,
          messages: [{ role: "user", content: userPrompt }],
        }),
      })
      if (upstream.ok) {
        const data = await upstream.json()
        text = data?.content?.[0]?.text || ""
      }
    } else if (spec.kind === "google") {
      upstream = await fetch(`${spec.endpoint}?key=${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: maxTokens },
        }),
      })
      if (upstream.ok) {
        const data = await upstream.json()
        text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ""
      }
    } else {
      const extraHeaders: Record<string, string> =
        providerId === "luna"
          ? { "HTTP-Referer": "https://holostack-one.vercel.app", "X-Title": "HoloStack" }
          : {}
      upstream = await callOpenAICompatible(
        spec.endpoint, key, spec.model, systemPrompt, userPrompt, maxTokens, extraHeaders
      )
      if (upstream.ok) {
        const data = await upstream.json()
        text = data?.choices?.[0]?.message?.content || ""
      }
    }

    if (!upstream.ok) {
      const errBody = await upstream.text()
      return NextResponse.json(
        {
          ok: false,
          status: upstream.status,
          error: `${providerId} retornou ${upstream.status}: ${errBody.slice(0, 300)}`,
        },
        { status: upstream.status }
      )
    }

    if (!text) {
      return NextResponse.json(
        { ok: false, status: 502, error: `${providerId} devolveu resposta vazia` },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true, text, provider: providerId, model: spec.model })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        status: 502,
        error: `Falha de rede ao contactar ${providerId}: ${err instanceof Error ? err.message : "erro"}`,
      },
      { status: 502 }
    )
  }
}
