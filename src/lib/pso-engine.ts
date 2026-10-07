/* ============================================================
   MOTOR PSO INDUSTRIAL — Programmatic SEO (spec §4)
   - Cadência: 10 páginas complexas por minuto
   - Alvo diário: 14.400 páginas otimizadas
   - Expurgo automático: páginas sem conversão após 30 dias
   - Mapeamento de cauda longa: alta intenção, concorrência zero
   ============================================================ */

export const PSO_CADENCE_PER_MINUTE = 10
export const PSO_DAILY_TARGET = 14_400
export const PSO_PURGE_DAYS = 30

export interface PsoPage {
  slug: string
  title: string
  description: string
  keywords: string[]
  html: string
  niche: string
  createdAt: number
  conversions: number
}

/* ---------- Mapeamento de cauda longa ---------- */

const INTENT_MODIFIERS = [
  "comprar",
  "melhor preço",
  "onde comprar",
  "promoção",
  "desconto",
  "original",
  "oferta",
  "frete grátis",
  "com garantia",
  "entrega rápida",
]

const FORMAT_SUFFIXES = [
  "online",
  "hoje",
  "2026",
  "no brasil",
  "vale a pena",
  "avaliações",
  "antes e depois",
  "funciona mesmo",
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

/* Gera termos de cauda longa: nicho × intenção × formato.
   Determinístico — mesma entrada produz o mesmo conjunto. */
export function mapLongTail(niche: string, count: number): string[] {
  const base = niche.trim().toLowerCase()
  const terms: string[] = []
  const seen = new Set<string>()

  outer: for (const intent of INTENT_MODIFIERS) {
    for (const suffix of FORMAT_SUFFIXES) {
      const term = `${base} ${intent} ${suffix}`
      if (!seen.has(term)) {
        seen.add(term)
        terms.push(term)
        if (terms.length >= count) break outer
      }
    }
  }
  return terms
}

/* ---------- Construção de página otimizada ---------- */

export function buildPsoPage(niche: string, term: string): PsoPage {
  const slug = slugify(term)
  const title = `${term.replace(/\b\w/g, (c) => c.toUpperCase())} | Oferta Exclusiva`
  const description = `${term} — oferta verificada, melhor preço e entrega garantida. ${niche} com avaliação real de clientes e checkout seguro.`

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: term,
    description,
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      priceCurrency: "USD",
    },
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title}</title>
<meta name="description" content="${description}"/>
<meta name="robots" content="index,follow"/>
<link rel="canonical" href="/p/${slug}"/>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>
body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0f;color:#f4f4f5;margin:0;padding:2rem;line-height:1.6}
main{max-width:760px;margin:0 auto}
h1{color:#fbbf24;font-size:2rem;margin-bottom:.5rem}
.cta{display:inline-block;margin-top:2rem;padding:1rem 2rem;background:#f59e0b;color:#000;font-weight:700;border-radius:8px;text-decoration:none}
.badge{color:#34d399;font-size:.85rem}
</style>
</head>
<body>
<main>
<p class="badge">✓ Oferta verificada · Estoque disponível</p>
<h1>${title}</h1>
<p>${description}</p>
<p>Procura por <strong>${niche}</strong> com alta intenção de compra respondida em segundos: preço transparente, garantia real e suporte dedicado. Conteúdo gerado pelo Motor PSO HoloStack — cauda longa de conversão direta, zero anúncios pagos.</p>
<a class="cta" href="/checkout?p=${slug}">Garantir a minha oferta →</a>
</main>
</body>
</html>`

  return {
    slug,
    title,
    description,
    keywords: term.split(" "),
    html,
    niche,
    createdAt: Date.now(),
    conversions: 0,
  }
}

/* ---------- Geração em lote com cadência ---------- */

/* Gera `count` páginas. A cadência de 10/min é o alvo de produção —
   cada chamada gera até `count` páginas de uma vez (CPU é trivial,
   o gargalo real é a taxa de deploy/indexação). */
export function generatePsoBatch(niche: string, count: number): PsoPage[] {
  const safe = Math.max(1, Math.min(count, 200))
  return mapLongTail(niche, safe).map((term) => buildPsoPage(niche, term))
}

/* ---------- Expurgo de 30 dias ---------- */

export function isPurgeable(page: PsoPage, now = Date.now()): boolean {
  const ageMs = now - page.createdAt
  return page.conversions === 0 && ageMs > PSO_PURGE_DAYS * 24 * 60 * 60 * 1000
}
