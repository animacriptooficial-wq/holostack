"use client"

import { useEffect, useState } from "react"
import { Zap, Trash2, Rocket, Loader2, Gauge } from "lucide-react"

interface EngineStats {
  ok: boolean
  engine: { cadencePerMinute: number; dailyTarget: number; purgeAfterDays: number }
  stats: { totalPages: number; conversions: number; purgeable: number }
}

export default function PsoEngine() {
  const [data, setData] = useState<EngineStats | null>(null)
  const [niche, setNiche] = useState("")
  const [busy, setBusy] = useState<"gen" | "purge" | null>(null)
  const [lastResult, setLastResult] = useState("")

  const refresh = () =>
    fetch("/api/pso")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))

  useEffect(() => {
    refresh()
  }, [])

  const generate = async () => {
    if (!niche.trim() || busy) return
    setBusy("gen")
    setLastResult("")
    try {
      const res = await fetch("/api/pso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: niche.trim(), count: 10 }),
      })
      const j = await res.json()
      setLastResult(j.ok ? `${j.saved}/${j.generated} páginas publicadas` : j.error ?? "falhou")
      refresh()
    } catch {
      setLastResult("falha de rede")
    } finally {
      setBusy(null)
    }
  }

  const purge = async () => {
    if (busy) return
    setBusy("purge")
    try {
      const res = await fetch("/api/pso", { method: "DELETE" })
      const j = await res.json()
      setLastResult(j.ok ? `${j.purged} páginas expurgadas` : j.error ?? "falhou")
      refresh()
    } catch {
      setLastResult("falha de rede")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Gauge className="w-4 h-4 text-black" />
          </div>
          <h3 className="text-lg font-semibold text-text">Motor PSO Industrial</h3>
        </div>
        <span className="text-[10px] font-mono text-textSecondary uppercase tracking-widest">
          cauda longa
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-surface2 rounded-lg border border-border p-3 text-center">
          <p className="text-xl font-bold text-accent">
            {data?.engine.cadencePerMinute ?? 10}/min
          </p>
          <p className="text-[10px] text-textSecondary mt-0.5">cadência</p>
        </div>
        <div className="bg-surface2 rounded-lg border border-border p-3 text-center">
          <p className="text-xl font-bold text-accent">
            {(data?.engine.dailyTarget ?? 14400).toLocaleString("pt-BR")}
          </p>
          <p className="text-[10px] text-textSecondary mt-0.5">alvo/dia</p>
        </div>
        <div className="bg-surface2 rounded-lg border border-border p-3 text-center">
          <p className="text-xl font-bold text-accent">
            {data?.engine.purgeAfterDays ?? 30}d
          </p>
          <p className="text-[10px] text-textSecondary mt-0.5">expurgo</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-textSecondary mb-4">
        <span>
          Páginas ativas:{" "}
          <b className="text-text">{data?.stats.totalPages ?? "—"}</b>
        </span>
        <span>
          Conversões: <b className="text-success">{data?.stats.conversions ?? "—"}</b>
        </span>
        <span>
          Expurgáveis: <b className="text-warning">{data?.stats.purgeable ?? "—"}</b>
        </span>
      </div>

      <div className="flex gap-2">
        <input
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="nicho (ex: perfume importado)"
          className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-textSecondary focus:outline-none focus:border-primary"
        />
        <button
          onClick={generate}
          disabled={busy !== null}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-black text-xs font-bold rounded-lg hover:bg-primaryDark transition-colors disabled:opacity-50"
        >
          {busy === "gen" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
          Gerar 10
        </button>
        <button
          onClick={purge}
          disabled={busy !== null}
          className="flex items-center gap-1.5 px-3 py-2 bg-surface3 text-text text-xs font-bold rounded-lg hover:border-error transition-colors disabled:opacity-50 border border-border"
        >
          {busy === "purge" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          Expurgar
        </button>
      </div>

      {lastResult && (
        <p className="mt-3 text-xs text-textSecondary flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-accent" />
          {lastResult}
        </p>
      )}
    </div>
  )
}
