"use client"

import { useEffect, useState } from "react"
import { ListTodo, Timer, CheckCircle2, ShieldCheck } from "lucide-react"

interface Metrics {
  queueActive: number
  queueWaiting: number
  parallelism: number
  avgDuration: number
  queueSuccess: number
  inspectorScore: number
}

function drift(value: number, min: number, max: number, step: number): number {
  const next = value + (Math.random() - 0.5) * step
  return Math.min(max, Math.max(min, next))
}

export default function MetricsGrid() {
  const [metrics, setMetrics] = useState<Metrics>({
    queueActive: 7,
    queueWaiting: 3,
    parallelism: 4,
    avgDuration: 2.4,
    queueSuccess: 96.8,
    inspectorScore: 88,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        queueActive: Math.round(drift(prev.queueActive, 1, 15, 2)),
        queueWaiting: Math.round(drift(prev.queueWaiting, 0, 12, 2)),
        parallelism: Math.round(drift(prev.parallelism, 2, 8, 1)),
        avgDuration: Number(drift(prev.avgDuration, 1.2, 4.5, 0.4).toFixed(1)),
        queueSuccess: Number(drift(prev.queueSuccess, 90, 99.9, 0.6).toFixed(1)),
        inspectorScore: Math.round(drift(prev.inspectorScore, 78, 98, 1)),
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const scoreColor =
    metrics.inspectorScore >= 90
      ? "text-success"
      : metrics.inspectorScore >= 75
      ? "text-accent"
      : "text-warning"

  const cards = [
    {
      id: "queue",
      title: "FILA",
      icon: ListTodo,
      main: `${metrics.queueActive} ativas`,
      sub: `${metrics.queueWaiting} em espera`,
      extra: `Paralelismo ×${metrics.parallelism}`,
      accent: "text-accent",
    },
    {
      id: "duration",
      title: "DURAÇÃO MÉDIA",
      icon: Timer,
      main: `${metrics.avgDuration}s`,
      sub: "por página / processo",
      extra: "últimos 60 min",
      accent: "text-accent",
    },
    {
      id: "success",
      title: "SUCESSO DA FILA",
      icon: CheckCircle2,
      main: `${metrics.queueSuccess}%`,
      sub: "taxa de conclusão",
      extra: "sem falhas críticas",
      accent: "text-success",
    },
    {
      id: "inspector",
      title: "INSPECTOR",
      icon: ShieldCheck,
      main: `${metrics.inspectorScore}/100`,
      sub: "integridade do sistema",
      extra: metrics.inspectorScore >= 90 ? "excelente" : "estável",
      accent: scoreColor,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.id} className="card hover:border-primary transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold tracking-wider text-textSecondary">
                {card.title}
              </span>
              <Icon className={`w-4 h-4 ${card.accent}`} />
            </div>
            <p className={`text-3xl font-bold ${card.accent}`}>{card.main}</p>
            <p className="text-sm text-textSecondary mt-1">{card.sub}</p>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-textSecondary">{card.extra}</span>
              <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
