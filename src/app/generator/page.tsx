"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import {
  runPsoGeneration,
  PSO_SLICES,
  SliceStatus,
  PsoResult,
} from "@/lib/pso"
import { GenerationMode, GeneratedFile, resolveProvider } from "@/lib/engine"
import {
  Monitor,
  Apple,
  Smartphone,
  Terminal,
  Globe,
  Wand2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FolderTree,
  FileCode,
  Copy,
  Package,
  Send,
  Bot,
  User,
  Eye,
  Hammer,
  RotateCcw,
  GitBranch,
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

interface ChatMessage {
  role: "agent" | "user" | "system"
  text: string
  time: string
}

function now() {
  return new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })
}

/* Preview progressivo — o site/app "a nascer" em tempo real durante as fatias 1–2 */
function buildProgressPreview(
  files: GeneratedFile[],
  slices: SliceStatus[],
  mode: GenerationMode
): string {
  const done = slices.filter((s) => s.status === "verified").length
  const healing = slices.some((s) => s.status === "healing")
  const pct = Math.round((done / 4) * 100)
  const fileRows = files
    .slice(-14)
    .map(
      (f) =>
        `<div class="file"><span class="check">✓</span><span class="path">${f.path}</span><span class="size">${(
          f.content.length / 1024
        ).toFixed(1)}KB</span></div>`
    )
    .join("")
  const sliceRows = slices
    .map((s) => {
      const color =
        s.status === "verified" ? "#10b981" : s.status === "running" ? "#fbbf24" : s.status === "healing" ? "#f59e0b" : "#3f3f46"
      const label =
        s.status === "verified" ? "VERIFICADA" : s.status === "healing" ? "AUTOCORREÇÃO" : s.status === "running" ? "A GERAR" : "PENDENTE"
      return `<div class="slice"><span class="dot" style="background:${color}"></span><span class="sname">${s.id}. ${s.name}</span><span class="sstatus" style="color:${color}">${label}</span></div>`
    })
    .join("")
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#030305;color:#f4f4f5;font-family:'Segoe UI',system-ui,monospace;height:100vh;overflow:hidden;position:relative}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(circle at 20% 20%,rgba(251,191,36,.07),transparent 45%),radial-gradient(circle at 80% 80%,rgba(245,158,11,.06),transparent 45%);filter:blur(30px)}
.wrap{position:relative;padding:28px;height:100%;display:flex;flex-direction:column;gap:18px}
h1{font-size:15px;letter-spacing:2px;color:#fbbf24}
.sub{font-size:11px;color:#a1a1aa}
.bar{height:8px;background:#161617;border-radius:4px;overflow:hidden;border:1px solid rgba(251,191,36,.2)}
.fill{height:100%;width:${pct}%;background:linear-gradient(90deg,#f59e0b,#fbbf24);transition:width .8s ease;box-shadow:0 0 14px rgba(251,191,36,.5)}
.pct{font-size:24px;font-weight:700;color:#fbbf24}
.slices{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.slice{display:flex;align-items:center;gap:8px;background:#000;border:1px solid rgba(251,191,36,.15);border-radius:8px;padding:8px 10px}
.dot{width:8px;height:8px;border-radius:50%;animation:pulse 1.4s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.sname{flex:1;font-size:10px;color:#e4e4e7}
.sstatus{font-size:9px;font-weight:700;letter-spacing:.5px}
.files{flex:1;overflow:hidden;background:#000;border:1px solid rgba(251,191,36,.15);border-radius:10px;padding:12px}
.ftitle{font-size:10px;color:#a1a1aa;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase}
.file{display:flex;gap:8px;padding:3px 0;font-size:11px;animation:fadein .5s ease}
@keyframes fadein{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.check{color:#10b981}.path{flex:1;color:#d4d4d8}.size{color:#71717a;font-size:10px}
.mode{position:absolute;top:26px;right:28px;font-size:9px;padding:4px 10px;border:1px solid rgba(251,191,36,.3);border-radius:12px;color:#fbbf24;letter-spacing:1px}
${healing ? ".heal{color:#f59e0b;font-size:10px;animation:pulse 1s infinite}" : ""}
</style></head><body><div class="wrap">
<div class="mode">${mode === "site" ? "SITE / WEB APP" : "PROGRAMA MULTIPLATAFORMA"}</div>
<div><h1>HOLOSTACK PSO ENGINE</h1><div class="sub">Construção atómica em tempo real — fatia a fatia verificada</div></div>
<div class="pct">${pct}%</div>
<div class="bar"><div class="fill"></div></div>
${healing ? '<div class="heal">⛨ Loop de autocorreção ativo — a reescrever e a retestar código</div>' : ""}
<div class="slices">${sliceRows}</div>
<div class="files"><div class="ftitle">Ficheiros verificados (${files.length})</div>${fileRows || '<div class="sub">A aguardar primeira fatia...</div>'}</div>
</div></body></html>`
}

function GeneratorInner() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<GenerationMode>(
    searchParams.get("type") === "program" ? "program" : "site"
  )
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["windows", "web"])
  const [prompt, setPrompt] = useState(searchParams.get("prompt") || "")
  const [followUp, setFollowUp] = useState("")
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<PsoResult | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [buildLog, setBuildLog] = useState<string[]>([])
  const [files, setFiles] = useState<GeneratedFile[]>([])
  const [previewHtml, setPreviewHtml] = useState("")
  const [sliceStatus, setSliceStatus] = useState<SliceStatus[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"preview" | "files" | "build">("preview")
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const autoStarted = useRef(false)
  const projectNameRef = useRef("holostack-app")
  const aiPreviewRef = useRef(false)
  const slicesRef = useRef<SliceStatus[]>([])
  const filesRef = useRef<GeneratedFile[]>([])

  const updateSlices = (fn: (prev: SliceStatus[]) => SliceStatus[]) =>
    setSliceStatus((prev) => {
      const next = fn(prev)
      slicesRef.current = next
      return next
    })

  useEffect(() => setMounted(true), [])

  const pushMsg = (role: ChatMessage["role"], text: string) =>
    setMessages((prev) => [...prev, { role, text, time: now() }])

  const pushLog = (line: string) => setBuildLog((prev) => [...prev, `[${now()}] ${line}`])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const syncSlice = async (projectName: string, sliceId: number, allFiles: GeneratedFile[]): Promise<string[]> => {
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName,
          sliceId,
          files: allFiles,
        }),
      })
      const data = await res.json()
      return Array.isArray(data.log) ? data.log : ["sync: sem resposta"]
    } catch (err) {
      return [
        `✗ Sync indisponível: ${err instanceof Error ? err.message : "erro de rede"}`,
        "· (em produção serverless a escrita de ficheiros/git não está disponível)",
      ]
    }
  }

  const runGeneration = async (userPrompt: string, currentMode: GenerationMode, plats: string[]) => {
    if (busy) return
    setBusy(true)
    setError(null)
    setBuildLog([])
    setFiles([])
    setPreviewHtml("")
    setResult(null)
    aiPreviewRef.current = false
    updateSlices(() =>
      PSO_SLICES.map((s) => ({
        id: s.id,
        name: s.name,
        status: "pending",
        attempts: 0,
        errors: [],
        fileCount: 0,
      }))
    )
    pushMsg("user", userPrompt)

    try {
      const res = await runPsoGeneration({
        prompt: userPrompt,
        mode: currentMode,
        platforms: plats,
        onEvent: (e) => {
          pushLog(e.text)
          if (e.type === "sync") {
            pushMsg("system", `⎇ ${e.text}`)
            return
          }
          if (e.type === "preview") {
            aiPreviewRef.current = true
            setPreviewHtml(e.previewHtml || "")
            return
          }
          if (e.type === "files") {
            setFiles(e.files || [])
            filesRef.current = e.files || []
            setActiveFile(e.files?.[0]?.path || null)
            if (!aiPreviewRef.current) {
              setPreviewHtml(buildProgressPreview(e.files || [], slicesRef.current, currentMode))
            }
            return
          }
          pushMsg(e.type === "info" ? "system" : "agent", e.text)
          if (e.sliceId) {
            updateSlices((prev) =>
              prev.map((s) => {
                if (s.id !== e.sliceId) return s
                if (e.type === "slice-start") return { ...s, status: "running" }
                if (e.type === "slice-retry") return { ...s, status: "healing", attempts: s.attempts + 1 }
                if (e.type === "slice-verified") return { ...s, status: "verified" }
                if (e.type === "slice-warning") return { ...s, status: "warning" }
                return s
              })
            )
            if (!aiPreviewRef.current) {
              setPreviewHtml(buildProgressPreview(filesRef.current, slicesRef.current, currentMode))
            }
          }
        },
        onSliceSync: (sliceId, allFiles) => syncSlice(projectNameRef.current, sliceId, allFiles),
      })
      setResult(res)
      projectNameRef.current = res.projectName
      setActiveTab("preview")
      pushMsg("agent", res.plan)
      pushMsg(
        "system",
        `Projeto "${res.projectName}" concluído · ${res.provider} · ${res.files.length} ficheiros · PSO 4/4`
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido"
      if (msg.startsWith("NO_KEY:")) {
        setError(msg.replace("NO_KEY:", ""))
        pushMsg("agent", "Não encontrei nenhuma chave de API ativa. Configure o motor em Settings para eu poder gerar.")
      } else {
        setError(msg)
        pushMsg("agent", `Falha na geração: ${msg}`)
      }
      pushLog(`✗ ${msg}`)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    const p = searchParams.get("prompt")
    if (p && !autoStarted.current) {
      autoStarted.current = true
      runGeneration(p, mode, selectedPlatforms)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const togglePlatform = (id: string) =>
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )

  const handleGenerate = () => {
    if (!prompt.trim()) return
    runGeneration(prompt.trim(), mode, selectedPlatforms)
  }

  const handleFollowUp = () => {
    if (!followUp.trim()) return
    const base = result ? `${prompt} — Refinamento: ${followUp.trim()}` : followUp.trim()
    setFollowUp("")
    runGeneration(base, mode, selectedPlatforms)
  }

  const copyFile = (content: string) => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inStudio = result !== null || busy || messages.length > 0
  const selectedFile = files.find((f) => f.path === activeFile)
  const sliceIcon = (s: SliceStatus) => {
    if (s.status === "verified") return <CheckCircle2 className="w-4 h-4 text-success" />
    if (s.status === "healing") return <Loader2 className="w-4 h-4 text-warning animate-spin" />
    if (s.status === "running") return <Loader2 className="w-4 h-4 text-accent animate-spin" />
    if (s.status === "warning") return <AlertCircle className="w-4 h-4 text-warning" />
    if (s.status === "failed") return <AlertCircle className="w-4 h-4 text-error" />
    return <div className="w-4 h-4 rounded-full border border-border" />
  }

  /* ============ SETUP SCREEN ============ */
  if (!inStudio) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header />
          <main className="pt-24 pb-8 px-8">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <span className="badge-gold inline-block mb-4">HoloStack PSO Engine</span>
                <h1 className="text-3xl font-bold text-text mb-2">Gerador Universal</h1>
                <p className="text-textSecondary">
                  Fatiamento PSO em 4 micro-tarefas · autocorreção em loop fechado · sync GitHub automático
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setMode("site")}
                  className={`card !p-4 text-left flex items-center gap-3 ${mode === "site" ? "!border-primary" : ""}`}
                >
                  <Globe className={`w-6 h-6 ${mode === "site" ? "text-accent" : "text-textSecondary"}`} />
                  <div>
                    <h4 className="text-sm font-semibold text-text">Site / Web App</h4>
                    <p className="text-xs text-textSecondary">Páginas, landing pages, apps web</p>
                  </div>
                </button>
                <button
                  onClick={() => setMode("program")}
                  className={`card !p-4 text-left flex items-center gap-3 ${mode === "program" ? "!border-primary" : ""}`}
                >
                  <Monitor className={`w-6 h-6 ${mode === "program" ? "text-accent" : "text-textSecondary"}`} />
                  <div>
                    <h4 className="text-sm font-semibold text-text">Programa / App</h4>
                    <p className="text-xs text-textSecondary">Windows, Mac, iOS, Android, Linux</p>
                  </div>
                </button>
              </div>

              {mode === "program" && (
                <>
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
                </>
              )}

              <div className="card mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <GitBranch className="w-5 h-5 text-accent" />
                  <h3 className="text-sm font-semibold text-textSecondary uppercase tracking-wider">
                    Pipeline PSO — 4 fatias atómicas
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {PSO_SLICES.map((s) => (
                    <div key={s.id} className="bg-surface2 border border-border rounded-lg p-3">
                      <span className="text-[10px] font-bold text-accent">FATIA {s.id}</span>
                      <p className="text-xs font-medium text-text mt-1">{s.name}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-textSecondary">
                    Motor:{" "}
                    {mounted && resolveProvider()
                      ? `${resolveProvider()!.provider.name} (${resolveProvider()!.provider.model})`
                      : "nenhuma chave configurada"}
                  </p>
                  {mounted && !resolveProvider() && (
                    <Link href="/settings" className="btn-secondary text-xs !py-1.5">
                      Configurar chave
                    </Link>
                  )}
                </div>
              </div>

              <div className="glass-card p-1">
                <div className="bg-surface rounded-xl p-5">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      mode === "site"
                        ? "Descreva o site ou web app... ex: uma loja de carros desportivos com catálogo e checkout"
                        : "Descreva o programa... ex: um gestor de tarefas com sincronização na nuvem"
                    }
                    className="w-full bg-transparent border-none text-lg text-text placeholder-textSecondary focus:outline-none resize-none h-28 scrollbar-thin"
                  />
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-xs text-textSecondary">
                      {mode === "program"
                        ? `${selectedPlatforms.length} plataforma${selectedPlatforms.length !== 1 ? "s" : ""}`
                        : "Projeto web completo"}
                    </span>
                    <button
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || (mode === "program" && selectedPlatforms.length === 0)}
                      className="btn-primary flex items-center gap-2 px-8 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Wand2 className="w-5 h-5" />
                      <span>Gerar com PSO</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  /* ============ SPLIT-SCREEN STUDIO ============ */
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-20 h-screen flex flex-col">
          {/* Slice progress bar */}
          <div className="px-5 py-3 border-b border-border bg-surface/60 flex items-center gap-3 shrink-0">
            <span className="text-xs font-semibold text-textSecondary uppercase tracking-wider">PSO</span>
            {sliceStatus.map((s) => (
              <div
                key={s.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                  s.status === "verified"
                    ? "border-success/40 bg-success/10"
                    : s.status === "running" || s.status === "healing"
                    ? "border-primary/50 bg-surface2"
                    : s.status === "warning"
                    ? "border-warning/40 bg-warning/10"
                    : "border-border bg-surface2/50"
                }`}
              >
                {sliceIcon(s)}
                <span className={s.status === "pending" ? "text-textSecondary" : "text-text"}>
                  {s.id}. {s.name}
                </span>
              </div>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
            {/* LEFT — Agent Chat */}
            <div className="flex flex-col border-r border-border bg-surface/50">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-accent" />
                  <span className="text-sm font-semibold text-text">Agente HoloStack</span>
                  {busy && <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />}
                </div>
                <button
                  onClick={() => {
                    setResult(null)
                    setMessages([])
                    setBuildLog([])
                    setFiles([])
                    setPreviewHtml("")
                    setSliceStatus([])
                    setError(null)
                    setPrompt("")
                  }}
                  className="flex items-center gap-1.5 text-xs text-textSecondary hover:text-accent transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Novo projeto
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        msg.role === "agent" ? "bg-accent" : msg.role === "user" ? "bg-surface3" : "bg-surface2"
                      }`}
                    >
                      {msg.role === "agent" ? (
                        <Bot className="w-4 h-4 text-black" />
                      ) : msg.role === "user" ? (
                        <User className="w-4 h-4 text-text" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "agent"
                          ? "bg-surface2 border border-border text-text"
                          : msg.role === "user"
                          ? "bg-primary/10 border border-primary/30 text-text"
                          : "bg-transparent text-textSecondary text-xs italic"
                      }`}
                    >
                      {msg.text}
                      <span className="block text-[10px] text-textSecondary mt-1">{msg.time}</span>
                    </div>
                  </div>
                ))}
                {busy && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
                      <Loader2 className="w-4 h-4 text-black animate-spin" />
                    </div>
                    <div className="bg-surface2 border border-border rounded-xl px-4 py-2.5 text-sm text-textSecondary">
                      A processar fatia...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleFollowUp()}
                    placeholder={result ? "Peça um ajuste ao agente..." : "Descreva o projeto..."}
                    disabled={busy}
                    className="flex-1 bg-surface2 border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder-textSecondary focus:outline-none focus:border-primary disabled:opacity-50"
                  />
                  <button
                    onClick={handleFollowUp}
                    disabled={busy || !followUp.trim()}
                    className="btn-primary !px-4 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {error && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-error">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT — Live Workspace */}
            <div className="flex flex-col bg-surface/30">
              <div className="px-5 py-3 border-b border-border flex items-center gap-1">
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "preview" ? "bg-primary text-black" : "text-textSecondary hover:text-accent"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview ao vivo
                </button>
                <button
                  onClick={() => setActiveTab("files")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "files" ? "bg-primary text-black" : "text-textSecondary hover:text-accent"
                  }`}
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  Ficheiros {files.length > 0 ? `(${files.length})` : ""}
                </button>
                <button
                  onClick={() => setActiveTab("build")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "build" ? "bg-primary text-black" : "text-textSecondary hover:text-accent"
                  }`}
                >
                  <Hammer className="w-3.5 h-3.5" />
                  Build & Sync
                </button>
              </div>

              <div className="flex-1 overflow-hidden p-4">
                {activeTab === "preview" && (
                  <div className="h-full flex flex-col rounded-xl overflow-hidden border border-border">
                    <div className="bg-surface2 px-4 py-2 flex items-center gap-2 border-b border-border shrink-0">
                      <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-error/80" />
                        <span className="w-3 h-3 rounded-full bg-warning/80" />
                        <span className="w-3 h-3 rounded-full bg-success/80" />
                      </div>
                      <span className="text-xs text-textSecondary font-mono ml-2 truncate">
                        {previewHtml
                          ? result?.projectName
                            ? `${result.projectName} — aplicação em execução`
                            : "construção em tempo real — fatia a fatia"
                          : "a aguardar primeira fatia"}
                      </span>
                    </div>
                    {previewHtml ? (
                      <iframe
                        srcDoc={previewHtml}
                        title="Preview ao vivo"
                        sandbox="allow-scripts allow-same-origin"
                        className="flex-1 w-full bg-white"
                      />
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center bg-surface2/50 gap-3">
                        {busy ? (
                          <>
                            <Loader2 className="w-8 h-8 text-accent animate-spin" />
                            <p className="text-sm text-textSecondary">
                              A construir... o preview ativa-se na fatia 3 (Interface)
                            </p>
                          </>
                        ) : (
                          <>
                            <Monitor className="w-8 h-8 text-textSecondary" />
                            <p className="text-sm text-textSecondary">O preview aparece aqui após a geração</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "files" && (
                  <div className="h-full grid grid-cols-5 gap-3">
                    <div className="col-span-2 bg-surface2 rounded-xl border border-border p-3 overflow-y-auto scrollbar-thin">
                      <p className="text-xs font-semibold text-textSecondary uppercase mb-2 px-1">Árvore</p>
                      {files.length > 0 ? (
                        files.map((f) => (
                          <button
                            key={f.path}
                            onClick={() => setActiveFile(f.path)}
                            className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-xs font-mono transition-colors ${
                              activeFile === f.path ? "bg-surface3 text-accent" : "text-textSecondary hover:text-accent"
                            }`}
                          >
                            <FileCode className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{f.path}</span>
                          </button>
                        ))
                      ) : (
                        <p className="text-xs text-textSecondary px-1">Sem ficheiros ainda</p>
                      )}
                    </div>
                    <div className="col-span-3 bg-surface2 rounded-xl border border-border flex flex-col overflow-hidden">
                      <div className="px-3 py-2 border-b border-border flex items-center justify-between shrink-0">
                        <span className="text-xs font-mono text-textSecondary truncate">
                          {selectedFile?.path || "selecione um ficheiro"}
                        </span>
                        {selectedFile && (
                          <button
                            onClick={() => copyFile(selectedFile.content)}
                            className="text-textSecondary hover:text-accent transition-colors"
                          >
                            {copied ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                      <pre className="flex-1 overflow-auto p-3 text-[11px] font-mono text-text leading-relaxed scrollbar-thin">
                        {selectedFile?.content || ""}
                      </pre>
                    </div>
                  </div>
                )}

                {activeTab === "build" && (
                  <div className="h-full bg-surface2 rounded-xl border border-border p-4 overflow-y-auto scrollbar-thin font-mono">
                    {buildLog.length > 0 ? (
                      buildLog.map((line, i) => (
                        <p key={i} className="text-xs text-textSecondary leading-relaxed">
                          {line}
                        </p>
                      ))
                    ) : (
                      <p className="text-xs text-textSecondary">O log de build e sync Git aparece aqui</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function GeneratorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      }
    >
      <GeneratorInner />
    </Suspense>
  )
}
