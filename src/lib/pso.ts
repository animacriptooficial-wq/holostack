"use client"

import { callModel, parseModelOutput, ensureProvider, GeneratedFile, GenerationMode } from "./engine"

/* ============================================================
   PSO — Prompt Slicing & Optimization
   Fatiamento em 4 micro-tarefas + autocorreção em loop fechado
   ============================================================ */

export interface PsoSlice {
  id: number
  name: string
  description: string
}

export const PSO_SLICES: PsoSlice[] = [
  {
    id: 1,
    name: "Arquitetura & Dados",
    description: "Esquemas TypeScript, rotas, package.json e estrutura base",
  },
  {
    id: 2,
    name: "Core Logic & Estado",
    description: "Lógica de negócio, Zustand stores, hooks e serviços",
  },
  {
    id: 3,
    name: "Interface & Design System",
    description: "Componentes visuais, tema dinâmico, responsividade, preview",
  },
  {
    id: 4,
    name: "Integração & Ativação",
    description: "Configs finais, testes estáticos e live preview definitivo",
  },
]

export interface SliceStatus {
  id: number
  name: string
  status: "pending" | "running" | "healing" | "verified" | "warning" | "failed"
  attempts: number
  errors: string[]
  fileCount: number
}

export type PsoEventType =
  | "slice-start"
  | "slice-retry"
  | "slice-verified"
  | "slice-warning"
  | "sync"
  | "preview"
  | "files"
  | "done"
  | "error"
  | "info"
  | "guardian"

export interface PsoEvent {
  type: PsoEventType
  sliceId?: number
  text: string
  files?: GeneratedFile[]
  previewHtml?: string
  previewUrl?: string
}

export interface PsoResult {
  projectName: string
  plan: string
  files: GeneratedFile[]
  previewHtml: string
  provider: string
  model: string
  slices: SliceStatus[]
}

const MAX_ATTEMPTS = 3

/* ---------------- Validação estática ---------------- */

function balanceCheck(content: string, open: string, close: string): boolean {
  let depth = 0
  for (const ch of content) {
    if (ch === open) depth++
    else if (ch === close) depth--
    if (depth < 0) return false
  }
  return depth === 0
}

export function validateFile(file: GeneratedFile): string[] {
  const errors: string[] = []
  const ext = file.path.split(".").pop()?.toLowerCase() || ""

  if (!file.content || !file.content.trim()) {
    errors.push(`${file.path}: ficheiro vazio`)
    return errors
  }

  if (/<<<<<<<|=======|>>>>>>>/.test(file.content)) {
    errors.push(`${file.path}: marcadores de conflito git presentes`)
  }
  if (/TODO|FIXME|XXX|HACK/i.test(file.content)) {
    errors.push(`${file.path}: contém TODO/FIXME — código incompleto`)
  }
  if (/\/\/\s*(resto|remaining|restante|same as|código omitido)/i.test(file.content)) {
    errors.push(`${file.path}: contém indicação de código omitido`)
  }

  if (ext === "json") {
    try {
      JSON.parse(file.content)
    } catch (e) {
      errors.push(`${file.path}: JSON inválido — ${(e as Error).message}`)
    }
  }

  if (["ts", "tsx", "js", "jsx"].includes(ext)) {
    if (!balanceCheck(file.content, "{", "}")) {
      errors.push(`${file.path}: chavetas {} desbalanceadas`)
    }
    if (!balanceCheck(file.content, "(", ")")) {
      errors.push(`${file.path}: parênteses () desbalanceados`)
    }
    if (!balanceCheck(file.content, "[", "]")) {
      errors.push(`${file.path}: colchetes [] desbalanceados`)
    }
    const backticks = (file.content.match(/`/g) || []).length
    if (backticks % 2 !== 0) {
      errors.push(`${file.path}: template literals (backticks) por fechar`)
    }
    const importLines = file.content.match(/import\s+[^'"]*$/gm)
    if (importLines) {
      errors.push(`${file.path}: import sem origem (from '...') — ${importLines[0].trim().slice(0, 60)}`)
    }

    /* Deteção de truncamento — última linha útil termina a meio de uma expressão */
    const lines = file.content.split("\n")
    let last = ""
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim()) {
        last = lines[i].trim()
        break
      }
    }
    if (/(?:[,=([{<]|=>|\\|\bimport|\bfrom|\bexport|\bconst|\blet|\breturn)\s*$/i.test(last)) {
      errors.push(`${file.path}: ficheiro parece truncado — termina em "${last.slice(-30)}"`)
    }
  }

  return errors
}

export function validatePreviewHtml(html: string): string[] {
  const errors: string[] = []
  if (!html || html.trim().length < 200) {
    errors.push("previewHtml: documento demasiado curto ou vazio")
    return errors
  }
  if (!/<body[\s>]/i.test(html) || !/<\/body>/i.test(html)) {
    errors.push("previewHtml: <body> ausente ou por fechar")
  }
  if (!/<\/html>/i.test(html)) {
    errors.push("previewHtml: tag </html> por fechar")
  }

  /* Referências relativas/externas — no iframe srcDoc NÃO existe
     servidor nem bundler: src="./x", src="/src/main.tsx",
     href="styles.css" rendem página branca */
  const externalRefs = html.match(
    /(?:src|href)\s*=\s*["'](?!https?:|data:|#|mailto:|\/\/)[^"']+["']/gi
  )
  if (externalRefs) {
    errors.push(
      `previewHtml: referência externa/relativa proibida (${externalRefs[0].slice(0, 60)}) — o preview tem de ser 100% standalone, todo o CSS/JS inline`
    )
  }

  /* <div id="root"></div> sem script inline → tela branca garantida */
  const visibleText = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, "").trim()
  const hasInlineScript = /<script(?![^>]+src\s*=)[^>]*>[\s\S]{30,}?<\/script>/i.test(html)
  if (visibleText.length < 30 && !hasInlineScript) {
    errors.push(
      "previewHtml: sem conteúdo visível nem script inline — renderizaria página branca"
    )
  }

  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html")
    if (doc.querySelector("parsererror")) {
      errors.push("previewHtml: HTML inválido (parsererror)")
    }
  }
  return errors
}

/* ---------------- Prompts por fatia ---------------- */

const JSON_CONTRACT = `Respond ONLY with a single valid JSON object — no markdown, no commentary.
Shape: { "files": [{ "path": "relative/path.ext", "content": "COMPLETE file content" }] }
Never truncate file content. Never write TODO, FIXME or placeholder comments.
CONTEÚDO 100% REALISTA E DETALHADO do domínio pedido — nomes, preços, specs, descrições e imagens CSS/gradientes ricos. PROIBIDO conteúdo genérico: "Item 1", "Model 1", "Product A", "Details about", "Lorem ipsum" ou dados de placeholder — cada entidade tem de ter dados concretos e credíveis (ex.: site de carros de luxo → "Lamborghini Revuelto", "€610.000", "1015 cv V12 híbrido").
PROIBIDO fetch()/axios/XMLHttpRequest para APIs ou backends que não existem nos ficheiros gerados — toda a informação vive em arrays/objetos TypeScript, stores ou constantes locais.`

function slicePrompt(
  slice: PsoSlice,
  mode: GenerationMode,
  platforms: string[],
  existingPaths: string[]
): string {
  const ctx = existingPaths.length
    ? `\nFicheiros já gerados em fatias anteriores (não repetir): ${existingPaths.join(", ")}`
    : ""
  const kind = mode === "site" ? "um SITE / WEB APP (Next.js)" : `um PROGRAMA multiplataforma para ${platforms.join(", ")}`

  switch (slice.id) {
    case 1:
      return `${JSON_CONTRACT}
Estás a construir ${kind}. Gera APENAS a Fatia 1 — ARQUITETURA & DADOS:
- package.json completo (deps: react, typescript, tailwindcss, vite, zustand, lucide-react${mode === "program" ? ", @tauri-apps/api, @capacitor/core" : ""})
- tsconfig.json, tipos e esquemas TypeScript (src/types.ts)
- estrutura de rotas/base (src/config.ts ou app structure)
${ctx}`
    case 2:
      return `${JSON_CONTRACT}
Continuação — ${kind}. Gera APENAS a Fatia 2 — CORE LOGIC & ESTADO:
- Zustand store(s) completos (src/store.ts)
- lógica de negócio, serviços e hooks (src/services/, src/hooks/)
- toda a regra funcional do pedido do utilizador
${ctx}`
    case 3:
      return `Respond ONLY with a single valid JSON object — no markdown.
Shape: { "files": [{ "path": "...", "content": "COMPLETE file content" }], "previewHtml": "COMPLETE standalone HTML5 doc" }
Continuação — ${kind}. Gera APENAS a Fatia 3 — INTERFACE & DESIGN:
- Componentes visuais completos (src/components/, src/App.tsx, estilos)
- previewHtml: documento HTML standalone (CSS+JS inline, dark theme elegante) que renderiza a aplicação FUNCIONAL e navegável num iframe — botões, menus e estado a funcionar em JS
- PROIBIDO no previewHtml: src= ou href= relativos (./x, /src/..., styles.css), <script src>, imports — tudo tem de estar INLINE, pois o iframe não tem servidor nem bundler
- A app tem de mostrar conteúdo visível real: HTML direto ou JS inline que cria a UI — nunca um <div id="root"></div> vazio
Never truncate. No TODOs.
${ctx}`
    default:
      return `Respond ONLY with a single valid JSON object — no markdown.
Shape: { "files": [...], "previewHtml": "FINAL polished standalone HTML5 doc", "plan": "resumo em PT do projeto", "projectName": "kebab-case" }
Continuação — ${kind}. Gera APENAS a Fatia 4 — INTEGRAÇÃO & ATIVAÇÃO:
- Configs de integração (${mode === "program" ? "src-tauri/tauri.conf.json, capacitor.config.ts, " : ""}vite.config.ts, tailwind.config.ts, README.md, index.html)
- previewHtml FINAL: a versão definitiva e polida — 100% standalone (SEM src=/href= relativos, SEM <script src>), conteúdo visível garantido
- plan + projectName
Never truncate. No TODOs.
${ctx}`
  }
}

function healPrompt(baseUser: string, errors: string[]): string {
  return `${baseUser}

AUTOCORREÇÃO: A fatia anterior falhou na validação estática. Erros exatos:
${errors.map((e) => `- ${e}`).join("\n")}

Corrige TODOS os erros e devolve a fatia completa. FORMATO OBRIGATÓRIO (um de):
1. JSON válido: { "files": [{ "path": "src/x.ts", "content": "..." }] }
2. Ou blocos markdown com caminho declarado: src/App.tsx seguido de \`\`\`tsx ... \`\`\`
Nunca omitas conteúdo, nunca devolvas texto solto sem ficheiros.`
}

/* ---------------- Compilador de Preview dedicado ----------------
   Quando as fatias não devolvem um previewHtml standalone válido,
   uma chamada extra converte o código-fonte gerado num documento
   HTML 100% inline — com orçamento de tokens exclusivo para a UI. */

/* Bundling real no servidor: esbuild compila o código-fonte gerado
   e devolve um documento self-contained (importmap → esm.sh).
   Determinístico — não depende de IA nem de chaves de API. */
export async function bundleRuntimePreview(
  allFiles: GeneratedFile[],
  project?: string
): Promise<{ html: string; url: string }> {
  try {
    const res = await fetch("/api/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: allFiles, project }),
    })
    const data = await res.json().catch(() => null)
    if (res.ok && data?.ok && typeof data.html === "string") {
      return { html: data.html, url: typeof data.url === "string" ? data.url : "" }
    }
    return { html: "", url: "" }
  } catch {
    return { html: "", url: "" }
  }
}

export async function compilePreviewFromSource(
  allFiles: GeneratedFile[],
  mode: GenerationMode,
  providerId: string | undefined,
  emit: (t: PsoEventType, text: string, extra?: Partial<PsoEvent>) => void
): Promise<string> {
  const keyFiles = allFiles
    .filter((f) => /\.(tsx|jsx|html|css|ts|js)$/.test(f.path))
    .sort((a, b) => (a.path.includes("App") ? -1 : b.path.includes("App") ? 1 : 0))
    .slice(0, 12)

  const bundle = keyFiles
    .map((f) => `--- FICHEIRO: ${f.path} ---\n${f.content.slice(0, 6000)}`)
    .join("\n\n")

  const res = await callModel({
    systemPrompt: `És um compilador de preview. Recebes o código-fonte de ${mode === "site" ? "um site/web app" : "um programa"} e devolves EXATAMENTE UM documento HTML5 standalone que renderiza a interface dessa aplicação de forma fiel e funcional.

REGRAS ABSOLUTAS:
- Responde APENAS com o documento HTML completo — sem JSON, sem markdown, sem explicações
- TODO o CSS e JS INLINE dentro do HTML — <style> e <script> inline
- PROIBIDO: src= ou href= relativos, <script src>, imports, fetch a ficheiros, <div id="root"></div> vazio
- A UI tem de renderizar conteúdo real e visível: layout, menus, botões, textos da app — reproduzindo fielmente o design do código
- Interações via JS vanilla inline (navegação, cliques, estado simples)
- Dark theme elegante e polido`,
    userPrompt: `Converte esta aplicação num preview HTML standalone funcional:\n\n${bundle}`,
    providerId,
    maxTokens: 16000,
  })

  const text = res.text.trim()
  /* O modelo pode devolver HTML direto, dentro de fence, ou JSON com previewHtml */
  const fence = text.match(/```(?:html)?\s*([\s\S]*?)```/)
  const candidate = fence ? fence[1].trim() : text
  if (/<html[\s>]|<!doctype/i.test(candidate)) return candidate

  try {
    const parsed = parseModelOutput(text)
    if (parsed.previewHtml) return parsed.previewHtml
  } catch {
    /* ignora */
  }
  emit("info", "Compilador de preview: resposta não continha HTML utilizável")
  return ""
}

/* ---------------- Orquestrador PSO ---------------- */

export async function runPsoGeneration(options: {
  prompt: string
  mode: GenerationMode
  platforms?: string[]
  providerId?: string
  onEvent?: (e: PsoEvent) => void
  onSliceSync?: (sliceId: number, files: GeneratedFile[]) => Promise<string[]>
}): Promise<PsoResult> {
  const { prompt, mode, platforms = ["web"], providerId, onEvent, onSliceSync } = options
  const emit = (type: PsoEventType, text: string, extra?: Partial<PsoEvent>) =>
    onEvent?.({ type, text, ...extra })

  const allFiles: GeneratedFile[] = []
  const slices: SliceStatus[] = PSO_SLICES.map((s) => ({
    id: s.id,
    name: s.name,
    status: "pending",
    attempts: 0,
    errors: [],
    fileCount: 0,
  }))

  let previewHtml = ""
  let plan = ""
  let projectName = "holostack-app"
  let providerUsed = ""
  let modelUsed = ""

  /* PRÉ-VOO: bloqueia o arranque se não existir chave válida
     (localStorage ou .env do servidor) — nenhuma fatia corre
     sem autenticação garantida */
  const preflight = await ensureProvider(providerId)
  if (!preflight) {
    emit("error", "Nenhuma chave de API configurada — configure em /settings antes de gerar")
    throw new Error(
      "NO_KEY:Nenhuma chave de API configurada. Vá a /settings ou configure .env no servidor."
    )
  }
  emit(
    "info",
    `Motor PSO ativado — ${preflight.provider.name} (${preflight.provider.model}) autenticado${preflight.key ? " (chave local)" : " (chave servidor .env)"} · pedido fatiado em 4 micro-tarefas`
  )

  for (const slice of PSO_SLICES) {
    const status = slices[slice.id - 1]
    status.status = "running"
    emit("slice-start", `Fatia ${slice.id}/4 — ${slice.name}: ${slice.description}`, {
      sliceId: slice.id,
    })

    const baseUser = `Pedido do utilizador: "${prompt}".`
    let userPrompt = baseUser
    let sliceFiles: GeneratedFile[] = []
    let sliceErrors: string[] = []
    let healed = false

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      status.attempts = attempt
      try {
        const res = await callModel({
          systemPrompt: slicePrompt(slice, mode, platforms, allFiles.map((f) => f.path)),
          userPrompt,
          providerId,
        })
        providerUsed = res.provider
        modelUsed = res.model

        const parsed = parseModelOutput(res.text)

        sliceFiles = parsed.files
        sliceErrors = sliceFiles.flatMap(validateFile)

        if ((slice.id === 3 || slice.id === 4) && parsed.previewHtml) {
          sliceErrors = [...sliceErrors, ...validatePreviewHtml(parsed.previewHtml)]
        }
        if (sliceFiles.length === 0) {
          sliceErrors.push("Erro: A IA não gerou blocos de código válidos")
          if (attempt < MAX_ATTEMPTS) {
            emit(
              "info",
              `Parse falhou (modo: ${parsed.parseMode}) — início da resposta bruta do modelo: ${parsed.rawSnippet.slice(0, 300).replace(/\s+/g, " ")}`,
              { sliceId: slice.id }
            )
          }
        } else {
          emit(
            "info",
            `Fatia ${slice.id}: ${sliceFiles.length} ficheiro(s) extraídos (parser: ${parsed.parseMode})`,
            { sliceId: slice.id }
          )
        }

        if (sliceErrors.length > 0 && attempt < MAX_ATTEMPTS) {
          status.status = "healing"
          emit(
            "slice-retry",
            `Fatia ${slice.id}: ${sliceErrors.length} erro(s) detetado(s) — loop de autocorreção ativo (tentativa ${attempt + 1}/${MAX_ATTEMPTS})`,
            { sliceId: slice.id }
          )
          userPrompt = healPrompt(baseUser, sliceErrors)
          healed = true
          continue
        }

        if (parsed.previewHtml) previewHtml = parsed.previewHtml
        if (parsed.plan) plan = parsed.plan
        if (parsed.projectName) projectName = parsed.projectName
        break
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido"
        if (msg.startsWith("NO_KEY:") || msg.startsWith("AUTH:")) {
          status.status = "failed"
          emit("error", msg.replace(/^(NO_KEY|AUTH):/, ""), { sliceId: slice.id })
          throw err
        }
        sliceErrors = [msg]
        if (attempt < MAX_ATTEMPTS) {
          status.status = "healing"
          emit("slice-retry", `Fatia ${slice.id}: falha de chamada — ${msg}. A retentar...`, {
            sliceId: slice.id,
          })
          userPrompt = healPrompt(baseUser, [msg])
          healed = true
          continue
        }
      }
    }

    status.errors = sliceErrors
    status.fileCount = sliceFiles.length

    if (sliceErrors.length > 0) {
      status.status = "warning"
      emit("slice-warning", `Fatia ${slice.id} integrada com ${sliceErrors.length} aviso(s) após ${MAX_ATTEMPTS} tentativas`, {
        sliceId: slice.id,
      })
    } else {
      status.status = "verified"
      emit(
        "slice-verified",
        `Fatia ${slice.id} verificada ✓ — 100% verde, 0 erros${healed ? ` (autocorrigida em ${status.attempts} tentativas)` : ""} · ${sliceFiles.length} ficheiros`,
        { sliceId: slice.id }
      )
    }

    allFiles.push(...sliceFiles)
    emit("files", `${allFiles.length} ficheiros acumulados no projeto`, {
      sliceId: slice.id,
      files: [...allFiles],
    })
    if (previewHtml && slice.id >= 3) {
      emit("preview", "Live preview atualizado", { sliceId: slice.id, previewHtml })
    }

    /* Bloqueio de segurança: nunca escrever/commits com 0 ficheiros */
    if (onSliceSync && allFiles.length > 0) {
      emit("sync", `Fatia ${slice.id}: a escrever ficheiros e sincronizar com GitHub...`, {
        sliceId: slice.id,
      })
      const log = await onSliceSync(slice.id, allFiles)
      log.forEach((line) => emit("sync", line, { sliceId: slice.id }))
    } else if (onSliceSync && allFiles.length === 0) {
      emit("sync", `Fatia ${slice.id}: sync bloqueado — 0 ficheiros extraídos, nada a gravar`, {
        sliceId: slice.id,
      })
    }
  }

  /* Código real compilado tem SEMPRE prioridade sobre o previewHtml
     das fatias — o HTML da IA é uma aproximação genérica; o bundle
     executa os ficheiros verdadeiros com os dados reais. O previewHtml
     da IA só serve quando o bundling falha. */
  const previewErrors = previewHtml ? validatePreviewHtml(previewHtml) : ["ausente"]
  const bundled = allFiles.length > 0 ? await bundleRuntimePreview(allFiles, projectName) : { html: "", url: "" }
  if (bundled.html && validatePreviewHtml(bundled.html).length === 0) {
    previewHtml = bundled.html
    emit("preview", "Preview real compilado — o teu código executa no iframe", {
      previewHtml,
      previewUrl: bundled.url,
    })
  } else if (previewErrors.length > 0 && allFiles.length > 0) {
    emit(
      "info",
      `Preview ${previewHtml ? "inválido" : "ausente"} (${previewErrors[0].slice(0, 60)}) e bundling falhou — compilador IA`
    )
    /* Fallback: compilador de preview via IA */
    try {
      const compiled = await compilePreviewFromSource(allFiles, mode, providerId, emit)
      const errs = compiled ? validatePreviewHtml(compiled) : ["vazio"]
      if (compiled && errs.length === 0) {
        previewHtml = compiled
        emit("preview", "Preview compilado — aplicação renderizável no iframe", { previewHtml })
      } else {
        emit(
          "slice-warning",
          `Compilador de preview: resultado falhou validação (${errs[0]?.slice(0, 80)})`,
          {}
        )
      }
    } catch (err) {
      emit(
        "slice-warning",
        `Compilador de preview falhou: ${err instanceof Error ? err.message : "erro"}`,
        {}
      )
    }
  }

  emit("done", `Motor PSO concluído — ${allFiles.length} ficheiros verificados e integrados`)
  return {
    projectName,
    plan: plan || "Projeto gerado pelo HoloStack PSO Engine.",
    files: allFiles,
    previewHtml,
    provider: providerUsed,
    model: modelUsed,
    slices,
  }
}
