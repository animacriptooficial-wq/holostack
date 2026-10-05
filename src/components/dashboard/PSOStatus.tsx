"use client"

import { Activity, CheckCircle, AlertCircle, Clock, Server, Database, Network } from "lucide-react"

interface PSOStatusProps {
  projectName: string
}

export default function PSOStatus({ projectName }: PSOStatusProps) {
  const systems = [
    { name: "API Server", status: "active", uptime: "99.9%", icon: Server },
    { name: "Database", status: "active", uptime: "99.8%", icon: Database },
    { name: "Network", status: "warning", uptime: "98.5%", icon: Network },
    { name: "AI Engine", status: "active", uptime: "99.7%", icon: Activity },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-success"
      case "warning":
        return "text-warning"
      case "error":
        return "text-error"
      default:
        return "text-textSecondary"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />
      case "warning":
        return <AlertCircle className="w-4 h-4" />
      case "error":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4 text-black" />
          </div>
          <h3 className="text-lg font-semibold text-text">PSO Status</h3>
        </div>
        <span className="text-sm text-textSecondary">{projectName}</span>
      </div>

      <div className="space-y-4">
        {systems.map((system, index) => {
          const Icon = system.icon
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-surface2 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm font-medium text-text">{system.name}</p>
                  <p className="text-xs text-textSecondary">Uptime: {system.uptime}</p>
                </div>
              </div>
              <div className={`flex items-center gap-2 ${getStatusColor(system.status)}`}>
                {getStatusIcon(system.status)}
                <span className="text-sm capitalize">{system.status}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-textSecondary">Overall Status</span>
          <div className="flex items-center gap-2 text-success">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Operational</span>
          </div>
        </div>
      </div>
    </div>
  )
}
