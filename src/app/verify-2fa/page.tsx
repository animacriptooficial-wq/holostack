"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { ShieldCheck, KeyRound, Loader2 } from "lucide-react"

export default function Verify2FAPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, twoFactor, twoFactorVerified, verifyTwoFactor } = useAuth()

  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace("/login")
      return
    }
    if (!twoFactor.enabled) {
      router.replace("/setup-2fa")
      return
    }
    if (twoFactorVerified) {
      finish()
    }
  }, [isLoading, isAuthenticated, twoFactor.enabled, twoFactorVerified, router])

  const finish = () => {
    const target = sessionStorage.getItem("holostack_redirect") || "/"
    sessionStorage.removeItem("holostack_redirect")
    router.push(target)
  }

  const handleVerify = async () => {
    const normalized = code.replace(/[\s-]/g, "")
    if (normalized.length < 6) {
      setError("Introduza o código de 6 dígitos ou um código de recuperação.")
      return
    }
    setVerifying(true)
    setError(null)
    const ok = await verifyTwoFactor(code)
    setVerifying(false)
    if (ok) {
      finish()
    } else {
      setError("Código inválido. Tente novamente ou use um código de recuperação.")
      setCode("")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center shadow-glow-gold mb-4">
            <ShieldCheck className="w-7 h-7 text-black" />
          </div>
          <h1 className="text-2xl font-bold text-text">Verificação em duas etapas</h1>
          <p className="text-sm text-textSecondary mt-1 text-center">
            Introduza o código do autenticador ou um código de recuperação
          </p>
        </div>

        <div className="card">
          <div className="relative mb-5">
            <KeyRound className="w-4 h-4 text-textSecondary absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.slice(0, 9))}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              placeholder="000000 ou XXXX-XXXX"
              className="w-full bg-surface2 border border-border rounded-lg pl-11 pr-4 py-3 text-lg text-text placeholder-textSecondary focus:outline-none focus:border-primary tracking-[0.4em] text-center font-mono"
            />
          </div>

          {error && <p className="mb-4 text-sm text-error text-center">{error}</p>}

          <button
            onClick={handleVerify}
            disabled={verifying || code.trim().length < 6}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-60"
          >
            {verifying ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>Verificar</span>
          </button>

          <p className="text-xs text-textSecondary text-center mt-4">
            Perdeu o acesso ao autenticador? Use um código de recuperação guardado durante a configuração.
          </p>
        </div>
      </div>
    </div>
  )
}
