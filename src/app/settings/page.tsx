"use client"

import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import APIKeyManagement from "@/components/workspace/APIKeyManagement"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import {
  Github,
  Triangle,
  Database,
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
  LogOut,
  Link2,
} from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const { user, connections, disconnectService, logout } = useAuth()

  const integrationCards = [
    {
      id: "github" as const,
      name: "GitHub",
      description: "Repositórios e sincronização de código",
      icon: Github,
      connected: !!connections.github,
      detail: connections.github?.username ? `@${connections.github.username}` : undefined,
    },
    {
      id: "vercel" as const,
      name: "Vercel",
      description: "Deploys automáticos",
      icon: Triangle,
      connected: !!connections.vercel,
      detail: undefined,
    },
    {
      id: "supabase" as const,
      name: "Supabase",
      description: "Base de dados do projeto",
      icon: Database,
      connected: !!connections.supabase,
      detail: connections.supabase?.url,
    },
  ]

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <div className="flex-1 ml-64">
        <Header />

        <main className="pt-24 pb-8 px-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-text mb-2">Configurações</h1>
              <p className="text-textSecondary">Conta, integrações e chaves de API</p>
            </div>

            {/* Account */}
            <div className="card mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center">
                    {user ? (
                      <span className="text-black font-bold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <UserIcon className="w-6 h-6 text-black" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text">
                      {user?.name || "Convidado"}
                    </h3>
                    <p className="text-sm text-textSecondary">
                      {user?.email || user?.phone || "Sem sessão iniciada"}
                    </p>
                  </div>
                </div>
                {user ? (
                  <button
                    onClick={() => {
                      logout()
                      router.push("/login")
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-surface2 hover:bg-surface3 border border-border rounded-lg text-sm text-text transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </button>
                ) : (
                  <button
                    onClick={() => router.push("/login")}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    Entrar
                  </button>
                )}
              </div>
            </div>

            {/* Infrastructure Integrations */}
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-text">Integrações de Infraestrutura</h3>
                  <p className="text-sm text-textSecondary">Serviços ligados ao seu perfil</p>
                </div>
                <button
                  onClick={() => router.push("/onboarding")}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primaryDark rounded-lg text-black text-sm font-semibold transition-colors"
                >
                  <Link2 className="w-4 h-4" />
                  <span>Gerir ligações</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {integrationCards.map((integration) => {
                  const Icon = integration.icon
                  return (
                    <div
                      key={integration.id}
                      className="bg-surface2 rounded-xl p-4 border border-border"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Icon className="w-6 h-6 text-text" />
                        {integration.connected ? (
                          <span className="flex items-center gap-1 text-xs text-success">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Conectado
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-textSecondary">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Desconectado
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-text">{integration.name}</h4>
                      <p className="text-xs text-textSecondary mb-3">{integration.description}</p>
                      {integration.connected ? (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-textSecondary font-mono truncate">
                            {integration.detail || "••••••••"}
                          </span>
                          <button
                            onClick={() => disconnectService(integration.id)}
                            className="text-xs text-textSecondary hover:text-error transition-colors"
                          >
                            Desligar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => router.push("/onboarding")}
                          className="text-xs text-accent hover:underline"
                        >
                          Conectar agora
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* API Key Center */}
            <APIKeyManagement />
          </div>
        </main>
      </div>
    </div>
  )
}
