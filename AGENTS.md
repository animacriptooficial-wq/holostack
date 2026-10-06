# HoloStack-PSO - Project Information

## Project Overview
HoloStack-PSO is a unified AI-powered development ecosystem with a Midnight Carbon (black/gold) interface, integrating multiple AI engines, a universal cross-platform program generator, workspace tooling, and a fully isolated administrative control panel.

## Tech Stack
- **Framework**: Next.js 15.5.27 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4.4 with custom glassmorphism utilities
- **Icons**: Lucide React
- **QR Codes**: qrcode 1.5.4
- **Runtime**: Node.js v24.21.0

## Deployment
- **Production**: https://holostack-one.vercel.app (Vercel project `holostack/holostack`, team `holostack`)
- Admin panel: https://holostack-one.vercel.app/x7k2m9q4-admin
- **GitHub**: https://github.com/animacriptooficial-wq/holostack (branch `main`, synced)
- Deploy command: `vercel --prod --yes` (Vercel CLI authenticated as `animacriptooficial-5430`)
- Deployment protection (SSO) is disabled — site is publicly accessible

## Build Commands
- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint (requires eslint to be installed — currently not configured)

## Routes

### Public / Application
| Route | Purpose |
|---|---|
| `/` | Dashboard (metrics grid, API mesh, generator CTA, pricing, projects) |
| `/login` | Unified login/register (Google OAuth popup, email, phone) |
| `/onboarding` | Infrastructure linking (GitHub, Vercel, Supabase) |
| `/settings` | User settings + API key center (GPT-5.6 Luna highlighted) |
| `/workspace` | Code preview, file tree, state monitor, API keys |
| `/generator` | Universal multiplatform program generator |
| `/setup-2fa` | TOTP setup with scannable QR code + recovery codes |
| `/verify-2fa` | 2FA verification gate |

### Admin (isolated — secret URL, not linked from public navigation)
| Route | Purpose |
|---|---|
| `/x7k2m9q4-admin` | Admin overview dashboard |
| `/x7k2m9q4-admin/appearance` | Theme selector (10 site-wide themes) |
| `/x7k2m9q4-admin/keys` | Admin API key management |
| `/x7k2m9q4-admin/operations` | Operational controls (queue, maintenance, cache, restarts) |
| `/x7k2m9q4-admin/security` | 2FA management, recovery codes, sessions |

Admin routes share a dedicated `src/app/x7k2m9q4-admin/layout.tsx` with an independent sidebar and an auth+2FA guard chain: no login → `/login`, no 2FA configured → `/setup-2fa`, unverified → `/verify-2fa`. The plain `/admin` path returns 404 — the panel only responds at the secret slug above.

## Theme System
`src/lib/theme.tsx` provides `ThemeProvider` + `useTheme` with **10 site-wide themes** persisted in `localStorage` (`holostack_theme`) and applied via `document.documentElement.dataset.theme`. All Tailwind colors in `tailwind.config.ts` resolve through CSS variables (`var(--primary)`, `var(--accent)`, `var(--surface)`, etc.), so each theme re-colors every component automatically.

The 10 themes (`[data-theme]` ids): `carbon` (Midnight Carbon & Gold), `cyber` (Cyberpunk Neon Cyan), `obsidian` (Obsidian & Emerald), `royal` (Royal Purple & Platinum), `crimson` (Crimson Matrix & Dark), `arctic` (Arctic Frost & Ice Blue), `solar` (Solar Amber & Charcoal), `matrix` (Matrix Digital Green), `sunset` (Sunset Orange & Deep Purple), `titanium` (Minimalist Titanium & Silver).

Each theme defines a full palette in `globals.css` (background, surfaces, primary, accent, text, border, `--glow`) plus a unique background effect (radial gradients, dot matrix, scanlines, ambient glows). A global glow-hover system lights up cards, buttons, chips and links with the active theme's accent color (`--glow` var).

The selector UI with 10 interactive buttons is at `/x7k2m9q4-admin/appearance`.

## Authentication & 2FA
- `src/lib/auth.tsx` — `AuthProvider`, user/session state, Google/email/phone login, infrastructure provisioning, 2FA state (all persisted in localStorage)
- `src/lib/totp.ts` — RFC 6238 TOTP via Web Crypto HMAC-SHA1: base32 secrets, ±1 window verification, 8 one-time recovery codes, `otpauth://` URI generation
- QR code generated client-side in `/setup-2fa` from the `otpauth://` URI using the `qrcode` package — scannable by Google Authenticator / Authy

## Key Libraries
- `src/lib/theme.tsx` — theme context/provider
- `src/lib/auth.tsx` — auth context/provider
- `src/lib/totp.ts` — TOTP implementation
- `src/lib/engine.ts` — Universal Generation Engine: real API calls to OpenAI/Anthropic/Gemini/OpenRouter (Luna), reads keys from `localStorage["holostack_api_keys"]`
- `src/lib/pso.ts` — PSO (Prompt Slicing & Optimization): 4-slice pipeline (Arquitetura → Core Logic → Interface → Integração) with static validation (JSON parse, bracket balance, HTML DOMParser, TODO detection) and self-healing retry loop (max 3 attempts/slice)
- `src/app/api/sync/route.ts` — Server route: writes generated files to `generated/<project>/` and runs `git add/commit/push` (local dev only — serverless can't write/exec)
- `src/lib/navigation.ts` — route definitions
- `src/lib/utils.ts` — `cn()` class merging utility

## Theme Colors
- Background center: `#030305`, edge: `#0d0d12`
- Cards/panels: solid black `#000000`
- Text: `#f4f4f5`, secondary: `#a1a1aa`
- Accent golds: `#fbbf24`, `#f59e0b`, `#d97706`
- Success `#10b981`, warning `#f59e0b`, error `#ef4444`
- Global hover transitions to gold on all interactive elements

## Validation Status
- `npm run build` compiles cleanly — 13 routes, zero errors
- All 13 routes verified returning HTTP 200
- Zero TODO/FIXME comments, no placeholder code
- ESLint is not installed/configured — `npm run build` skips linting with a warning

## Cloud-Native Configuration (Vercel env vars)

Configure no painel Vercel → Settings → Environment Variables:

| Variável | Obrigatória | Função |
|---|---|---|
| `OPENAI_API_KEY` | Sim (ou via /settings) | Chave OpenAI para o motor de geração |
| `GITHUB_TOKEN` | Cloud sync | Token PAT com scope `repo` — commit via REST API |
| `GITHUB_REPO` | Cloud sync | `owner/repo` (ex: `animacriptooficial-wq/holostack`) |
| `GITHUB_BRANCH` | Opcional | Default `main` |
| `SUPABASE_URL` | Persistência cloud | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Persistência cloud | Service role key (ou `SUPABASE_ANON_KEY`) |

### Supabase — SQL da tabela de persistência

```sql
create table if not exists holostack_files (
  project text not null,
  path text not null,
  content text not null,
  updated_at timestamptz default now(),
  primary key (project, path)
);
alter table holostack_files enable row level security;
create policy "service_full" on holostack_files for all using (true) with check (true);
```

### Arquitetura de sync (cascata)

`/api/sync` → 1) disco local (só dev) → 2) Supabase (cloud) → 3) GitHub REST API (cloud, sem git binário) → 4) git local (fallback dev).
`/api/files` → disco → Supabase → GitHub (fallbacks em cascata).
`/api/preview` → bundling esbuild 100% server-side; escreve `public/previews/` só localmente.

## Known Limitations
- Google OAuth, infrastructure provisioning (GitHub/Vercel/Supabase), and login flows are client-side simulations — no backend exists. Production deployment requires real OAuth callbacks and provider API calls.
- TOTP is cryptographically real (RFC 6238), but secrets are stored in localStorage rather than a server-side store.
