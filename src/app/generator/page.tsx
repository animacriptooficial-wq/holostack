"use client"

import { useState } from "react"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import {
  Monitor,
  Laptop,
  Apple,
  Smartphone,
  Terminal,
  Globe,
  Wand2,
  Loader2,
  CheckCircle2,
  FolderTree,
  FileCode,
  Copy,
  Download,
  Package,
  Cpu,
} from "lucide-react"

interface Platform {
  id: string
  name: string
  icon: typeof Monitor
  target: string
}

const platforms: Platform[] = [
  { id: "windows", name: "Windows", icon: Monitor, target: "windows-latest" },
  { id: "macos", name: "macOS", icon: Apple, target: "macos-latest" },
  { id: "ios", name: "iOS", icon: Smartphone, target: "iphone-16" },
  { id: "android", name: "Android", icon: Smartphone, target: "android-34" },
  { id: "linux", name: "Linux", icon: Terminal, target: "ubuntu-24.04" },
  { id: "web", name: "Web", icon: Globe, target: "browser-es2022" },
]

const bundledDeps = [
  { name: "react", version: "18.3.1" },
  { name: "typescript", version: "5.5.3" },
  { name: "tailwindcss", version: "3.4.4" },
  { name: "@tauri-apps/api", version: "2.0.0" },
  { name: "@capacitor/core", version: "6.1.0" },
  { name: "vite", version: "5.3.4" },
  { name: "zustand", version: "4.5.4" },
  { name: "lucide-react", version: "0.400.0" },
]

const GEN_STEPS = [
  "A estruturar o projeto...",
  "A instalar dependências pré-configuradas...",
  "A gerar código multiplataforma...",
  "A validar o build...",
]

function buildManifest(selectedPlatforms: string[]): string {
  const targets = platforms
    .filter((p) => selectedPlatforms.includes(p.id))
    .map((p) => p.target)
  return JSON.stringify(
    {
      name: "holostack-program",
      version: "1.0.0",
      private: true,
      scripts: {
        dev: "vite",
        build: "vite build && tauri build",
        "build:mobile": "cap sync && cap build",
        start: "vite preview",
      },
      targets,
      dependencies: Object.fromEntries(bundledDeps.map((d) => [d.name, `^${d.version}`])),
      devDependencies: {
        "@tauri-apps/cli": "^2.0.0",
        "@capacitor/cli": "^6.1.0",
      },
    },
    null,
    2
  )
}

function buildMainSource(selectedPlatforms: string[]): string {
  const targets = platforms
    .filter((p) => selectedPlatforms.includes(p.id))
    .map((p) => p.name)
    .join(", ")
  return `import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'

// Targets: ${targets || "web"}

interface AppState {
  ready: boolean
  platform: string
  init: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  ready: false,
  platform: 'auto',
  init: async () => {
    const platform = await invoke<string>('detect_platform')
    set({ ready: true, platform })
  },
}))

export function bootstrap() {
  const store = useAppStore.getState()
  store.init()
}
`
}

export default function GeneratorPage() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["windows"])
  const [prompt, setPrompt] = useState("")
  const [generating, setGenerating] = useState(false)
  const [genStep, setGenStep] = useState(0)
  const [generated, setGenerated] = useState(false)
  const [copied, setCopied] = useState(false)

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
    setGenerated(false)
  }

  const handleGenerate = async () => {
    if (selectedPlatforms.length === 0 || generating) return
    setGenerating(true)
    setGenerated(false)
    setGenStep(0)
    for (let i = 0; i < GEN_STEPS.length; i++) {
      setGenStep(i)
      await new Promise((resolve) => setTimeout(resolve, 1100))
    }
    setGenerating(false)
    setGenerated(true)
  }

  const handleCopyManifest = () => {
    navigator.clipboard.writeText(buildManifest(selectedPlatforms))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fileTree = [
    "holostack-program/",
    "├── src/",
    "│   ├── main.tsx",
    "│   ├── App.tsx",
    "│   ├── store.ts",
    "│   └── platform/",
    "│       ├── desktop.ts   (Tauri: Windows/macOS/Linux)",
    "│       └── mobile.ts    (Capacitor: iOS/Android)",
    "├── src-tauri/",
    "│   ├── tauri.conf.json",
    "│   └── Cargo.toml",
    "├── capacitor.config.ts",
    "├── package.json",
    "├── vite.config.ts",
    "└── tailwind.config.ts",
  ]

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <div className="flex-1 ml-64">
        <Header />

        <main className="pt-24 pb-8 px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <span className="badge-gold inline-block mb-4">Multiplataforma</span>
              <h1 className="text-3xl font-bold text-text mb-2">
                Gerador Universal de Programas
              </h1>
              <p className="text-textSecondary">
                Um único prompt gera um programa pronto para Windows, Mac, iOS, Android, Linux e Web — com dependências já instaladas.
              </p>
            </div>

            {/* Platform Selection */}
            <div className="card mb-6">
              <h3 className="text-sm font-semibold text-textSecondary uppercase tracking-wider mb-4">
                Plataformas de destino
              </h3>
              <div className="flex flex-wrap gap-3">
                {platforms.map((platform) => {
                  const Icon = platform.icon
                  const isActive = selectedPlatforms.includes(platform.id)
                  return (
                    <button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={`chip ${isActive ? "chip-active" : ""}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{platform.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Pre-bundled Dependencies */}
            <div className="card mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-5 h-5 text-accent" />
                <h3 className="text-sm font-semibold text-textSecondary uppercase tracking-wider">
                  Dependências pré-instaladas
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {bundledDeps.map((dep) => (
                  <span
                    key={dep.name}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface2 border border-border rounded-full text-xs text-text"
                  >
                    <CheckCircle2 className="w-3 h-3 text-success" />
                    <span className="font-mono">{dep.name}</span>
                    <span className="text-textSecondary">@{dep.version}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div className="glass-card p-1 mb-6">
              <div className="bg-surface rounded-xl p-5">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Descreva o programa que quer criar... ex: um gestor de tarefas com sincronização na nuvem"
                  className="w-full bg-transparent border-none text-lg text-text placeholder-textSecondary focus:outline-none resize-none h-28 scrollbar-thin"
                />
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-xs text-textSecondary">
                    {selectedPlatforms.length} plataforma{selectedPlatforms.length !== 1 ? "s" : ""} selecionada{selectedPlatforms.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={handleGenerate}
                    disabled={selectedPlatforms.length === 0 || generating}
                    className="btn-primary flex items-center gap-2 px-8 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Wand2 className="w-5 h-5" />
                    )}
                    <span>{generating ? "A gerar..." : "Gerar programa"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Generation Progress */}
            {generating && (
              <div className="card mb-6">
                <div className="space-y-3">
                  {GEN_STEPS.map((step, index) => (
                    <div key={step} className="flex items-center gap-3">
                      {genStep > index ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : genStep === index ? (
                        <Loader2 className="w-5 h-5 text-accent animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-border" />
                      )}
                      <span
                        className={`text-sm ${
                          genStep > index
                            ? "text-success"
                            : genStep === index
                            ? "text-text"
                            : "text-textSecondary"
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Result */}
            {generated && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <FolderTree className="w-5 h-5 text-accent" />
                    <h3 className="text-base font-semibold text-text">Estrutura do projeto</h3>
                  </div>
                  <pre className="bg-surface2 rounded-lg p-4 text-xs text-textSecondary font-mono overflow-auto scrollbar-thin border border-border">
                    {fileTree.join("\n")}
                  </pre>
                  <div className="flex items-center gap-2 mt-4 text-xs text-success">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ambiente pronto — dependências instaladas e configuradas</span>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <FileCode className="w-5 h-5 text-accent" />
                      <h3 className="text-base font-semibold text-text">package.json</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleCopyManifest}
                        className="p-2 rounded-lg hover:bg-surface2 text-textSecondary hover:text-accent transition-colors"
                        title="Copiar"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-surface2 text-textSecondary hover:text-accent transition-colors"
                        title="Baixar"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <pre className="bg-surface2 rounded-lg p-4 text-xs text-textSecondary font-mono overflow-auto max-h-72 scrollbar-thin border border-border">
                    {buildManifest(selectedPlatforms)}
                  </pre>
                </div>

                <div className="card lg:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <Cpu className="w-5 h-5 text-accent" />
                    <h3 className="text-base font-semibold text-text">src/store.ts — núcleo multiplataforma</h3>
                  </div>
                  <pre className="bg-surface2 rounded-lg p-4 text-xs text-textSecondary font-mono overflow-auto max-h-72 scrollbar-thin border border-border">
                    {buildMainSource(selectedPlatforms)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
