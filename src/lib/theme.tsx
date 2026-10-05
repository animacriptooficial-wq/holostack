"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react"

export type ThemeId =
  | "carbon"
  | "cyber"
  | "obsidian"
  | "royal"
  | "crimson"
  | "arctic"
  | "solar"
  | "matrix"
  | "sunset"
  | "titanium"

export interface ThemeOption {
  id: ThemeId
  name: string
  description: string
  swatch: { bg: string; edge: string; accent: string }
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "carbon",
    name: "Midnight Carbon & Gold",
    description: "Preto carvão em gradiente radial com acentos dourados refinados",
    swatch: { bg: "#030305", edge: "#0d0d12", accent: "#fbbf24" },
  },
  {
    id: "cyber",
    name: "Cyberpunk Neon Cyan",
    description: "Azul espacial com grelha e brilho ciano elétrico futurista",
    swatch: { bg: "#020617", edge: "#0a1128", accent: "#22d3ee" },
  },
  {
    id: "obsidian",
    name: "Obsidian & Emerald",
    description: "Preto obsidiana com brilho ambiente em verde esmeralda vibrante",
    swatch: { bg: "#020504", edge: "#0a120c", accent: "#34d399" },
  },
  {
    id: "royal",
    name: "Royal Purple & Platinum",
    description: "Roxo imperial profundo com detalhes em prata e platina",
    swatch: { bg: "#0a0612", edge: "#170c28", accent: "#c4b5fd" },
  },
  {
    id: "crimson",
    name: "Crimson Matrix & Dark",
    description: "Preto profundo com malha de pontos em vermelho crimson",
    swatch: { bg: "#0a0205", edge: "#18030b", accent: "#fb7185" },
  },
  {
    id: "arctic",
    name: "Arctic Frost & Ice Blue",
    description: "Azul ártico tecnológico com grelha glacial subtil",
    swatch: { bg: "#04101e", edge: "#0a2038", accent: "#7dd3fc" },
  },
  {
    id: "solar",
    name: "Solar Amber & Charcoal",
    description: "Cinza carvão com névoa quente em laranja âmbar solar",
    swatch: { bg: "#0c0a08", edge: "#1a1510", accent: "#fb923c" },
  },
  {
    id: "matrix",
    name: "Matrix Digital Green",
    description: "Preto terminal com grelha verde hacker clássica",
    swatch: { bg: "#010401", edge: "#03140a", accent: "#00ff41" },
  },
  {
    id: "sunset",
    name: "Sunset Orange & Deep Purple",
    description: "Roxo profundo com horizonte em laranja pôr do sol",
    swatch: { bg: "#12061e", edge: "#200a32", accent: "#fb923c" },
  },
  {
    id: "titanium",
    name: "Minimalist Titanium & Silver",
    description: "Cinza titânio industrial com acentos prata metálico",
    swatch: { bg: "#101013", edge: "#1c1d21", accent: "#e2e8f0" },
  },
]

const THEME_KEY = "holostack_theme"

interface ThemeContextValue {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("carbon")

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY) as ThemeId | null
      if (stored && THEME_OPTIONS.some((t) => t.id === stored)) {
        setThemeState(stored)
      }
    } catch {
      localStorage.removeItem(THEME_KEY)
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  const setTheme = (next: ThemeId) => {
    setThemeState(next)
    localStorage.setItem(THEME_KEY, next)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error("useTheme deve ser usado dentro de <ThemeProvider>")
  }
  return ctx
}
