"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import {
  Github,
  Triangle,
  Database,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Key,
  Link2,
  Unlink,
  Eye,
  EyeOff,
} from "lucide-react"

type ServiceId = "github" | "vercel" | "supabase"

export default function OnboardingPage() {
  const router = useRouter()
  const { user, connections, connectService, disconnectService } = useAuth()

  const [githubToken, setGithubToken] = useState("")
  const [githubUser, setGithubUser] = useState("")
  const [vercelToken, setVercelToken] = useState("")
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")
  const [oauthLoading, setOauthLoading] = useState<ServiceId | null>(null)
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({})

  const toggleVisible = (field: string) => {
    setVisibleFields((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const simulateOAuth = async (service: ServiceId) => {
    setOauthLoading(service)
    await new Promise((resolve) => setTimeout(resolve, 1400))
    if (service === "github") {
      connectService("github", {
        token: `gho_${Math.random().toString(36).substring(2, 18)}`,
        username: user?.name?.toLowerCase().replace(/\s+/g, "-") || "utilizador",
        connectedAt: "",
      })
    } else if (service === "vercel") {
      connectService("vercel", {
        token: `vcel_${Math.random().toString(36).substring(2, 18)}`,
        connectedAt: "",
      })
    }
    setOauthLoading(null)
  }

  const connectGithubToken = () => {
    if (!githubToken.trim()) return
    connectService("github", {
      token: githubToken.trim(),
      username: githubUser.trim() || undefined,
      connectedAt: "",
    })
  }

  const connectVercelToken = () => {
    if (!vercelToken.trim()) return
    connectService("vercel", { token: vercelToken.trim(), connectedAt: "" })
  }

  const connectSupabase = () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) return
    connectService("supabase", {
      url: supabaseUrl.trim(),
      anonKey: supabaseKey.trim(),
      connectedAt: "",
    })
  }

  const connectedCount = Object.keys(connections).length

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-8">
          <span className="badge-gold inline-block mb-4">Configuração inicial</span>
          <h1 className="text-3xl font-bold text-text mb-2">
            Ligue a sua infraestrutura
          </h1>
          <p className="text-textSecondary">
            {user?.name ? `Olá, ${user.name}. ` : ""}
            Associe as suas credenciais para ativar deploys, repositórios e bases de dados automáticos.
          </p>
        </div>

        <div className="space-y-4">
          {/* GitHub */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-surface2 rounded-lg flex items-center justify-center border border-border">
                  <Github className="w-6 h-6 text-text" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text">GitHub</h3>
                  <p className="text-xs text-textSecondary">Gestão de repositórios e sincronização de código</p>
                </div>
              </div>
              {connections.github && (
                <span className="flex items-center gap-1 text-xs text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  Conectado
                </span>
              )}
            </div>
            {connections.github ? (
              <div className="flex items-center justify-between bg-surface2 rounded-lg px-4 py-3 border border-border">
                <span className="text-sm text-textSecondary font-mono">
                  {connections.github.username ? `@${connections.github.username} · ` : ""}
                  {connections.github.token.slice(0, 8)}••••••••
                </span>
                <button
                  onClick={() => disconnectService("github")}
                  className="flex items-center gap-1 text-xs text-textSecondary hover:text-error transition-colors"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  Desligar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => simulateOAuth("github")}
                  disabled={oauthLoading !== null}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface2 hover:bg-surface3 border border-border rounded-lg text-sm text-text font-medium transition-colors disabled:opacity-60"
                >
                  {oauthLoading === "github" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Github className="w-4 h-4" />
                  )}
                  <span>Conectar com OAuth</span>
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-xs text-textSecondary">ou use um token pessoal</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={githubUser}
                    onChange={(e) => setGithubUser(e.target.value)}
                    placeholder="utilizador-github"
                    className="w-40 bg-surface2 border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder-textSecondary focus:outline-none focus:border-primary"
                  />
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_..."
                    className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder-textSecondary focus:outline-none focus:border-primary font-mono"
                  />
                  <button
                    onClick={connectGithubToken}
                    disabled={!githubToken.trim()}
                    className="px-4 py-2.5 bg-primary hover:bg-primaryDark disabled:bg-surface3 disabled:text-textSecondary rounded-lg text-black text-sm font-semibold transition-colors"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Vercel */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-surface2 rounded-lg flex items-center justify-center border border-border">
                  <Triangle className="w-6 h-6 text-text fill-text" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text">Vercel</h3>
                  <p className="text-xs text-textSecondary">Deploys automáticos por utilizador</p>
                </div>
              </div>
              {connections.vercel && (
                <span className="flex items-center gap-1 text-xs text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  Conectado
                </span>
              )}
            </div>
            {connections.vercel ? (
              <div className="flex items-center justify-between bg-surface2 rounded-lg px-4 py-3 border border-border">
                <span className="text-sm text-textSecondary font-mono">
                  {connections.vercel.token.slice(0, 8)}••••••••
                </span>
                <button
                  onClick={() => disconnectService("vercel")}
                  className="flex items-center gap-1 text-xs text-textSecondary hover:text-error transition-colors"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  Desligar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => simulateOAuth("vercel")}
                  disabled={oauthLoading !== null}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface2 hover:bg-surface3 border border-border rounded-lg text-sm text-text font-medium transition-colors disabled:opacity-60"
                >
                  {oauthLoading === "vercel" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )}
                  <span>Conectar conta Vercel</span>
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-xs text-textSecondary">ou insira um token de acesso</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={vercelToken}
                    onChange={(e) => setVercelToken(e.target.value)}
                    placeholder="Token da Vercel"
                    className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder-textSecondary focus:outline-none focus:border-primary font-mono"
                  />
                  <button
                    onClick={connectVercelToken}
                    disabled={!vercelToken.trim()}
                    className="px-4 py-2.5 bg-primary hover:bg-primaryDark disabled:bg-surface3 disabled:text-textSecondary rounded-lg text-black text-sm font-semibold transition-colors"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Supabase */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-surface2 rounded-lg flex items-center justify-center border border-border">
                  <Database className="w-6 h-6 text-text" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text">Supabase</h3>
                  <p className="text-xs text-textSecondary">Base de dados e autenticação do projeto</p>
                </div>
              </div>
              {connections.supabase && (
                <span className="flex items-center gap-1 text-xs text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  Conectado
                </span>
              )}
            </div>
            {connections.supabase ? (
              <div className="flex items-center justify-between bg-surface2 rounded-lg px-4 py-3 border border-border">
                <span className="text-sm text-textSecondary font-mono">
                  {connections.supabase.url}
                </span>
                <button
                  onClick={() => disconnectService("supabase")}
                  className="flex items-center gap-1 text-xs text-textSecondary hover:text-error transition-colors"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  Desligar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="url"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder-textSecondary focus:outline-none focus:border-primary font-mono"
                />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={visibleFields["supabase"] ? "text" : "password"}
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                      placeholder="Chave anónima (anon key)"
                      className="w-full bg-surface2 border border-border rounded-lg pl-3 pr-10 py-2.5 text-sm text-text placeholder-textSecondary focus:outline-none focus:border-primary font-mono"
                    />
                    <button
                      onClick={() => toggleVisible("supabase")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-textSecondary hover:text-accent transition-colors"
                    >
                      {visibleFields["supabase"] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={connectSupabase}
                    disabled={!supabaseUrl.trim() || !supabaseKey.trim()}
                    className="px-4 py-2.5 bg-primary hover:bg-primaryDark disabled:bg-surface3 disabled:text-textSecondary rounded-lg text-black text-sm font-semibold transition-colors flex items-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    <span>Guardar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-textSecondary hover:text-accent transition-colors"
          >
            Pular por agora
          </button>
          <button
            onClick={() => router.push("/")}
            className="btn-primary flex items-center gap-2 px-6 py-3"
          >
            <span>{connectedCount > 0 ? `Concluir (${connectedCount} ligado${connectedCount > 1 ? "s" : ""})` : "Ir para o Dashboard"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
