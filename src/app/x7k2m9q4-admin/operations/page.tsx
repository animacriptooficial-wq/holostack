"use client"

import { useState } from "react"
import StateMonitor from "@/components/workspace/StateMonitor"
import {
  Pause,
  Play,
  RotateCcw,
  Trash2,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  ListTodo,
} from "lucide-react"

export default function AdminOperationsPage() {
  const [queuePaused, setQueuePaused] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [actionLog, setActionLog] = useState<string[]>([
    "Sistema iniciado — todos os serviços operacionais",
  ])
  const [cacheCleared, setCacheCleared] = useState(false)

  const log = (message: string) => {
    const stamp = new Date().toLocaleTimeString("pt-BR")
    setActionLog((prev) => [`[${stamp}] ${message}`, ...prev.slice(0, 19)])
  }

  const toggleQueue = () => {
    setQueuePaused(!queuePaused)
    log(queuePaused ? "Fila de geração retomada" : "Fila de geração pausada")
  }

  const toggleMaintenance = () => {
    setMaintenanceMode(!maintenanceMode)
    log(maintenanceMode ? "Modo de manutenção desativado" : "Modo de manutenção ATIVADO")
  }

  const clearCache = () => {
    setCacheCleared(true)
    log("Cache distribuído purgado")
    setTimeout(() => setCacheCleared(false), 3000)
  }

  const restartService = (name: string) => {
    log(`Reinício solicitado: ${name}`)
  }

  const services = [
    { id: "api", name: "API Principal", uptime: "99.98%" },
    { id: "generator", name: "Gerador de IA", uptime: "99.90%" },
    { id: "db", name: "Banco de Dados", uptime: "99.95%" },
    { id: "queue", name: "Fila de Deploys", uptime: "98.70%" },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Controlo Operacional</h1>
        <p className="text-sm text-textSecondary">
          Gestão da fila, serviços e modo de manutenção
        </p>
      </div>

      {maintenanceMode && (
        <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/40 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <span className="text-sm text-warning font-medium">
            Modo de manutenção ativo — novos pedidos de geração estão bloqueados.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={toggleQueue}
          className={`card flex items-center gap-4 text-left transition-all duration-300 ${
            queuePaused ? "border-warning" : "hover:border-primary"
          }`}
        >
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${queuePaused ? "bg-warning" : "bg-primary"}`}>
            {queuePaused ? <Play className="w-5 h-5 text-black" /> : <Pause className="w-5 h-5 text-black" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-text">
              {queuePaused ? "Retomar fila" : "Pausar fila"}
            </p>
            <p className="text-xs text-textSecondary">
              {queuePaused ? "3 tarefas em espera" : "Processamento ativo"}
            </p>
          </div>
        </button>

        <button
          onClick={toggleMaintenance}
          className={`card flex items-center gap-4 text-left transition-all duration-300 ${
            maintenanceMode ? "border-warning" : "hover:border-primary"
          }`}
        >
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${maintenanceMode ? "bg-warning" : "bg-surface2 border border-border"}`}>
            <Wrench className={`w-5 h-5 ${maintenanceMode ? "text-black" : "text-accent"}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">Modo manutenção</p>
            <p className="text-xs text-textSecondary">
              {maintenanceMode ? "Ativo" : "Desativado"}
            </p>
          </div>
        </button>

        <button
          onClick={clearCache}
          className="card flex items-center gap-4 text-left hover:border-primary transition-all duration-300"
        >
          <div className="w-11 h-11 rounded-lg bg-surface2 border border-border flex items-center justify-center">
            {cacheCleared ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <Trash2 className="w-5 h-5 text-accent" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-text">
              {cacheCleared ? "Cache purgado" : "Purgar cache"}
            </p>
            <p className="text-xs text-textSecondary">Limpa artefactos de build</p>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StateMonitor projectName="HoloStack" />

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-base font-semibold text-text mb-4">Serviços — Reinício</h3>
            <div className="space-y-2">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between px-3 py-2.5 bg-surface2 rounded-lg border border-border"
                >
                  <div>
                    <p className="text-sm text-text">{service.name}</p>
                    <p className="text-xs text-textSecondary">Uptime {service.uptime}</p>
                  </div>
                  <button
                    onClick={() => restartService(service.name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface3 hover:bg-surface2 border border-border rounded-lg text-xs text-textSecondary hover:text-accent transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reiniciar</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <ListTodo className="w-4 h-4 text-accent" />
              <h3 className="text-base font-semibold text-text">Registo de ações</h3>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-thin">
              {actionLog.map((entry, index) => (
                <p key={index} className="text-xs text-textSecondary font-mono">
                  {entry}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
