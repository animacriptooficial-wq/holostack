/* ============================================================
   HOLOSTACK-PSO — Matriz Comercial (spec §3)
   7 tiers: 3 Basic ($19) · 3 Corporate ($297/$497/$897) · Master
   Quotas persistem no Supabase Storage: user:{id}:{key}
   ============================================================ */

export type PlanId =
  | "basic-starter"
  | "basic-pro"
  | "basic-scale"
  | "corporate-1"
  | "corporate-2"
  | "corporate-3"
  | "master"

export interface Plan {
  id: PlanId
  block: 1 | 2 | 3
  name: string
  priceUSD: number | null // null = sob consulta
  assetLimit: number | null // null = ilimitado
  monthlyTokens: number | null
  psoIncluded: boolean
  description: string
  features: string[]
  cta: string
  highlight: boolean
}

export const PLANS: Plan[] = [
  // ── BLOCO 1 — Básicos (empreendedores, PSO nativo incluso) ──
  {
    id: "basic-starter",
    block: 1,
    name: "Basic Starter",
    priceUSD: 19,
    assetLimit: 50,
    monthlyTokens: 500_000,
    psoIncluded: true,
    description: "50 sites/landing pages ativas — motor PSO de cauda longa incluso desde o primeiro dia",
    features: [
      "50 ativos web ativos",
      "Motor PSO de cauda longa 100% incluso",
      "Otimização de conversão",
      "Infraestrutura na borda (Cloudflare)",
    ],
    cta: "Assinar agora",
    highlight: false,
  },
  {
    id: "basic-pro",
    block: 1,
    name: "Basic Pro",
    priceUSD: 19,
    assetLimit: 100,
    monthlyTokens: 1_000_000,
    psoIncluded: true,
    description: "100 ativos — o dobro de capacidade, PSO nativo para múltiplos nichos",
    features: [
      "100 ativos web ativos (2× Starter)",
      "Motor PSO para múltiplos nichos",
      "Otimização de conversão",
      "Infraestrutura na borda (Cloudflare)",
    ],
    cta: "Assinar agora",
    highlight: false,
  },
  {
    id: "basic-scale",
    block: 1,
    name: "Basic Scale",
    priceUSD: 19,
    assetLimit: 150,
    monthlyTokens: 1_500_000,
    psoIncluded: true,
    description: "150 ativos — o triplo de capacidade, teto da linha básica para tráfego orgânico",
    features: [
      "150 ativos web ativos (3× Starter)",
      "Motor PSO alta performance orgânica",
      "Otimização de conversão",
      "Infraestrutura na borda (Cloudflare)",
    ],
    cta: "Assinar agora",
    highlight: false,
  },
  // ── BLOCO 2 — Corporativos / produção industrial ──
  {
    id: "corporate-1",
    block: 2,
    name: "Complete Corporate I",
    priceUSD: 297,
    assetLimit: 300,
    monthlyTokens: 5_000_000,
    psoIncluded: true,
    description: "300 ativos corporativos com motor PSO industrial integrado",
    features: [
      "300 ativos corporativos",
      "Motor PSO industrial integrado",
      "Prioridade na fila de geração",
      "Suporte dedicado",
    ],
    cta: "Assinar agora",
    highlight: true,
  },
  {
    id: "corporate-2",
    block: 2,
    name: "Complete Corporate II",
    priceUSD: 497,
    assetLimit: 400,
    monthlyTokens: 8_000_000,
    psoIncluded: true,
    description: "400 ativos corporativos para operações avançadas",
    features: [
      "400 ativos corporativos",
      "Motor PSO industrial integrado",
      "SLA de produção garantido",
      "Suporte dedicado",
    ],
    cta: "Assinar agora",
    highlight: false,
  },
  {
    id: "corporate-3",
    block: 2,
    name: "Complete Corporate III",
    priceUSD: 897,
    assetLimit: 600,
    monthlyTokens: 15_000_000,
    psoIncluded: true,
    description: "600 ativos — fábricas de tráfego, grandes empresas e agências de elite",
    features: [
      "600 ativos corporativos",
      "Fábrica de tráfego completa",
      "Infra dedicada na borda",
      "Gerente de conta",
    ],
    cta: "Falar com vendas",
    highlight: false,
  },
  // ── BLOCO 3 — Licença Master ──
  {
    id: "master",
    block: 3,
    name: "Licença Master",
    priceUSD: null,
    assetLimit: null,
    monthlyTokens: null,
    psoIncluded: true,
    description: "$2.500–$5.000+ sob consulta — aquisição definitiva do ecossistema completo",
    features: [
      "Código-fonte completo em mãos",
      "White-label total",
      "Autonomia total — sem mensalidade",
      "Todos os recursos desbloqueados",
    ],
    cta: "Falar com vendas",
    highlight: false,
  },
]

export function getPlan(id: string): Plan | null {
  return PLANS.find((p) => p.id === id) ?? null
}
