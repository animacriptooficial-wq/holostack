"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, ProvisionStep } from "@/lib/auth"
import {
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Loader2,
  Zap,
  Eye,
  EyeOff,
  CheckCircle2,
  Database,
  Triangle,
  Github,
  X,
} from "lucide-react"

type AuthTab = "login" | "register"
type AuthMethod = "email" | "phone"
type PopupStage = "closed" | "account" | "consent"
type FlowState = "idle" | "google-popup" | "provisioning"

const PROVISION_STEPS: { id: ProvisionStep; label: string; icon: typeof Database }[] = [
  { id: "supabase", label: "A configurar Supabase...", icon: Database },
  { id: "vercel", label: "A ligar Vercel...", icon: Triangle },
  { id: "github", label: "A sincronizar GitHub...", icon: Github },
]

function GoogleLogo() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const {
    isAuthenticated,
    isLoading,
    loginWithGoogle,
    loginWithEmail,
    loginWithPhone,
    provisionInfrastructure,
    twoFactor,
    twoFactorVerified,
  } = useAuth()

  const [tab, setTab] = useState<AuthTab>("login")
  const [method, setMethod] = useState<AuthMethod>("email")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [countryCode, setCountryCode] = useState("+55")
  const [phone, setPhone] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [flow, setFlow] = useState<FlowState>("idle")
  const [popupStage, setPopupStage] = useState<PopupStage>("closed")
  const [provisionStep, setProvisionStep] = useState<ProvisionStep | null>(null)

  useEffect(() => {
    if (!isLoading && isAuthenticated && flow === "idle") {
      router.replace("/onboarding")
    }
  }, [isAuthenticated, isLoading, router, flow])

  const routeAfterAuth = (next: string) => {
    sessionStorage.setItem("holostack_redirect", next)
    if (twoFactor.enabled && !twoFactorVerified) {
      router.push("/verify-2fa")
    } else if (!twoFactor.enabled) {
      router.push("/setup-2fa")
    } else {
      sessionStorage.removeItem("holostack_redirect")
      router.push(next)
    }
  }

  const runAuth = async (action: () => Promise<void>) => {
    setError(null)
    setSubmitting(true)
    try {
      await action()
      routeAfterAuth("/onboarding")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na autenticação. Tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  const openGooglePopup = () => {
    setFlow("google-popup")
    setPopupStage("account")
    setError(null)
  }

  const selectGoogleAccount = () => {
    setPopupStage("consent")
  }

  const authorizeGoogle = async () => {
    setPopupStage("closed")
    setFlow("provisioning")
    setProvisionStep(null)
    try {
      await loginWithGoogle()
      await provisionInfrastructure((step) => setProvisionStep(step))
      routeAfterAuth("/")
    } catch (err) {
      setFlow("idle")
      setError(err instanceof Error ? err.message : "Falha na autenticação Google.")
    }
  }

  const cancelGooglePopup = () => {
    setPopupStage("closed")
    setFlow("idle")
  }

  const handleEmailSubmit = () => {
    if (!email.includes("@")) {
      setError("Introduza um e-mail válido.")
      return
    }
    if (password.length < 6) {
      setError("A palavra-passe deve ter pelo menos 6 caracteres.")
      return
    }
    if (tab === "register" && !name.trim()) {
      setError("Introduza o seu nome.")
      return
    }
    runAuth(() => loginWithEmail(email, password, tab === "register" ? name : undefined))
  }

  const handlePhoneSubmit = () => {
    if (phone.replace(/\D/g, "").length < 8) {
      setError("Introduza um número de telefone válido.")
      return
    }
    if (!otpSent) {
      setOtpSent(true)
      setError(null)
      return
    }
    if (otpCode.length < 4) {
      setError("Introduza o código de verificação.")
      return
    }
    runAuth(() => loginWithPhone(`${countryCode} ${phone}`))
  }

  const stepIndex = (step: ProvisionStep | null) =>
    step === null ? -1 : step === "done" ? PROVISION_STEPS.length : PROVISION_STEPS.findIndex((s) => s.id === step)

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

      {/* Google OAuth Popup */}
      {popupStage !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <GoogleLogo />
                <span className="text-gray-700 font-medium text-sm">Iniciar sessão com o Google</span>
              </div>
              <button
                onClick={cancelGooglePopup}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {popupStage === "account" ? (
              <div className="p-5">
                <h2 className="text-lg font-medium text-gray-900 mb-1">Escolher uma conta</h2>
                <p className="text-sm text-gray-500 mb-4">
                  para continuar para <span className="text-blue-600">holostack.app</span>
                </p>
                <button
                  onClick={selectGoogleAccount}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-white font-semibold">
                    U
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Utilizador</p>
                    <p className="text-xs text-gray-500">utilizador@gmail.com</p>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors text-left">
                  <div className="w-9 h-9 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">Utilizar outra conta</p>
                </button>
              </div>
            ) : (
              <div className="p-5">
                <h2 className="text-lg font-medium text-gray-900 mb-1">Autorizar HoloStack</h2>
                <p className="text-sm text-gray-500 mb-4">
                  O HoloStack pretende aceder à sua conta Google para criar o seu perfil e provisionar a sua infraestrutura.
                </p>
                <ul className="text-xs text-gray-500 space-y-2 mb-5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    Nome e endereço de e-mail
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    Criar projeto Supabase dedicado
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    Ligar deploys Vercel e repositórios GitHub
                  </li>
                </ul>
                <div className="flex gap-2">
                  <button
                    onClick={cancelGooglePopup}
                    className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={authorizeGoogle}
                    className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm text-white font-medium transition-colors"
                  >
                    Permitir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Provisioning Overlay */}
      {flow === "provisioning" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-md card">
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center shadow-glow-gold mb-4">
                <Zap className="w-7 h-7 text-black" />
              </div>
              <h2 className="text-xl font-bold text-text">A preparar o seu ambiente</h2>
              <p className="text-sm text-textSecondary mt-1 text-center">
                Estamos a provisionar automaticamente a sua infraestrutura pessoal.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {PROVISION_STEPS.map((step, index) => {
                const Icon = step.icon
                const current = stepIndex(provisionStep)
                const isDone = current > index
                const isActive = current === index
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-300 ${
                      isActive
                        ? "border-primary bg-surface2"
                        : isDone
                        ? "border-border bg-surface2"
                        : "border-border opacity-50"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 text-accent animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5 text-textSecondary" />
                    )}
                    <span className={`text-sm ${isDone ? "text-success" : isActive ? "text-text" : "text-textSecondary"}`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="w-full h-1.5 bg-surface3 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${(Math.max(0, stepIndex(provisionStep)) / PROVISION_STEPS.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-textSecondary text-center mt-3">
              {provisionStep === "done" ? "Tudo pronto. A redirecionar..." : "Isto demora apenas alguns segundos."}
            </p>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center shadow-glow-gold mb-4">
            <span className="text-black font-bold text-2xl">H</span>
          </div>
          <h1 className="text-2xl font-bold text-text">HoloStack</h1>
          <p className="text-sm text-textSecondary mt-1">
            {tab === "login" ? "Entre na sua conta para continuar" : "Crie a sua conta gratuita"}
          </p>
        </div>

        <div className="card">
          <div className="flex mb-6 bg-surface2 rounded-lg p-1 border border-border">
            {(["login", "register"] as AuthTab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t)
                  setError(null)
                }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  tab === t ? "bg-primary text-black" : "text-textSecondary hover:text-accent"
                }`}
              >
                {t === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <button
            onClick={openGooglePopup}
            disabled={submitting || flow !== "idle"}
            className="w-full flex items-center justify-center gap-3 py-3 bg-white hover:bg-gray-100 disabled:opacity-60 rounded-lg text-gray-800 font-medium text-sm transition-colors mb-4"
          >
            <GoogleLogo />
            <span>Continuar com Google</span>
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs text-textSecondary">ou continue com</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          <div className="flex gap-2 mb-5">
            <button
              onClick={() => {
                setMethod("email")
                setError(null)
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm border transition-colors ${
                method === "email"
                  ? "border-primary text-text bg-surface2"
                  : "border-border text-textSecondary hover:text-accent"
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>E-mail</span>
            </button>
            <button
              onClick={() => {
                setMethod("phone")
                setError(null)
                setOtpSent(false)
                setOtpCode("")
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm border transition-colors ${
                method === "phone"
                  ? "border-primary text-text bg-surface2"
                  : "border-border text-textSecondary hover:text-accent"
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Telefone</span>
            </button>
          </div>

          {method === "email" ? (
            <div className="space-y-4">
              {tab === "register" && (
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-textSecondary absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full bg-surface2 border border-border rounded-lg pl-11 pr-4 py-3 text-sm text-text placeholder-textSecondary focus:outline-none focus:border-primary"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="w-4 h-4 text-textSecondary absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-surface2 border border-border rounded-lg pl-11 pr-4 py-3 text-sm text-text placeholder-textSecondary focus:outline-none focus:border-primary"
                />
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-textSecondary absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Palavra-passe"
                  onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                  className="w-full bg-surface2 border border-border rounded-lg pl-11 pr-12 py-3 text-sm text-text placeholder-textSecondary focus:outline-none focus:border-primary"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-accent transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={handleEmailSubmit}
                disabled={submitting}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>{tab === "login" ? "Entrar" : "Criar conta"}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-surface2 border border-border rounded-lg px-3 py-3 text-sm text-text focus:outline-none focus:border-primary w-24"
                >
                  <option value="+55">+55</option>
                  <option value="+351">+351</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                </select>
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-textSecondary absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="11 98765-4321"
                    className="w-full bg-surface2 border border-border rounded-lg pl-11 pr-4 py-3 text-sm text-text placeholder-textSecondary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              {otpSent && (
                <div className="relative">
                  <Lock className="w-4 h-4 text-textSecondary absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Código de verificação (ex: 1234)"
                    className="w-full bg-surface2 border border-border rounded-lg pl-11 pr-4 py-3 text-sm text-text placeholder-textSecondary focus:outline-none focus:border-primary tracking-widest"
                  />
                </div>
              )}
              <button
                onClick={handlePhoneSubmit}
                disabled={submitting}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>{otpSent ? "Verificar e entrar" : "Enviar código"}</span>
              </button>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-error text-center">{error}</p>}

          <button
            onClick={() => router.push("/")}
            className="w-full mt-4 py-2 text-sm text-textSecondary hover:text-accent transition-colors"
          >
            Continuar como convidado
          </button>
        </div>

        <p className="text-xs text-textSecondary text-center mt-6">
          Ao continuar, você concorda com os Termos de Serviço e a Política de Privacidade do HoloStack.
        </p>
      </div>
    </div>
  )
}
