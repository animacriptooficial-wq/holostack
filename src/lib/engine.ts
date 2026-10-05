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
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    /* Chaves vazias ou só com espaços não contam — evita 401 silencioso */
    return Object.fromEntries(
      Object.entries(parsed).filter(([, v]) => typeof v === "string" && v.trim().length > 0)
    )
  } catch {
    return {}
  }
}

export function saveStoredKey(providerId: string, key: string) {
  const keys = getStoredKeys()
  if (key && key.trim()) {
    keys[providerId] = key.trim()
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

/* ============================================================
   PARSER MULTI-FORMATO — extrai ficheiros de qualquer formato
   que o modelo devolva: JSON contract, markdown fences com
   marcadores de caminho, ou texto livre com blocos de código.
   ============================================================ */

export interface ParsedModelOutput {
  files: GeneratedFile[]
  previewHtml: string
  plan: string
  projectName: string
  parseMode: "json" | "fences" | "none"
  rawSnippet: string
}

const LANG_EXT: Record<string, string> = {
  typescript: "ts", ts: "ts", tsx: "tsx", javascript: "js", js: "js", jsx: "jsx",
  json: "json", css: "css", html: "html", md: "md", markdown: "md",
  toml: "toml", yaml: "yaml", yml: "yml", python: "py", py: "py",
  rust: "rs", bash: "sh", sh: "sh",
}

function cleanPath(p: string): string {
  return p.trim().replace(/^[`'"*#\s]+|[`'"*\s]+$/g, "").replace(/^\/+/, "")
}

function looksLikePath(p: string): boolean {
  return /^[\w.@/-]+\.[a-zA-Z0-9]{1,10}$/.test(p) && !p.includes(" ")
}

export function parseModelOutput(raw: string): ParsedModelOutput {
  const out: ParsedModelOutput = {
    files: [],
    previewHtml: "",
    plan: "",
    projectName: "",
    parseMode: "none",
    rawSnippet: raw.slice(0, 400),
  }
  if (!raw || !raw.trim()) return out

  /* ---- Modo 1: contrato JSON (preferido) ---- */
  try {
    const parsed = extractJson(raw) as {
      files?: GeneratedFile[]
      previewHtml?: string
      plan?: string
      projectName?: string
    }
    if (parsed && typeof parsed === "object") {
      if (Array.isArray(parsed.files)) {
        out.files = parsed.files.filter(
          (f) => f && typeof f.path === "string" && typeof f.content === "string"
        )
      }
      if (typeof parsed.previewHtml === "string") out.previewHtml = parsed.previewHtml
      if (typeof parsed.plan === "string") out.plan = parsed.plan
      if (typeof parsed.projectName === "string") out.projectName = parsed.projectName
      if (out.files.length > 0 || out.previewHtml) {
        out.parseMode = "json"
        return out
      }
    }
  } catch {
    /* não é JSON — segue para fences */
  }

  /* ---- Modo 2: markdown fences com associação de caminhos ---- */
  const fenceRe = /```([\w-]*)[^\n`]*\n([\s\S]*?)```/g
  let m: RegExpExecArray | null
  let fenceIndex = 0
  while ((m = fenceRe.exec(raw)) !== null) {
    fenceIndex++
    const lang = (m[1] || "").toLowerCase()
    const code = m[2].replace(/\n+$/, "")
    if (!code.trim()) continue

    /* a) marcador de caminho DENTRO do bloco:
       // file: src/App.tsx | /* path: x | <!-- file: x | # file: x */
    const inside = code.match(
      /(?:\/\/|\/\*+|<!--|#)\s*(?:file(?:name)?|path|arquivo|ficheiro)\s*[:=]\s*([\w.@/-]+\.\w+)/i
    )

    /* b) caminho declarado ANTES do fence (linha anterior):
       ### src/App.tsx | **src/App.tsx** | `src/App.tsx`: */
    const before = raw.slice(Math.max(0, m.index - 250), m.index)
    const beforeLines = before.split("\n").filter((l) => l.trim())
    const lastBefore = beforeLines[beforeLines.length - 1] || ""
    const decl = lastBefore.match(/[`'*#\s]*([\w.@/-]+\.[a-zA-Z0-9]{1,10})[`'*\s]*:?\s*$/)

    let filePath = ""
    if (inside?.[1] && looksLikePath(inside[1])) filePath = cleanPath(inside[1])
    else if (decl?.[1] && looksLikePath(decl[1])) filePath = cleanPath(decl[1])

    /* c) bloco HTML sem caminho → candidato a preview */
    if (lang === "html" || /<html[\s>]/i.test(code.slice(0, 200))) {
      if (code.length > (out.previewHtml || "").length && !filePath) {
        out.previewHtml = code.trim()
        continue
      }
    }

    /* d) sem caminho → nome deduzido pela linguagem (nunca inventa
          conteúdo; apenas rotula o bloco para não se perder) */
    if (!filePath) {
      const ext = LANG_EXT[lang] || "txt"
      filePath = `src/generated-block-${fenceIndex}.${ext}`
    }

    /* remove o próprio marcador de caminho do início do conteúdo */
    let content = code
    if (inside) {
      content = code.replace(inside[0], "").replace(/^\s*(?:\*\/|-->)?\s*\n/, "")
    }
    out.files.push({ path: filePath, content: content.trim() })
  }

  /* A resposta inteira pode ser um documento HTML solto */
  if (!out.previewHtml && /^\s*<!doctype html|^\s*<html[\s>]/i.test(raw)) {
    out.previewHtml = raw.trim()
  }

  if (out.files.length > 0 || out.previewHtml) {
    out.parseMode = "fences"
    /* plan: texto livre antes do primeiro fence */
    const firstFence = raw.indexOf("```")
    if (firstFence > 0) {
      const lead = raw.slice(0, firstFence).trim()
      if (lead.length > 20) out.plan = lead.slice(0, 800)
    }
  }

  return out
}

function authError(providerName: string, status: number): Error {
  return new Error(
    `AUTH:Erro de Autenticação na API (${providerName}): chave de API em falta ou inválida — HTTP ${status}. Verifique a chave em /settings.`
  )
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
      Authorization: `Bearer ${key.trim()}`,
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
  if (res.status === 401 || res.status === 403) {
    throw authError(provider.name, res.status)
  }
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
  if (res.status === 401 || res.status === 403) {
    throw authError("Anthropic", res.status)
  }
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
  if (res.status === 401 || res.status === 403 || res.status === 400) {
    const body = await res.text()
    if (res.status !== 400 || /key|auth|credential/i.test(body)) {
      throw authError("Google", res.status)
    }
    throw new Error(`Google retornou 400: ${body.slice(0, 200)}`)
  }
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
