"use client"

import MetricsGrid from "@/components/dashboard/MetricsGrid"
import APIMesh from "@/components/dashboard/APIMesh"
import PSOStatus from "@/components/dashboard/PSOStatus"
import { useAuth } from "@/lib/auth"
import { Github, Triangle, Database, CheckCircle2, AlertCircle } from "lucide-react"

export default function AdminOverviewPage() {
  const { user, connections } = useAuth()

  const integrations = [
    { name: "GitHub", icon: Github, connected: !!connections.github },
    { name: "Vercel", icon: Triangle, connected: !!connections.vercel },
    { name: "Supabase", icon: Database, connected: !!connections.supabase },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Visão Geral Operacional</h1>
          <p className="text-sm text-textSecondary">
            Sessão de {user?.name || "administrador"} · monitorização em tempo real
          </p>
        </div>
        <span className="flex items-center gap-2 text-xs text-success">
          <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
          Sistemas online
        </span>
      </div>

      <MetricsGrid />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <APIMesh />
        </div>
        <div className="space-y-6">
          <PSOStatus projectName="HoloStack" />
          <div className="card">
            <h3 className="text-base font-semibold text-text mb-4">Integrações Ativas</h3>
            <div className="space-y-2">
              {integrations.map((integration) => {
                const Icon = integration.icon
                return (
                  <div
                    key={integration.name}
                    className="flex items-center justify-between px-3 py-2.5 bg-surface2 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-text" />
                      <span className="text-sm text-text">{integration.name}</span>
                    </div>
                    {integration.connected ? (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Ligado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-textSecondary">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Inativo
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
