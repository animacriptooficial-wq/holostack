"use client"

export interface GeneratedFile {
  path: string
  content: string
}

export interface GenerationResult {
  projectName: string
  plan: string
  files: GeneratedFile[]
  previewHtml: string
  provider: string
  model: string
}

export type GenerationMode = "site" | "program"

const KEYS_STORAGE = "holostack_api_keys"

export interface ProviderConfig {
  id: string
  name: string
  endpoint: string
  model: string
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: "luna",
    name: "GPT-5.6 Luna",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    model: "openai/gpt-4o",
  },
  {
    id: "openai",
    name: "OpenAI",
    endpoint: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    endpoint: "https://api.anthropic.com/v1/messages",
    model: "claude-3-5-sonnet-20241022",
  },
  {
    id: "google",
    name: "Google",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
    model: "gemini-1.5-pro",
  },
]

export function getStoredKeys(): Record<string, string> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(KEYS_STORAGE)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

export function saveStoredKey(providerId: string, key: string) {
  const keys = getStoredKeys()
  if (key) {
    keys[providerId] = key
  } else {
    delete keys[providerId]
  }
  localStorage.setItem(KEYS_STORAGE, JSON.stringify(keys))
}

export function resolveProvider(
  preferredId?: string
): { provider: ProviderConfig; key: string } | null {
  const keys = getStoredKeys()
  if (preferredId && keys[preferredId]) {
    const provider = PROVIDERS.find((p) => p.id === preferredId)
    if (provider) return { provider, key: keys[preferredId] }
  }
  for (const provider of PROVIDERS) {
    const key = keys[provider.id]
    if (key) return { provider, key }
  }
  return null
}

export function extractJson(raw: string): unknown {
  let text = raw.trim()
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) text = fence[1].trim()
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end === -1) throw new Error("Resposta sem JSON válido")
  return JSON.parse(text.slice(start, end + 1))
}

async function callOpenAICompatible(
  provider: ProviderConfig,
  key: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<string> {
  const res = await fetch(provider.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...(provider.id === "luna"
        ? { "HTTP-Referer": "https://holostack-one.vercel.app", "X-Title": "HoloStack" }
        : {}),
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: maxTokens,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${provider.name} retornou ${res.status}: ${body.slice(0, 200)}`)
  }
  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error(`${provider.name} retornou resposta vazia`)
  return content as string
}

async function callAnthropic(
  provider: ProviderConfig,
  key: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<string> {
  const res = await fetch(provider.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: provider.model,
      system: systemPrompt,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: userPrompt }],
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Anthropic retornou ${res.status}: ${body.slice(0, 200)}`)
  }
  const data = await res.json()
  const content = data?.content?.[0]?.text
  if (!content) throw new Error("Anthropic retornou resposta vazia")
  return content as string
}

async function callGoogle(
  provider: ProviderConfig,
  key: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<string> {
  const res = await fetch(`${provider.endpoint}?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: maxTokens },
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google retornou ${res.status}: ${body.slice(0, 200)}`)
  }
  const data = await res.json()
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!content) throw new Error("Google retornou resposta vazia")
  return content as string
}

export interface ModelResponse {
  text: string
  provider: string
  model: string
}

export async function callModel(options: {
  systemPrompt: string
  userPrompt: string
  providerId?: string
  maxTokens?: number
}): Promise<ModelResponse> {
  const resolved = resolveProvider(options.providerId)
  if (!resolved) {
    throw new Error(
      "NO_KEY:Nenhuma chave de API configurada. Vá a /settings e adicione a chave do GPT-5.6 Luna ou de outro motor."
    )
  }
  const { provider, key } = resolved
  const maxTokens = options.maxTokens ?? 16000
  const text =
    provider.id === "anthropic"
      ? await callAnthropic(provider, key, options.systemPrompt, options.userPrompt, maxTokens)
      : provider.id === "google"
      ? await callGoogle(provider, key, options.systemPrompt, options.userPrompt, maxTokens)
      : await callOpenAICompatible(provider, key, options.systemPrompt, options.userPrompt, maxTokens)
  return { text, provider: provider.name, model: provider.model }
}
