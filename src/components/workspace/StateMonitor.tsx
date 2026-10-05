"use client"

import { useState } from "react"
import { 
  RefreshCw, 
  Pause, 
  Play, 
  Settings, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  GitBranch,
  Database
} from "lucide-react"

interface StateMonitorProps {
  projectName: string
}

export default function StateMonitor({ projectName }: StateMonitorProps) {
  const [isRunning, setIsRunning] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const handleToggle = () => {
    setIsRunning(!isRunning)
    setLastUpdate(new Date())
  }

  const metrics = [
    { name: "Components", value: "24", change: "+3", icon: Layers, trend: "up" },
    { name: "Routes", value: "12", change: "+1", icon: GitBranch, trend: "up" },
    { name: "State Stores", value: "8", change: "0", icon: Database, trend: "stable" },
    { name: "API Calls", value: "156", change: "+24", icon: RefreshCw, trend: "up" },
  ]

  const recentEvents = [
    { time: "2m ago", type: "success", message: "Component 'Navbar' updated" },
    { time: "5m ago", type: "info", message: "Route '/dashboard' added" },
    { time: "8m ago", type: "warning", message: "API rate limit approaching" },
    { time: "12m ago", type: "success", message: "State synchronized" },
  ]

  const getEventIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-success" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-warning" />
      case "error":
        return <AlertTriangle className="w-4 h-4 text-error" />
      default:
        return <Clock className="w-4 h-4 text-textSecondary" />
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Layers className="w-4 h-4 text-black" />
          </div>
          <h3 className="text-lg font-semibold text-text">State Monitor</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggle}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
              isRunning 
                ? "bg-success text-white" 
                : "bg-warning text-black"
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? "Running" : "Paused"}</span>
          </button>
          <button className="p-2 rounded-lg hover:bg-surface2 text-textSecondary hover:text-accent transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div key={index} className="bg-surface2 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-accent" />
                <span className="text-xs text-textSecondary">{metric.name}</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-text">{metric.value}</span>
                <span className={`text-xs ${
                  metric.trend === "up" ? "text-success" : 
                  metric.trend === "down" ? "text-error" : 
                  "text-textSecondary"
                }`}>
                  {metric.change}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div>
        <h4 className="text-sm font-semibold text-text mb-3">Recent Events</h4>
        <div className="space-y-2">
          {recentEvents.map((event, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-surface2 rounded-lg border border-border">
              {getEventIcon(event.type)}
              <div className="flex-1">
                <p className="text-sm text-text">{event.message}</p>
                <p className="text-xs text-textSecondary">{event.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-textSecondary">
        <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
        <span>{projectName}</span>
      </div>
    </div>
  )
}
