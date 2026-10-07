"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import {
  LayoutDashboard,
  KeyRound,
  SlidersHorizontal,
  ShieldCheck,
  Palette,
  ArrowLeft,
  LogOut,
  Loader2,
  Lock,
} from "lucide-react"

const adminNav = [
  { name: "Visão Geral", href: "/x7k2m9q4-admin", icon: LayoutDashboard },
  { name: "Aparência", href: "/x7k2m9q4-admin/appearance", icon: Palette },
  { name: "Chaves de API", href: "/x7k2m9q4-admin/keys", icon: KeyRound },
  { name: "Operações", href: "/x7k2m9q4-admin/operations", icon: SlidersHorizontal },
  { name: "Segurança", href: "/x7k2m9q4-admin/security", icon: ShieldCheck },
]

const ADMIN_KEYS_FLAG = "holostack_admin_keys_ok"

function AccessKeysGate({ onUnlock }: { onUnlock: () => void }) {
  const [keys, setKeys] = useState(["", "", ""])
  const [error, setError] = useState("")
  const [checking, setChecking] = useState(false)

  const submit = async () => {
    if (keys.some((k) => !k.trim())) {
      setError("As 3 chaves são obrigatórias")
      return
    }
    setChecking(true)
    setError("")
    try {
      const res = await fetch("/api/admin/verify-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys }),
      })
      if (res.ok) {
        sessionStorage.setItem(ADMIN_KEYS_FLAG, "1")
        onUnlock()
      } else {
        setError("Acesso negado — bloqueio de segurança")
        setKeys(["", "", ""])
      }
    } catch {
      setError("Falha na validação — tenta novamente")
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card max-w-md w-full space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-error/20 border border-error/40 rounded-lg flex items-center justify-center">
            <Lock className="w-5 h-5 text-error" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text">3º Fator — Chaves de Acesso</h2>
            <p className="text-xs text-textSecondary">
              Tripla validação criptografada na borda
            </p>
          </div>
        </div>

        {keys.map((k, i) => (
          <input
            key={i}
            type="password"
            value={k}
            onChange={(e) => {
              const next = [...keys]
              next[i] = e.target.value
              setKeys(next)
            }}
            placeholder={`Chave de acesso ${i + 1}`}
            className="w-full bg-surface2 border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder-textSecondary focus:outline-none focus:border-error font-mono"
          />
        ))}

        {error && <p className="text-xs text-error font-medium">{error}</p>}

        <button
          onClick={submit}
          disabled={checking}
          className="w-full bg-primary text-black font-bold py-2.5 rounded-lg hover:bg-primaryDark transition-colors disabled:opacity-50"
        >
          {checking ? "A validar..." : "Desbloquear painel"}
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading, twoFactor, twoFactorVerified, logout } = useAuth()
  const [keysOk, setKeysOk] = useState(false)

  useEffect(() => {
    setKeysOk(sessionStorage.getItem(ADMIN_KEYS_FLAG) === "1")
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      sessionStorage.setItem("holostack_redirect", pathname)
      router.replace("/login")
      return
    }
    if (!twoFactor.enabled) {
      sessionStorage.setItem("holostack_redirect", pathname)
      router.replace("/setup-2fa")
      return
    }
    if (!twoFactorVerified) {
      sessionStorage.setItem("holostack_redirect", pathname)
      router.replace("/verify-2fa")
    }
  }, [isLoading, isAuthenticated, twoFactor.enabled, twoFactorVerified, pathname, router])

  if (isLoading || !isAuthenticated || !twoFactor.enabled || !twoFactorVerified) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
        <p className="text-sm text-textSecondary">A verificar permissões de acesso...</p>
      </div>
    )
  }

  // 3º fator — tripla validação de chaves de acesso (spec §2)
  if (!keysOk) {
    return <AccessKeysGate onUnlock={() => setKeysOk(true)} />
  }

  return (
    <div className="min-h-screen flex">
      {/* Admin Sidebar — isolated back-office nav */}
      <aside className="w-60 bg-surface border-r border-border h-screen flex flex-col fixed left-0 top-0 z-40">
        <div className="p-5 border-b border-border">
          <Link href="/x7k2m9q4-admin" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center shadow-glow-gold">
              <Lock className="w-4 h-4 text-black" />
            </div>
            <div>
              <h1 className="text-base font-bold text-accent">HoloStack</h1>
              <p className="text-[10px] text-textSecondary uppercase tracking-widest">Back Office</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
          {adminNav.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-black font-semibold"
                    : "text-textSecondary hover:bg-surface2 hover:text-accent"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-textSecondary hover:bg-surface2 hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar ao site</span>
          </Link>
          <button
            onClick={() => {
              logout()
              router.push("/login")
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-textSecondary hover:bg-surface2 hover:text-error transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* Admin content area */}
      <div className="flex-1 ml-60">
        <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="badge-gold">Painel Restrito</span>
            <span className="text-xs text-textSecondary">Acesso autenticado com 2FA</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-xs">
                {user?.name.charAt(0).toUpperCase() || "?"}
              </span>
            </div>
            <span className="text-sm text-text">{user?.name}</span>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
