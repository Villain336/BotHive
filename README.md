# ShipReady

Make your app production-ready. AI-powered compliance scanning and agentic code fixes for vibe coders.

## What it does

ShipReady scans your GitHub repository and identifies compliance gaps across 4 categories, then helps you fix them through an agentic AI chat that can read your code, suggest fixes, and apply them via PR.

### Compliance Categories

| Category | What it checks |
|----------|---------------|
| **Testing** (primary focus) | Test coverage ratio, assertion density, framework config, E2E presence, API route test coverage |
| **Security** | Secrets in code, .gitignore coverage, auth middleware, input validation, CSP headers, rate limiting |
| **Legal & Privacy** | LICENSE, privacy policy (GDPR completeness), terms of service, cookie consent, data deletion |
| **Ops & Infrastructure** | CI/CD pipeline steps, Docker best practices, error monitoring, health checks, env validation |

### How it works

1. **Connect** your GitHub repo (via GitHub OAuth)
2. **Scan** to get a compliance scorecard (0-100 per category)
3. **Chat** with specialized AI experts to fix each gap
4. **Apply** fixes directly via branch + PR creation

### Pricing

| Plan | Price | Limits |
|------|-------|--------|
| Trial | Free (14 days) | 1 project, 3 scans/mo, 10 messages/day |
| Starter | $29/mo | 3 projects, unlimited scans, 50 messages/day |
| Pro | $79/mo | 10 projects, unlimited everything, PR creation |
| Team | $199/mo | Unlimited projects, team management, priority support |

## Tech Stack

- **Framework**: Next.js 14 (App Router), TypeScript
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Payments**: Stripe (subscriptions, webhooks, customer portal)
- **AI**: Anthropic Claude API (agentic chat with multi-turn tool use)
- **GitHub**: Octokit (repo scanning, file reading, branch/commit/PR creation)
- **UI**: Tailwind CSS + Radix UI (shadcn/ui components)
- **State**: Zustand
- **Monitoring**: Sentry
- **Testing**: Jest + React Testing Library + Playwright

## Getting Started

### Prerequisites

- Node.js 18+ 
- Supabase project
- Stripe account
- GitHub OAuth app
- Anthropic API key

### Setup

```bash
git clone https://github.com/Villain336/BotHive.git
cd BotHive
npm install
cp .env.example .env.local
```

Edit `.env.local` with your credentials (see `.env.example` for all required variables).

### Database

Apply the ShipReady schema to your Supabase project:

```bash
# Via Supabase CLI
supabase db push

# Or manually run the migration SQL:
# supabase/migrations/20260401000000_shipready_schema.sql
```

### Stripe Products

Create 3 subscription products in your Stripe dashboard:
- **Starter**: $29/mo recurring
- **Pro**: $79/mo recurring  
- **Team**: $199/mo recurring

Add the price IDs to your `.env.local`.

### GitHub OAuth

1. Go to Supabase Dashboard > Auth > Providers > GitHub
2. Create a GitHub OAuth App at github.com/settings/developers
3. Set callback URL to `https://your-domain.com/api/auth/callback`
4. Add client ID and secret to Supabase

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
# Unit + Integration + Component tests (147 tests)
npm test

# With coverage
npm run test:coverage

# Playwright E2E tests (8 spec files)
npm run test:e2e

# Type check
npm run type-check
```

## Project Structure

```
app/
  api/
    auth/callback/     # GitHub OAuth callback
    billing/           # Stripe checkout + portal
    chat/              # Agentic AI chat (streaming SSE)
    conversations/     # Chat history
    projects/          # CRUD + scan + findings + apply
    webhooks/stripe/   # Subscription webhook handler
  dashboard/
    chat/              # Conversation history
    projects/          # Project list, detail, scan results
    settings/          # Account + billing settings
  page.tsx             # Landing page
  pricing/             # Pricing page

components/
  chat/                # Chat interface, messages, tool status, code suggestions
  ui/                  # shadcn/ui components (button, card, dialog, etc.)

lib/
  ai/                  # Claude client, system prompts, tool definitions
  scanners/            # 4 compliance analyzers (testing, security, legal, ops)
  auth.ts              # Zustand auth store with GitHub OAuth
  github.ts            # GitHub API (read + write operations)
  stripe.ts            # Subscription plans and pricing
  usage.ts             # Plan limit enforcement

e2e/                   # Playwright E2E tests
__tests__/             # Jest unit + integration + component tests
```

## Architecture Decisions

- **Agentic loop**: Chat API uses a `while` loop (max 10 iterations) where Claude calls tools, results are fed back, and Claude reasons further until it reaches a final answer
- **Tiered scanning**: Trial/Starter scans ~5 key files, Pro/Team scans up to 50 source files for deeper analysis
- **Server-side auth**: Middleware protects dashboard routes, auth callback stores GitHub token for repo access
- **Usage enforcement**: Every API route checks plan limits before execution (429 on limit hit)

## Stripe Products (Live)

| Plan | Product ID | Price ID |
|------|-----------|----------|
| Starter ($29/mo) | `prod_UFqX3ywQU1VdkL` | `price_1THKqnR69hwQuKhCz8CsaR8k` |
| Pro ($79/mo) | `prod_UFqX5JA4fCVJPO` | `price_1THKqnR69hwQuKhC8z4rWrlm` |
| Team ($199/mo) | `prod_UFqXs1bO0cATyv` | `price_1THKqoR69hwQuKhCRZGQLPwb` |

## License

Proprietary - see [LICENSE](LICENSE) for details.
