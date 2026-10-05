"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { formatSecret } from "@/lib/totp"
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Copy,
  CheckCircle2,
  RefreshCw,
  Trash2,
  User as UserIcon,
  Clock,
} from "lucide-react"

export default function AdminSecurityPage() {
  const router = useRouter()
  const { user, twoFactor, disableTwoFactor } = useAuth()
  const [copied, setCopied] = useState<string | null>(null)
  const [confirmDisable, setConfirmDisable] = useState(false)

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDisable = () => {
    disableTwoFactor()
    setConfirmDisable(false)
  }

  const sessions = [
    {
      device: "Este navegador",
      location: "Sessão atual",
      time: "Agora",
      current: true,
    },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Segurança da Conta</h1>
        <p className="text-sm text-textSecondary">
          Autenticação de dois fatores, sessões e códigos de recuperação
        </p>
      </div>

      {/* Account */}
      <div className="card">
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
            <h3 className="text-base font-semibold text-text">{user?.name}</h3>
            <p className="text-sm text-textSecondary">
              {user?.email || user?.phone} · via {user?.provider}
            </p>
          </div>
        </div>
      </div>

      {/* 2FA Status */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text">Autenticação 2FA (TOTP)</h3>
              <p className="text-sm text-textSecondary">
                Google Authenticator / Authy — exigida no painel
              </p>
            </div>
          </div>
          {twoFactor.enabled ? (
            <span className="flex items-center gap-1.5 text-xs text-success">
              <CheckCircle2 className="w-4 h-4" />
              Ativa
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-warning">
              <ShieldAlert className="w-4 h-4" />
              Inativa
            </span>
          )}
        </div>

        {twoFactor.enabled && twoFactor.secret && (
          <div className="space-y-4">
            <div className="bg-surface2 border border-border rounded-lg p-4">
              <p className="text-xs text-textSecondary mb-1">Segredo TOTP configurado</p>
              <code className="text-sm font-mono text-accent">{formatSecret(twoFactor.secret)}</code>
            </div>

            <div className="bg-surface2 border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-textSecondary">
                  Códigos de recuperação restantes:{" "}
                  <span className="text-text font-semibold">{twoFactor.recoveryCodes.length}</span>
                </p>
                <button
                  onClick={() => copyText(twoFactor.recoveryCodes.join("\n"), "codes")}
                  className="flex items-center gap-1.5 text-xs text-textSecondary hover:text-accent transition-colors"
                >
                  {copied === "codes" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copiar</span>
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {twoFactor.recoveryCodes.map((rc) => (
                  <code
                    key={rc}
                    className="bg-surface3 rounded px-2 py-1.5 text-center text-xs font-mono text-text"
                  >
                    {rc}
                  </code>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => router.push("/setup-2fa")}
                className="flex items-center gap-2 px-4 py-2 bg-surface2 hover:bg-surface3 border border-border rounded-lg text-sm text-text transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Regenerar segredo</span>
              </button>
              {confirmDisable ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-error">Tem a certeza?</span>
                  <button
                    onClick={handleDisable}
                    className="px-4 py-2 bg-error hover:bg-red-600 rounded-lg text-sm text-white font-medium transition-colors"
                  >
                    Sim, desativar
                  </button>
                  <button
                    onClick={() => setConfirmDisable(false)}
                    className="px-4 py-2 bg-surface2 hover:bg-surface3 border border-border rounded-lg text-sm text-text transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDisable(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-surface2 hover:bg-surface3 border border-border rounded-lg text-sm text-textSecondary hover:text-error transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Desativar 2FA</span>
                </button>
              )}
            </div>
          </div>
        )}

        {!twoFactor.enabled && (
          <button
            onClick={() => router.push("/setup-2fa")}
            className="btn-primary flex items-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>Configurar 2FA agora</span>
          </button>
        )}
      </div>

      {/* Sessions */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-accent" />
          <h3 className="text-base font-semibold text-text">Sessões ativas</h3>
        </div>
        <div className="space-y-2">
          {sessions.map((session, index) => (
            <div
              key={index}
              className="flex items-center justify-between px-4 py-3 bg-surface2 rounded-lg border border-border"
            >
              <div>
                <p className="text-sm text-text">{session.device}</p>
                <p className="text-xs text-textSecondary">{session.location}</p>
              </div>
              {session.current && (
                <span className="text-xs text-success font-medium">Ativa agora</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
