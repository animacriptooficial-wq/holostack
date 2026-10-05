"use client"

import { useEffect, useState } from "react"
import { Activity, Key, SignalHigh, SignalLow, SignalMedium } from "lucide-react"

interface EngineState {
  id: string
  name: string
  provider: string
  latency: number
  fitness: number
  hasKey: boolean
  status: "online" | "degraded" | "offline"
  history: number[]
}

const HISTORY_LENGTH = 12

function randomLatency(base: number): number {
  return Math.max(40, Math.round(base + (Math.random() - 0.5) * 80))
}

function latencyToFitness(latency: number): number {
  if (latency < 120) return 98
  if (latency < 200) return 92
  if (latency < 320) return 84
  if (latency < 500) return 70
  return 55
}

const initialEngines: EngineState[] = [
  { id: "luna", name: "GPT-5.6 Luna", provider: "Luna AI", latency: 118, fitness: 98, hasKey: true, status: "online", history: [] },
  { id: "gpt5", name: "GPT-5", provider: "OpenAI", latency: 164, fitness: 92, hasKey: true, status: "online", history: [] },
  { id: "claude", name: "Claude 3.5 Sonnet", provider: "Anthropic", latency: 189, fitness: 90, hasKey: true, status: "online", history: [] },
  { id: "gemini", name: "Gemini 1.5 Pro", provider: "Google", latency: 231, fitness: 84, hasKey: false, status: "degraded", history: [] },
  { id: "llama", name: "LLaMA 3", provider: "Meta", latency: 296, fitness: 78, hasKey: false, status: "degraded", history: [] },
  { id: "deepseek", name: "DeepSeek V3", provider: "OpenRouter", latency: 342, fitness: 72, hasKey: true, status: "online", history: [] },
]

function statusStyle(status: EngineState["status"]) {
  switch (status) {
    case "online":
      return { dot: "bg-success", text: "text-success", label: "Online" }
    case "degraded":
      return { dot: "bg-warning", text: "text-warning", label: "Degradado" }
    case "offline":
      return { dot: "bg-error", text: "text-error", label: "Offline" }
  }
}

function latencySignal(latency: number) {
  if (latency < 200) return <SignalHigh className="w-4 h-4 text-success" />
  if (latency < 400) return <SignalMedium className="w-4 h-4 text-accent" />
  return <SignalLow className="w-4 h-4 text-warning" />
}

export default function APIMesh() {
  const [engines, setEngines] = useState<EngineState[]>(
    initialEngines.map((e) => ({
      ...e,
      history: Array.from({ length: HISTORY_LENGTH }, () => randomLatency(e.latency)),
    }))
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setEngines((prev) =>
        prev.map((engine) => {
          const latency = randomLatency(engine.latency)
          const fitness = latencyToFitness(latency)
          return {
            ...engine,
            latency,
            fitness,
            status: latency > 550 ? "degraded" : engine.hasKey ? "online" : "degraded",
            history: [...engine.history.slice(1), latency],
          }
        })
      )
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const maxLatency = Math.max(...engines.flatMap((e) => e.history), 600)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text">Malha de APIs</h3>
            <p className="text-sm text-textSecondary">Latência e aptidão em tempo real</p>
          </div>
        </div>
        <span className="flex items-center gap-2 text-xs text-success">
          <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
          Ao vivo
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {engines.map((engine) => {
          const style = statusStyle(engine.status)
          return (
            <div
              key={engine.id}
              className="bg-surface2 rounded-xl p-4 border border-border hover:border-primary transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-text">{engine.name}</h4>
                  <p className="text-xs text-textSecondary">{engine.provider}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${style.dot} animate-pulse`}></span>
                  <span className={`text-[10px] font-semibold ${style.text}`}>{style.label}</span>
                </div>
              </div>

              <div className="flex items-end justify-between mb-3">
                <div className="flex items-center gap-2">
                  {latencySignal(engine.latency)}
                  <span className="text-2xl font-bold text-text">{engine.latency}</span>
                  <span className="text-xs text-textSecondary mb-1">ms</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-textSecondary">Aptidão</p>
                  <p className="text-sm font-semibold text-accent">{engine.fitness}%</p>
                </div>
              </div>

              <div className="flex items-end gap-1 h-10 mb-3">
                {engine.history.map((value, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-accent/40 rounded-sm transition-all duration-500"
                    style={{ height: `${Math.max(12, (value / maxLatency) * 100)}%` }}
                  ></div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="flex items-center gap-1.5 text-xs text-textSecondary">
                  <Key className={`w-3.5 h-3.5 ${engine.hasKey ? "text-success" : "text-textSecondary"}`} />
                  {engine.hasKey ? "Chave ativa" : "Sem chave"}
                </span>
                <span className="text-[10px] text-textSecondary uppercase tracking-wide">
                  {engine.provider}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
