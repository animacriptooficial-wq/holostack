"use client"

import { GeneratedFile, GenerationMode } from "./engine"
import { runPsoGeneration, PsoEvent, PsoResult } from "./pso"

/* ============================================================
   ROLLSTACK GUARDIAN — Health & Watchdog 24/7
   Daemon de observabilidade + recuperação zero-touch
   ============================================================ */

export type HealthLevel = "ok" | "degraded" | "down"

export interface ComponentHealth {
  name: string
  level: HealthLevel
  detail: string
  checkedAt: number
}

type Listener = () => void

class HealthWatchdogService {
  private components = new Map<string, ComponentHealth>()
  private listeners = new Set<Listener>()

  mark(name: string, level: HealthLevel, detail: string) {
    this.components.set(name, { name, level, detail, checkedAt: Date.now() })
    this.listeners.forEach((l) => l())
  }

  heartbeat(name: string, detail: string) {
    this.mark(name, "ok", detail)
  }

  snapshot(): ComponentHealth[] {
    return [...this.components.values()].sort((a, b) => a.name.localeCompare(b.name))
  }

  overall(): HealthLevel {
    const levels = [...this.components.values()].map((c) => c.level)
    if (levels.includes("down")) return "down"
    if (levels.includes("degraded")) return "degraded"
    return "ok"
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
}

export const watchdog = new HealthWatchdogService()

/* ---------------- Health check da API local ---------------- */

export interface ApiHealthReport {
  ok: boolean
  components: { name: string; ok: boolean; detail: string }[]
  ts: number
}

export async function pollApiHealth(): Promise<ApiHealthReport | null> {
  try {
    const res = await fetch("/api/health", { cache: "no-store" })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as ApiHealthReport
    for (const c of data.components) {
      watchdog.mark(`api:${c.name}`, c.ok ? "ok" : "degraded", c.detail)
    }
    watchdog.mark("api:health-endpoint", "ok", "rota de saúde operacional")
    return data
  } catch (err) {
    watchdog.mark(
      "api:health-endpoint",
      "degraded",
      err instanceof Error ? err.message : "sem resposta"
    )
    return null
  }
}

/* ---------------- Recuperação zero-touch ----------------
   Envolve runPsoGeneration: se a corrida falhar ou devolver
   0 ficheiros, o Guardian captura o log exato, reconstrói o
   prompt com contexto corretivo e reinicia o pipeline
   automaticamente — até GUARDIAN_MAX_RUNS corridas completas. */

const GUARDIAN_MAX_RUNS = 3

export interface GuardedOptions {
  prompt: string
  mode: GenerationMode
  platforms?: string[]
  providerId?: string
  onEvent?: (e: PsoEvent) => void
  onSliceSync?: (sliceId: number, files: GeneratedFile[]) => Promise<string[]>
}

export async function runGuardedGeneration(options: GuardedOptions): Promise<PsoResult> {
  const { onEvent } = options
  const emitGuardian = (text: string) =>
    onEvent?.({ type: "guardian", text })

  watchdog.heartbeat("guardian", "watchdog ativo — monitorização contínua")

  let lastError = "Erro desconhecido"
  let effectivePrompt = options.prompt

  for (let run = 1; run <= GUARDIAN_MAX_RUNS; run++) {
    try {
      const result = await runPsoGeneration({
        ...options,
        prompt: effectivePrompt,
        onEvent: (e) => {
          /* Interceção de falhas: cada erro alimenta o estado de saúde */
          if (e.type === "slice-retry") {
            watchdog.mark("pso-engine", "degraded", `autocorreção ativa — ${e.text.slice(0, 80)}`)
          }
          if (e.type === "slice-warning") {
            watchdog.mark("pso-engine", "degraded", `fatia integrada com avisos`)
          }
          if (e.type === "slice-verified") {
            watchdog.mark("pso-engine", "ok", `fatia ${e.sliceId} verificada`)
          }
          if (e.type === "sync" && e.text.startsWith("✗")) {
            watchdog.mark("git-sync", "degraded", e.text.slice(0, 100))
          }
          if (e.type === "sync" && e.text.startsWith("✓ git push")) {
            watchdog.mark("git-sync", "ok", "repositório sincronizado")
          }
          if (e.type === "error") {
            watchdog.mark("pso-engine", "down", e.text.slice(0, 100))
          }
          onEvent?.(e)
        },
      })

      if (result.files.length === 0) {
        throw new Error("O motor devolveu 0 ficheiros — resposta vazia do modelo")
      }

      watchdog.mark("pso-engine", "ok", `corrida ${run} concluída — ${result.files.length} ficheiros`)
      if (run > 1) {
        emitGuardian(`⛨ Rollstack Guardian: sistema recuperado na corrida ${run}/${GUARDIAN_MAX_RUNS} — Verde Absoluto`)
      }
      return result
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Erro desconhecido"

      /* Falhas de autenticação não são recuperáveis por retry —
         propagam imediatamente sem desperdiçar corridas */
      if (lastError.startsWith("NO_KEY:")) {
        watchdog.mark("ai-provider", "down", "nenhuma chave de API configurada")
        throw err
      }
      if (lastError.startsWith("AUTH:")) {
        watchdog.mark("ai-provider", "down", "401 — chave em falta ou inválida")
        emitGuardian(
          `⛨ Rollstack Guardian: ${lastError.replace("AUTH:", "")}`
        )
        throw err
      }
      watchdog.mark("ai-provider", "ok", "autenticação válida")

      watchdog.mark("pso-engine", "down", `corrida ${run} falhou: ${lastError.slice(0, 80)}`)

      if (run < GUARDIAN_MAX_RUNS) {
        emitGuardian(
          `⛨ Rollstack Guardian: detetada anomalia na corrida ${run} — "${lastError.slice(0, 120)}". A reconstruir pipeline e a reaplicar autocorreção autónoma (corrida ${run + 1}/${GUARDIAN_MAX_RUNS})...`
        )
        /* Prompt corretivo: o log exato da falha é reinjetado no pedido */
        effectivePrompt = `${options.prompt}

CONTEXTO DE RECUPERAÇÃO (Rollstack Guardian): a tentativa anterior falhou com o erro:
"${lastError}"

Obrigatório: devolve JSON válido e completo em cada fatia, sem truncar conteúdo, e garante que TODAS as fatias devolvem ficheiros reais e funcionais.`
      }
    }
  }

  watchdog.mark("pso-engine", "down", `${GUARDIAN_MAX_RUNS} corridas esgotadas`)
  throw new Error(lastError)
}
