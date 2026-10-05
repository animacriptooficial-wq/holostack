"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Code2,
  Smartphone,
  Video,
  Globe,
  Settings,
  ChevronDown,
  ChevronRight,
  Lock,
  Home,
  Wand2,
} from "lucide-react"

export default function Sidebar() {
  const pathname = usePathname()
  const [expandedSection, setExpandedSection] = useState<string | null>("ai-models")
  const [selectedModel, setSelectedModel] = useState("auto")

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const aiModels = [
    { id: "claude-code", name: "Claude Code", badge: "subscription", badgeClass: "badge-amber" },
    { id: "chatgpt", name: "ChatGPT", badge: "subscription", badgeClass: "badge-violet" },
    { id: "openai-all", name: "OPEN AI All models", badge: null, badgeClass: "" },
    { id: "auto", name: "Auto", badge: null, badgeClass: "" },
    { id: "free", name: "Free (OpenRouter)", badge: null, badgeClass: "" },
  ]

  const recentModels = [
    { id: "gpt5-luna", name: "gpt 5 & luna" },
    { id: "gpt6-bot", name: "gpt 6 & bot" },
    { id: "deepseek", name: "DeepSeek" },
    { id: "deepseek-v3", name: "DeepSeek V3 / Flash" },
  ]

  const quickActions = [
    { id: "webapp", name: "Web App", icon: Globe },
    { id: "website", name: "Website", icon: LayoutDashboard },
    { id: "mobile", name: "Mobile App", icon: Smartphone },
    { id: "video", name: "Video Module", icon: Video },
  ]

  const navItems = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Gerador", href: "/generator", icon: Wand2 },
    { name: "Workspace", href: "/workspace", icon: Code2 },
  ]

  return (
    <aside className="w-64 bg-surface border-r border-border h-screen flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center shadow-glow-gold">
            <span className="text-black font-bold text-xl">H</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-accent">Holo Stack</h1>
            <p className="text-xs text-textSecondary">PSO Ecosystem</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="mb-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-black font-semibold"
                    : "text-text hover:bg-surface2 hover:text-accent"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>

        <div className="mb-6">
          <button
            onClick={() => toggleSection("ai-models")}
            className="w-full flex items-center justify-between px-4 py-2 text-textSecondary hover:text-accent transition-colors"
          >
            <span className="text-sm font-semibold uppercase tracking-wider">AI Models</span>
            {expandedSection === "ai-models" ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {expandedSection === "ai-models" && (
            <div className="mt-2 space-y-1">
              {aiModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${
                    selectedModel === model.id
                      ? "bg-surface2 text-text"
                      : "text-text hover:bg-surface2"
                  }`}
                >
                  <span className="text-sm">{model.name}</span>
                  {model.badge && (
                    <span className={model.badgeClass}>{model.badge}</span>
                  )}
                </button>
              ))}

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-textSecondary px-4 mb-2">Recent</p>
                {recentModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`w-full flex items-center justify-between px-4 py-2 rounded transition-colors ${
                      selectedModel === model.id
                        ? "bg-surface2 text-text"
                        : "text-textSecondary hover:text-accent hover:bg-surface2"
                    }`}
                  >
                    <span className="text-xs">{model.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-textSecondary px-4 mb-2">
            Quick Actions
          </p>
          <div className="space-y-1">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.id}
                  href="/workspace"
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-text hover:bg-surface2 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{action.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primaryDark rounded-lg text-black text-sm font-semibold transition-colors">
          <Lock className="w-4 h-4" />
          <span>Unlock all models</span>
        </button>
        <Link
          href="/settings"
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
            pathname === "/settings"
              ? "bg-primary text-black font-semibold"
              : "text-text hover:bg-surface2"
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm">Settings</span>
        </Link>
      </div>
    </aside>
  )
}
