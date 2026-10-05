"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { generateSecret, verifyTOTP, generateRecoveryCodes } from "@/lib/totp"

export type AuthProvider = "google" | "email" | "phone"

export interface User {
  id: string
  name: string
  email?: string
  phone?: string
  provider: AuthProvider
  avatar?: string
  createdAt: string
}

export interface ServiceConnections {
  github?: { token: string; username?: string; connectedAt: string }
  vercel?: { token: string; connectedAt: string }
  supabase?: { url: string; anonKey: string; connectedAt: string }
}

export type ProvisionStep = "supabase" | "vercel" | "github" | "done"

export interface TwoFactorState {
  secret: string | null
  enabled: boolean
  recoveryCodes: string[]
}

interface AuthContextValue {
  user: User | null
  connections: ServiceConnections
  isAuthenticated: boolean
  isLoading: boolean
  twoFactor: TwoFactorState
  twoFactorVerified: boolean
  pendingTwoFactorSecret: string | null
  startTwoFactorSetup: () => string
  confirmTwoFactorSetup: (code: string) => Promise<string[] | null>
  verifyTwoFactor: (code: string) => Promise<boolean>
  disableTwoFactor: () => void
  loginWithGoogle: () => Promise<User>
  loginWithEmail: (email: string, password: string, name?: string) => Promise<void>
  loginWithPhone: (phone: string) => Promise<void>
  connectService: (service: keyof ServiceConnections, data: ServiceConnections[keyof ServiceConnections]) => void
  disconnectService: (service: keyof ServiceConnections) => void
  provisionInfrastructure: (onStep?: (step: ProvisionStep) => void) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const USER_KEY = "holostack_user"
const CONNECTIONS_KEY = "holostack_connections"
const TWO_FACTOR_KEY = "holostack_2fa"
const TWO_FACTOR_SESSION = "holostack_2fa_verified"

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

function simulateNetworkDelay(ms = 900): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [connections, setConnections] = useState<ServiceConnections>({})
  const [isLoading, setIsLoading] = useState(true)
  const [twoFactor, setTwoFactor] = useState<TwoFactorState>({ secret: null, enabled: false, recoveryCodes: [] })
  const [twoFactorVerified, setTwoFactorVerified] = useState(false)
  const [pendingTwoFactorSecret, setPendingTwoFactorSecret] = useState<string | null>(null)

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_KEY)
      const storedConnections = localStorage.getItem(CONNECTIONS_KEY)
      const stored2FA = localStorage.getItem(TWO_FACTOR_KEY)
      const sessionVerified = sessionStorage.getItem(TWO_FACTOR_SESSION)
      if (storedUser) setUser(JSON.parse(storedUser))
      if (storedConnections) setConnections(JSON.parse(storedConnections))
      if (stored2FA) setTwoFactor(JSON.parse(stored2FA))
      if (sessionVerified === "1") setTwoFactorVerified(true)
    } catch {
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(CONNECTIONS_KEY)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const persistUser = useCallback((nextUser: User | null) => {
    setUser(nextUser)
    if (nextUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    } else {
      localStorage.removeItem(USER_KEY)
    }
  }, [])

  const persistConnections = useCallback((next: ServiceConnections) => {
    setConnections(next)
    localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(next))
  }, [])

  const loginWithGoogle = useCallback(async (): Promise<User> => {
    await simulateNetworkDelay(1200)
    const nextUser: User = {
      id: generateId(),
      name: "Utilizador Google",
      email: "utilizador@gmail.com",
      provider: "google",
      avatar: "G",
      createdAt: new Date().toISOString(),
    }
    persistUser(nextUser)
    return nextUser
  }, [persistUser])

  const loginWithEmail = useCallback(
    async (email: string, password: string, name?: string) => {
      await simulateNetworkDelay()
      if (password.length < 6) {
        throw new Error("A palavra-passe deve ter pelo menos 6 caracteres.")
      }
      const fallbackName = email.split("@")[0]
      persistUser({
        id: generateId(),
        name: name?.trim() || fallbackName,
        email,
        provider: "email",
        createdAt: new Date().toISOString(),
      })
    },
    [persistUser]
  )

  const loginWithPhone = useCallback(
    async (phone: string) => {
      await simulateNetworkDelay()
      persistUser({
        id: generateId(),
        name: "Utilizador",
        phone,
        provider: "phone",
        createdAt: new Date().toISOString(),
      })
    },
    [persistUser]
  )

  const connectService = useCallback(
    (service: keyof ServiceConnections, data: ServiceConnections[keyof ServiceConnections]) => {
      setConnections((prev) => {
        const next: ServiceConnections = {
          ...prev,
          [service]: { ...data, connectedAt: new Date().toISOString() },
        }
        localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(next))
        return next
      })
    },
    []
  )

  const disconnectService = useCallback((service: keyof ServiceConnections) => {
    setConnections((prev) => {
      const next = { ...prev }
      delete next[service]
      localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const provisionInfrastructure = useCallback(
    async (onStep?: (step: ProvisionStep) => void) => {
      const userSlug = (user?.name || "utilizador")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")

      onStep?.("supabase")
      await simulateNetworkDelay(1400)
      connectService("supabase", {
        url: `https://holostack-${userSlug}-${generateId().slice(0, 6)}.supabase.co`,
        anonKey: `sb_anon_${generateId()}${generateId()}`,
        connectedAt: "",
      })

      onStep?.("vercel")
      await simulateNetworkDelay(1400)
      connectService("vercel", {
        token: `vcel_${generateId()}${generateId()}`,
        connectedAt: "",
      })

      onStep?.("github")
      await simulateNetworkDelay(1400)
      connectService("github", {
        token: `gho_${generateId()}${generateId()}`,
        username: userSlug,
        connectedAt: "",
      })

      onStep?.("done")
    },
    [user, connectService]
  )

  const startTwoFactorSetup = useCallback((): string => {
    const secret = generateSecret()
    setPendingTwoFactorSecret(secret)
    return secret
  }, [])

  const confirmTwoFactorSetup = useCallback(
    async (code: string): Promise<string[] | null> => {
      if (!pendingTwoFactorSecret) return null
      const valid = await verifyTOTP(pendingTwoFactorSecret, code)
      if (!valid) return null
      const recoveryCodes = generateRecoveryCodes()
      const next: TwoFactorState = {
        secret: pendingTwoFactorSecret,
        enabled: true,
        recoveryCodes,
      }
      setTwoFactor(next)
      localStorage.setItem(TWO_FACTOR_KEY, JSON.stringify(next))
      setPendingTwoFactorSecret(null)
      sessionStorage.setItem(TWO_FACTOR_SESSION, "1")
      setTwoFactorVerified(true)
      return recoveryCodes
    },
    [pendingTwoFactorSecret]
  )

  const verifyTwoFactor = useCallback(
    async (code: string): Promise<boolean> => {
      if (!twoFactor.enabled || !twoFactor.secret) return false
      const normalized = code.replace(/[\s-]/g, "").toUpperCase()
      const recoveryIndex = twoFactor.recoveryCodes.findIndex(
        (rc) => rc.replace(/-/g, "").toUpperCase() === normalized
      )
      if (recoveryIndex >= 0) {
        const next: TwoFactorState = {
          ...twoFactor,
          recoveryCodes: twoFactor.recoveryCodes.filter((_, i) => i !== recoveryIndex),
        }
        setTwoFactor(next)
        localStorage.setItem(TWO_FACTOR_KEY, JSON.stringify(next))
        sessionStorage.setItem(TWO_FACTOR_SESSION, "1")
        setTwoFactorVerified(true)
        return true
      }
      const valid = await verifyTOTP(twoFactor.secret, code)
      if (valid) {
        sessionStorage.setItem(TWO_FACTOR_SESSION, "1")
        setTwoFactorVerified(true)
      }
      return valid
    },
    [twoFactor]
  )

  const disableTwoFactor = useCallback(() => {
    const next: TwoFactorState = { secret: null, enabled: false, recoveryCodes: [] }
    setTwoFactor(next)
    localStorage.removeItem(TWO_FACTOR_KEY)
    sessionStorage.removeItem(TWO_FACTOR_SESSION)
    setTwoFactorVerified(false)
  }, [])

  const logout = useCallback(() => {
    persistUser(null)
    sessionStorage.removeItem(TWO_FACTOR_SESSION)
    setTwoFactorVerified(false)
  }, [persistUser])

  return (
    <AuthContext.Provider
      value={{
        user,
        connections,
        isAuthenticated: !!user,
        isLoading,
        twoFactor,
        twoFactorVerified,
        pendingTwoFactorSecret,
        startTwoFactorSetup,
        confirmTwoFactorSetup,
        verifyTwoFactor,
        disableTwoFactor,
        loginWithGoogle,
        loginWithEmail,
        loginWithPhone,
        connectService,
        disconnectService,
        provisionInfrastructure,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>")
  }
  return ctx
}

export function useRequireAuth(redirectTo = "/login") {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(redirectTo)
    }
  }, [isAuthenticated, isLoading, redirectTo, router])

  return { isAuthenticated, isLoading }
}
