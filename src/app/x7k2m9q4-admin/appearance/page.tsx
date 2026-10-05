"use client"

import { useTheme, THEME_OPTIONS, ThemeOption } from "@/lib/theme"
import { CheckCircle2, Palette } from "lucide-react"

function ThemePreview({ option }: { option: ThemeOption }) {
  const { bg, edge, accent } = option.swatch
  return (
    <div
      className="w-full h-24 rounded-lg border border-border relative overflow-hidden"
      style={{ background: `radial-gradient(ellipse at 50% 40%, ${bg} 0%, ${edge} 78%)` }}
    >
      <div
        className="absolute top-2.5 left-2.5 right-2.5 h-2 rounded-full"
        style={{ backgroundColor: accent, opacity: 0.9 }}
      />
      <div className="absolute top-6 left-2.5 right-2.5 grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-6 rounded"
            style={{
              backgroundColor: edge,
              border: `1px solid ${accent}55`,
            }}
          />
        ))}
      </div>
      <div
        className="absolute bottom-2 left-2.5 h-1.5 w-1/3 rounded-full"
        style={{ backgroundColor: accent, opacity: 0.6 }}
      />
    </div>
  )
}

export default function AdminAppearancePage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Aparência do Site</h1>
        <p className="text-sm text-textSecondary">
          10 temas de última geração — alterne o visual de todo o ecossistema em tempo real
        </p>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <Palette className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text">Seletor de Temas</h3>
            <p className="text-xs text-textSecondary">
              A escolha é persistida em localStorage e aplica-se globalmente
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {THEME_OPTIONS.map((option, index) => {
            const isActive = theme === option.id
            return (
              <button
                key={option.id}
                onClick={() => setTheme(option.id)}
                className={`text-left rounded-xl border p-3.5 transition-all duration-300 ${
                  isActive
                    ? "border-primary bg-surface2"
                    : "border-border bg-surface2 hover:border-primary"
                }`}
                style={isActive ? { boxShadow: "0 0 24px var(--glow)" } : undefined}
              >
                <ThemePreview option={option} />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: option.swatch.accent }}
                    />
                    <span
                      className={`text-xs font-semibold truncate ${
                        isActive ? "text-accent" : "text-text"
                      }`}
                    >
                      {option.name}
                    </span>
                  </div>
                  {isActive && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                </div>
                <p className="text-[11px] text-textSecondary mt-1.5 leading-snug">
                  {String(index + 1).padStart(2, "0")} — {option.description}
                </p>
              </button>
            )
          })}
        </div>

        <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
          <span className="text-xs text-textSecondary">
            Tema ativo:{" "}
            <span className="text-accent font-medium">
              {THEME_OPTIONS.find((t) => t.id === theme)?.name}
            </span>
          </span>
          <span className="text-xs text-textSecondary font-mono">
            persistido em localStorage · holostack_theme
          </span>
        </div>
      </div>
    </div>
  )
}
