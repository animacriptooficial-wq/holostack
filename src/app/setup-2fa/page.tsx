"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { formatSecret, buildOtpauthUri } from "@/lib/totp"
import QRCode from "qrcode"
import {
  ShieldCheck,
  KeyRound,
  Copy,
  CheckCircle2,
  Loader2,
  ArrowRight,
  AlertTriangle,
} from "lucide-react"

export default function Setup2FAPage() {
  const router = useRouter()
  const {
    user,
    isAuthenticated,
    isLoading,
    twoFactor,
    pendingTwoFactorSecret,
    startTwoFactorSetup,
    confirmTwoFactorSetup,
  } = useAuth()

  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const secret = pendingTwoFactorSecret
  const account = user?.email || user?.phone || "user"

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (!isLoading && isAuthenticated && !secret && !twoFactor.enabled) {
      startTwoFactorSetup()
    }
  }, [isLoading, isAuthenticated, secret, twoFactor.enabled, startTwoFactorSetup])

  useEffect(() => {
    if (!secret) return
    QRCode.toDataURL(buildOtpauthUri(secret, account), {
      width: 220,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null))
  }, [secret, account])

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleConfirm = async () => {
    if (code.length !== 6) {
      setError("Introduza o código de 6 dígitos do autenticador.")
      return
    }
    setVerifying(true)
    setError(null)
    const codes = await confirmTwoFactorSetup(code)
    setVerifying(false)
    if (codes) {
      setRecoveryCodes(codes)
    } else {
      setError("Código inválido. Confirme a hora do dispositivo e tente novamente.")
      setCode("")
    }
  }

  const finish = () => {
    const target = sessionStorage.getItem("holostack_redirect") || "/"
    sessionStorage.removeItem("holostack_redirect")
    router.push(target)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center shadow-glow-gold mb-4">
            <ShieldCheck className="w-7 h-7 text-black" />
          </div>
          <h1 className="text-2xl font-bold text-text">Ativar 2FA</h1>
          <p className="text-sm text-textSecondary mt-1 text-center">
            Proteção obrigatória por TOTP (Google Authenticator, Authy, etc.)
          </p>
        </div>

        {!recoveryCodes ? (
          <div className="card">
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text mb-2">1. Leia o QR Code</h3>
              <p className="text-xs text-textSecondary mb-3">
                Abra o Google Authenticator ou Authy e aponte a câmara para o código abaixo:
              </p>
              <div className="flex items-start gap-2 p-2.5 bg-warning/10 border border-warning/30 rounded-lg mb-3">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <p className="text-[11px] text-textSecondary leading-snug">
                  Se já existir uma entrada <b className="text-text">"HoloStack"</b> antiga no
                  autenticador, <b className="text-text">apague-a primeiro</b> — códigos de um QR
                  antigo serão sempre rejeitados.
                </p>
              </div>
              <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-xl">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QR Code TOTP — HoloStack"
                      className="w-52 h-52"
                    />
                  ) : (
                    <div className="w-52 h-52 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-textSecondary mb-2">
                Não consegue ler? Introduza a chave manualmente no autenticador:
              </p>
              <div className="bg-surface2 border border-border rounded-lg p-4">
                <div className="flex items-center justify-between gap-3">
                  <code className="text-sm font-mono text-accent break-all">
                    {secret ? formatSecret(secret) : "A gerar..."}
                  </code>
                  {secret && (
                    <button
                      onClick={() => copyText(secret, "secret")}
                      className="p-2 rounded-lg hover:bg-surface3 text-textSecondary hover:text-accent transition-colors shrink-0"
                    >
                      {copied === "secret" ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
                {secret && (
                  <button
                    onClick={() =>
                      copyText(buildOtpauthUri(secret, user?.email || user?.phone || "user"), "uri")
                    }
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-surface3 hover:bg-surface2 rounded-lg text-xs text-textSecondary hover:text-accent transition-colors"
                  >
                    {copied === "uri" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copiar URI otpauth:// (importação direta)</span>
                  </button>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text mb-2">2. Confirme o código</h3>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-textSecondary absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                  placeholder="000000"
                  className="w-full bg-surface2 border border-border rounded-lg pl-11 pr-4 py-3 text-lg text-text placeholder-textSecondary focus:outline-none focus:border-primary tracking-[0.5em] text-center font-mono"
                />
              </div>
            </div>

            {error && <p className="mb-4 text-sm text-error text-center">{error}</p>}

            <button
              onClick={handleConfirm}
              disabled={verifying || code.length !== 6}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-60"
            >
              {verifying ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>Verificar e ativar 2FA</span>
            </button>
          </div>
        ) : (
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-success" />
              <h3 className="text-lg font-semibold text-text">2FA ativado com sucesso</h3>
            </div>
            <div className="flex items-start gap-3 p-3 bg-warning/10 border border-warning/30 rounded-lg mb-5">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-textSecondary">
                Guarde estes códigos de recuperação num local seguro. Cada código só pode ser usado uma vez e não serão mostrados novamente.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {recoveryCodes.map((rc) => (
                <code
                  key={rc}
                  className="bg-surface2 border border-border rounded-lg px-3 py-2 text-center text-sm font-mono text-text"
                >
                  {rc}
                </code>
              ))}
            </div>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => copyText(recoveryCodes.join("\n"), "codes")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-surface2 hover:bg-surface3 border border-border rounded-lg text-sm text-text transition-colors"
              >
                {copied === "codes" ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>Copiar códigos</span>
              </button>
            </div>
            <button
              onClick={finish}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
