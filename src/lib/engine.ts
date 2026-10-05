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

export type EnginePhase =
  | "checking-keys"
  | "connecting"
  | "generating"
  | "parsing"
  | "done"
  | "error"

export interface EngineEvent {
  phase: EnginePhase
  detail: string
}

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

function buildSystemPrompt(mode: GenerationMode, platforms: string[]): string {
  const base = `You are HoloStack Engine, an industrial-grade code generation system. You translate any user request into a complete, working project.

CRITICAL OUTPUT RULE: Respond with a SINGLE valid JSON object and NOTHING else. No markdown fences, no commentary before or after. The JSON must have this exact shape:
{
  "projectName": "kebab-case-name",
  "plan": "A concise explanation in Portuguese of what you built, the architecture and technologies used",
  "previewHtml": "a COMPLETE standalone HTML document (with inline <style> and <script>) that renders a polished, working, visually impressive live version of the app",
  "files": [{ "path": "relative/path.ext", "content": "full file content" }]
}`

  if (mode === "site") {
    return `${base}

The user wants a WEBSITE / WEB APP.
- previewHtml: must be a complete HTML5 document with embedded CSS and JS — modern, responsive, dark themed with elegant accent colors. It must work standalone in an iframe with zero external dependencies (CDN links for fonts/tailwind are allowed).
- files: generate the complete Next.js/React project structure (package.json, app files, components, styles) — every file complete, never truncated.`
  }

  return `${base}

The user wants a MULTI-PLATFORM PROGRAM for: ${platforms.join(", ")}.
- previewHtml: must be a complete HTML5 document that reproduces the program's running interface — a real, functional-looking app window with working buttons, menus, lists and state simulated in JS. It must work standalone in an iframe.
- files: generate the complete project (package.json with dependencies react, typescript, tailwindcss, @tauri-apps/api, @capacitor/core, vite, zustand, lucide-react; src/main.tsx, src/App.tsx, src/store.ts, src-tauri/tauri.conf.json, capacitor.config.ts, etc.) — every file complete, never truncated.`
}

function extractJson(raw: string): unknown {
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
  userPrompt: string
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
      max_tokens: 16000,
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
  userPrompt: string
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
      max_tokens: 8192,
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
  userPrompt: string
): Promise<string> {
  const res = await fetch(`${provider.endpoint}?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 16000 },
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

async function callProvider(
  provider: ProviderConfig,
  key: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (provider.id === "anthropic") return callAnthropic(provider, key, systemPrompt, userPrompt)
  if (provider.id === "google") return callGoogle(provider, key, systemPrompt, userPrompt)
  return callOpenAICompatible(provider, key, systemPrompt, userPrompt)
}

export async function generateProject(options: {
  prompt: string
  mode: GenerationMode
  platforms?: string[]
  providerId?: string
  onEvent?: (event: EngineEvent) => void
}): Promise<GenerationResult> {
  const { prompt, mode, platforms = ["web"], providerId, onEvent } = options
  const emit = (phase: EnginePhase, detail: string) => onEvent?.({ phase, detail })

  emit("checking-keys", "A procurar chaves de API configuradas...")
  const resolved = resolveProvider(providerId)
  if (!resolved) {
    emit("error", "Nenhuma chave de API configurada")
    throw new Error(
      "NO_KEY:Nenhuma chave de API configurada. Vá a /settings e adicione a chave do GPT-5.6 Luna ou de outro motor."
    )
  }

  const { provider, key } = resolved
  emit("connecting", `A ligar a ${provider.name} (${provider.model})...`)

  const systemPrompt = buildSystemPrompt(mode, platforms)
  const userPrompt = `Pedido do utilizador: "${prompt}". Gere o projeto completo agora.`

  emit("generating", `O motor ${provider.name} está a gerar o projeto...`)
  const raw = await callProvider(provider, key, systemPrompt, userPrompt)

  emit("parsing", "A compilar e estruturar os ficheiros gerados...")
  const parsed = extractJson(raw) as Partial<GenerationResult>

  if (!parsed.previewHtml || !Array.isArray(parsed.files)) {
    throw new Error("Resposta do motor incompleta — tente novamente")
  }

  emit("done", "Projeto gerado com sucesso")
  return {
    projectName: parsed.projectName || "holostack-app",
    plan: parsed.plan || "Projeto gerado pelo HoloStack Engine.",
    files: parsed.files,
    previewHtml: parsed.previewHtml,
    provider: provider.name,
    model: provider.model,
  }
}
