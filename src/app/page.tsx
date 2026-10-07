"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/Header"
import Sidebar from "@/components/layout/Sidebar"
import PSOStatus from "@/components/dashboard/PSOStatus"
import PsoEngine from "@/components/dashboard/PsoEngine"
import MetricsGrid from "@/components/dashboard/MetricsGrid"
import APIMesh from "@/components/dashboard/APIMesh"
import { PLANS } from "@/lib/plans"
import { 
  Globe, 
  Smartphone, 
  Monitor, 
  Video, 
  Gamepad2,
  Bot,
  Plus,
  Zap,
  Copy,
  LayoutGrid,
  AppWindow,
  Play,
  ChevronRight,
  Search,
  Clock,
  Star,
  Download,
  Share2,
  Trash2,
  Edit3,
  Palette,
  Rocket,
  Users,
  Shield,
  Database,
  Check,
  Wand2,
  Server
} from "lucide-react"

export default function Dashboard() {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState("all")
  const [selectedModel, setSelectedModel] = useState("auto")
  const [searchQuery, setSearchQuery] = useState("")

  const categories = [
    { id: "webapp", name: "Web App", icon: Globe },
    { id: "mobile", name: "Mobile App", icon: Smartphone },
    { id: "site", name: "Site", icon: Monitor },
    { id: "video", name: "Video", icon: Video },
    { id: "game", name: "Game", icon: Gamepad2 },
    { id: "bot", name: "Bot", icon: Bot },
  ]

  const suggestions = [
    { id: "wingman", name: "Wingman (Beta)", description: "AI assistant for coding" },
    { id: "alter-ego", name: "Meu Eu Alternativo", description: "Create your digital twin" },
    { id: "account-gen", name: "Gerador de Contas", description: "Generate test accounts" },
    { id: "word-day", name: "Palavra do Dia", description: "Daily vocabulary app" },
  ]

  const filters = [
    { id: "all", name: "Todos", count: 24, icon: LayoutGrid },
    { id: "apps", name: "Aplicações", count: 12, icon: AppWindow },
    { id: "published", name: "Publicadas", count: 8, icon: Play },
    { id: "videos", name: "Vídeos", count: 4, icon: Video },
  ]

  const aiModels = [
    { id: "claude-code", name: "Claude Code", status: "active", icon: "⚡" },
    { id: "chatgpt", name: "ChatGPT", status: "active", icon: "💬" },
    { id: "openai-all", name: "OpenAI All Models", status: "active", icon: "🤖" },
    { id: "auto", name: "Auto", status: "active", icon: "✨" },
    { id: "free", name: "Free (OpenRouter)", status: "active", icon: "🆓" },
  ]

  const recentProjects = [
    { 
      id: 1, 
      name: "CRM System", 
      type: "Web App", 
      status: "active", 
      updated: "2h ago",
      description: "Customer relationship management system",
      stars: 24
    },
    { 
      id: 2, 
      name: "Mobile Dashboard", 
      type: "Mobile App", 
      status: "active", 
      updated: "5h ago",
      description: "Analytics dashboard for mobile",
      stars: 18
    },
    { 
      id: 3, 
      name: "Portfolio Site", 
      type: "Website", 
      status: "completed", 
      updated: "1d ago",
      description: "Personal portfolio website",
      stars: 32
    },
    { 
      id: 4, 
      name: "Video Player", 
      type: "Video Module", 
      status: "active", 
      updated: "2d ago",
      description: "Custom video player component",
      stars: 15
    },
  ]

  const features = [
    {
      icon: Wand2,
      name: "Geração com IA",
      description: "Descreva sua ideia em texto e receba código, design e conteúdo prontos para uso."
    },
    {
      icon: Palette,
      name: "Editor Visual",
      description: "Ajuste layout, cores e componentes em tempo real sem tocar em uma linha de código."
    },
    {
      icon: Rocket,
      name: "Deploy Instantâneo",
      description: "Publique seu projeto com um clique em infraestrutura global de alta performance."
    },
    {
      icon: Database,
      name: "Banco de Dados Integrado",
      description: "Tabelas, autenticação e APIs configuradas automaticamente para o seu produto."
    },
    {
      icon: Users,
      name: "Colaboração em Equipe",
      description: "Convide seu time, edite em conjunto e acompanhe mudanças em tempo real."
    },
    {
      icon: Shield,
      name: "Domínios e SSL",
      description: "Conecte domínios próprios com HTTPS automático e certificados gerenciados."
    },
  ]

  const steps = [
    {
      number: "01",
      title: "Descreva sua ideia",
      description: "Escreva em linguagem natural o que você quer construir, sem jargão técnico."
    },
    {
      number: "02",
      title: "A IA gera o produto",
      description: "Os modelos criam interface, lógica, banco de dados e integrações completos."
    },
    {
      number: "03",
      title: "Revise e ajuste",
      description: "Edite visualmente cada detalhe ou peça novas mudanças por prompt."
    },
    {
      number: "04",
      title: "Publique em 1 clique",
      description: "Deploy instantâneo com domínio, SSL e monitoramento já incluídos."
    },
  ]

  const services = [
    { name: "API Principal", uptime: "99.98%", status: "Operacional", ok: true },
    { name: "Gerador de IA", uptime: "99.90%", status: "Operacional", ok: true },
    { name: "Banco de Dados", uptime: "99.95%", status: "Operacional", ok: true },
    { name: "CDN Global", uptime: "100%", status: "Operacional", ok: true },
    { name: "Autenticação", uptime: "99.92%", status: "Operacional", ok: true },
    { name: "Fila de Deploys", uptime: "98.70%", status: "Degradado", ok: false },
    { name: "Armazenamento", uptime: "99.99%", status: "Operacional", ok: true },
    { name: "Webhooks", uptime: "99.85%", status: "Operacional", ok: true },
  ]

  const plans = PLANS.map((p) => ({
    name: p.name,
    price: p.priceUSD === null ? "Sob consulta" : `$${p.priceUSD}`,
    period: p.priceUSD === null ? "" : "/mês",
    features: p.features,
    cta: p.cta,
    highlight: p.highlight,
  }))

  const handleCreate = () => {
    if (prompt.trim()) {
      router.push(`/generator?type=site&prompt=${encodeURIComponent(prompt.trim())}`)
    }
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <Header />
        
        {/* Ambient glow effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        </div>

        <main className="relative z-10 pt-20 pb-8 px-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-text mb-2">Dashboard</h1>
              <p className="text-textSecondary">Create and manage your AI-powered projects</p>
            </div>

            {/* Real-time Metrics Grid */}
            <div className="mb-8">
              <MetricsGrid />
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <Search className="w-5 h-5 text-textSecondary absolute left-4 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects, models, or templates..."
                  className="w-full bg-surface border border-border rounded-lg pl-12 pr-4 py-3 text-text placeholder-textSecondary focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-12 gap-6">
              {/* Left Column - AI Models */}
              <div className="col-span-3">
                <div className="card">
                  <h3 className="text-lg font-semibold text-text mb-4">AI Models</h3>
                  <div className="space-y-2">
                    {aiModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => setSelectedModel(model.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                          selectedModel === model.id 
                            ? "bg-surface2 text-text" 
                            : "text-textSecondary hover:text-accent hover:bg-surface2"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{model.icon}</span>
                          <span className="text-sm">{model.name}</span>
                        </div>
                        {model.status === "active" && (
                          <div className="w-2 h-2 bg-success rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Center Column - Generator */}
              <div className="col-span-6">
                <div className="card">
                  {/* Badge */}
                  <div className="flex justify-center mb-6">
                    <span className="badge-gold flex items-center gap-2">
                      <Zap className="w-3 h-3" />
                      Animacripto's Pro...
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-3xl font-bold text-center mb-6">
                    O que você vai{" "}
                    <span className="text-accent text-glow">construir</span>
                    {" "}hoje?
                  </h2>

                  {/* Category Chips */}
                  <div className="flex flex-wrap justify-center gap-3 mb-8">
                    {categories.map((category) => {
                      const Icon = category.icon
                      const isActive = selectedCategory === category.id
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(isActive ? null : category.id)}
                          className={`chip ${isActive ? "chip-active" : ""}`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{category.name}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Prompt Box */}
                  <div className="glass-card p-1 mb-6">
                    <div className="bg-surface rounded-xl p-4">
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Construa para mim um sistema CRM com..."
                        className="w-full bg-transparent border-none text-lg text-text placeholder-textSecondary focus:outline-none resize-none h-32 scrollbar-thin"
                      />
                      
                      {/* Controls */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-3">
                          <button className="flex items-center gap-2 px-4 py-2 bg-surface2 hover:bg-surface3 rounded-lg text-sm text-text transition-colors border border-border">
                            <Plus className="w-4 h-4" />
                            <span>Auto</span>
                          </button>
                          <button className="flex items-center gap-2 px-4 py-2 bg-surface2 hover:bg-surface3 rounded-lg text-sm text-text transition-colors border border-border">
                            <Copy className="w-4 h-4" />
                            <span>Mirror</span>
                          </button>
                        </div>

                        <button
                          onClick={handleCreate}
                          disabled={!prompt.trim()}
                          className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-5 h-5" />
                          <span>Criar</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Suggestion Tags */}
                  <div className="flex flex-wrap justify-center gap-3 mb-8">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => setPrompt(`Create a ${suggestion.name.toLowerCase()} app`)}
                        className="badge-outline hover:bg-surface2 hover:border-primary transition-all duration-200 flex items-center gap-1 group"
                      >
                        <span>{suggestion.name}</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Quick Stats + PSO Status */}
              <div className="col-span-3 space-y-6">
                <PSOStatus projectName="HoloStack" />
                <PsoEngine />
                <div className="card">
                  <h3 className="text-lg font-semibold text-text mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-textSecondary mb-1">Total Projects</p>
                      <p className="text-2xl font-bold text-text">24</p>
                    </div>
                    <div>
                      <p className="text-sm text-textSecondary mb-1">Active Now</p>
                      <p className="text-2xl font-bold text-text">12</p>
                    </div>
                    <div>
                      <p className="text-sm text-textSecondary mb-1">Generations</p>
                      <p className="text-2xl font-bold text-text">8,456</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Universal Program Generator CTA */}
            <div className="mt-10">
              <Link href="/generator?type=program" className="block group">
                <div className="relative overflow-hidden rounded-2xl border border-primary bg-gradient-to-r from-surface2 via-surface to-surface2 p-10 text-center transition-all duration-300 hover:shadow-glow-gold-lg hover:border-accent">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center shadow-glow-gold group-hover:scale-110 transition-transform duration-300">
                      <Wand2 className="w-8 h-8 text-black" />
                    </div>
                    <span className="text-2xl md:text-3xl font-bold text-text group-hover:text-accent transition-colors duration-300">
                      Gerador de programas para o Windows, Mac, iOS, etc.
                    </span>
                    <span className="text-sm text-textSecondary">
                      Ambiente pré-configurado com dependências instaladas — pronto para executar de imediato
                    </span>
                    <span className="flex items-center gap-2 mt-2 px-6 py-3 bg-primary group-hover:bg-primaryDark rounded-xl text-black font-bold text-base transition-colors">
                      <Wand2 className="w-5 h-5" />
                      Abrir gerador universal
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* API Mesh — Latency & Fitness */}
            <div className="mt-8">
              <APIMesh />
            </div>

            {/* Filter Tabs */}
            <div className="mt-12">
              <div className="flex items-center gap-1 border-b border-border pb-4 mb-6">
                {filters.map((filter) => {
                  const Icon = filter.icon
                  const isActive = activeFilter === filter.id
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isActive 
                          ? "bg-surface2 text-text border border-border" 
                          : "text-textSecondary hover:text-accent hover:bg-surface2"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{filter.name}</span>
                      <span className="text-xs bg-surface3 px-2 py-0.5 rounded">{filter.count}</span>
                    </button>
                  )
                })}
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="card hover:border-primary transition-all duration-300 group cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-surface2 rounded-lg flex items-center justify-center border border-border group-hover:border-primary transition-colors">
                        <Globe className="w-6 h-6 text-accent" />
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-accent" />
                        <span className="text-sm text-textSecondary">{project.stars}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-text mb-1">{project.name}</h3>
                    <p className="text-sm text-textSecondary mb-3">{project.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="badge-outline">{project.type}</span>
                      <div className="flex items-center gap-1 text-xs text-textSecondary">
                        <Clock className="w-3 h-3" />
                        <span>{project.updated}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                      <button className="p-1.5 rounded hover:bg-surface2 text-textSecondary hover:text-accent transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-surface2 text-textSecondary hover:text-accent transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-surface2 text-textSecondary hover:text-accent transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-surface2 text-textSecondary hover:text-error transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features Section */}
            <section id="recursos" className="mt-24">
              <div className="text-center mb-10">
                <span className="badge-gold inline-block mb-4">Recursos</span>
                <h2 className="text-3xl font-bold text-text mb-3">
                  Tudo que você precisa para criar e publicar
                </h2>
                <p className="text-textSecondary max-w-2xl mx-auto">
                  Ferramentas completas para transformar um simples prompt em um produto real, publicado e monitorado.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <div key={feature.name} className="card hover:border-primary transition-all duration-300 group">
                      <div className="w-12 h-12 bg-surface2 rounded-lg flex items-center justify-center border border-border group-hover:border-primary transition-colors mb-4">
                        <Icon className="w-6 h-6 text-accent" />
                      </div>
                      <h3 className="text-lg font-semibold text-text mb-2">{feature.name}</h3>
                      <p className="text-sm text-textSecondary">{feature.description}</p>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Steps Section */}
            <section className="mt-24">
              <div className="text-center mb-10">
                <span className="badge-gold inline-block mb-4">Como funciona</span>
                <h2 className="text-3xl font-bold text-text mb-3">
                  Do prompt ao produto em 4 passos
                </h2>
                <p className="text-textSecondary max-w-2xl mx-auto">
                  Um fluxo simples que leva sua ideia do conceito ao ar em minutos.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {steps.map((step) => (
                  <div key={step.number} className="card hover:border-primary transition-all duration-300">
                    <span className="text-4xl font-bold text-accent text-glow">{step.number}</span>
                    <h3 className="text-lg font-semibold text-text mt-4 mb-2">{step.title}</h3>
                    <p className="text-sm text-textSecondary">{step.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Environment Health Section */}
            <section className="mt-24">
              <div className="card">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div>
                    <span className="badge-gold inline-block mb-4">Infraestrutura</span>
                    <h2 className="text-2xl font-bold text-text mb-3">
                      Saúde do ambiente em tempo real
                    </h2>
                    <p className="text-sm text-textSecondary mb-6">
                      Monitoramento contínuo de todos os serviços que sustentam seus projetos, com uptime verificado minuto a minuto.
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-success rounded-full animate-pulse"></span>
                      <span className="text-sm font-medium text-success">Todos os sistemas operacionais</span>
                    </div>
                  </div>
                  <div className="lg:col-span-2 space-y-2">
                    {services.map((service) => (
                      <div
                        key={service.name}
                        className="flex items-center justify-between px-4 py-3 bg-surface2 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <Server className="w-4 h-4 text-accent" />
                          <span className="text-sm font-medium text-text">{service.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32 h-1.5 bg-surface3 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${service.ok ? "bg-success" : "bg-warning"}`}
                              style={{ width: service.uptime }}
                            ></div>
                          </div>
                          <span className="text-xs text-textSecondary w-14 text-right">{service.uptime}</span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              service.ok
                                ? "bg-success/15 text-success border border-success/30"
                                : "bg-warning/15 text-warning border border-warning/30"
                            }`}
                          >
                            {service.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Pricing Section */}
            <section id="precos" className="mt-24">
              <div className="text-center mb-10">
                <span className="badge-gold inline-block mb-4">Planos e Preços</span>
                <h2 className="text-3xl font-bold text-text mb-3">Escolha seu plano</h2>
                <p className="text-textSecondary max-w-2xl mx-auto">
                  Comece grátis e escale conforme seus projetos crescem. Cancele quando quiser.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {plans.slice(0, 4).map((plan) => (
                  <div
                    key={plan.name}
                    className={`card flex flex-col transition-all duration-300 ${
                      plan.highlight ? "border-primary shadow-glow-gold" : "hover:border-primary"
                    }`}
                  >
                    <h3 className="text-lg font-semibold text-text mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-bold text-accent">{plan.price}</span>
                      <span className="text-sm text-textSecondary">{plan.period}</span>
                    </div>
                    <ul className="space-y-2 mb-6 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-textSecondary">
                          <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                        plan.highlight
                          ? "bg-primary hover:bg-primaryDark text-black"
                          : "bg-surface2 hover:bg-surface3 text-text border border-border"
                      }`}
                    >
                      {plan.cta}
                    </button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.slice(4).map((plan) => (
                  <div
                    key={plan.name}
                    className={`card flex flex-col transition-all duration-300 ${
                      plan.highlight ? "border-primary shadow-glow-gold" : "hover:border-primary"
                    }`}
                  >
                    {plan.highlight && (
                      <span className="badge-gold self-start mb-3">Mais completo</span>
                    )}
                    <h3 className="text-lg font-semibold text-text mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-bold text-accent">{plan.price}</span>
                      <span className="text-sm text-textSecondary">{plan.period}</span>
                    </div>
                    <ul className="space-y-2 mb-6 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-textSecondary">
                          <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                        plan.highlight
                          ? "bg-primary hover:bg-primaryDark text-black"
                          : "bg-surface2 hover:bg-surface3 text-text border border-border"
                      }`}
                    >
                      {plan.cta}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
