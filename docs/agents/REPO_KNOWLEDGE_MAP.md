# Repo Knowledge Map

**Status:** `current`
**Last verified:** 2026-07-04 (routes, modules, commands, and integrations checked against code)

One-page orientation for agents. Read this with [`../AGENT_START_HERE.md`](../AGENT_START_HERE.md) — that file owns the source-of-truth map, env vars, and drift table; this file owns the "where is everything and what must I not break" view.

## Product Summary

**MergeAttest** (mergeattest.com) is a GitHub-native SaaS control center for engineering teams shipping AI-assisted code. It attributes every pull request to the coding agent that wrote it (with confidence and evidence), scores risk deterministically (rule-based, no LLM), detects missing tests, evaluates repository rules, records human approvals and attestations, and exports audit-ready evidence for EU AI Act human-oversight and SOC2 reviews.

- **Operator:** Eastbase Studio (https://www.eastbase.studio). Product support: `support@mergeattest.com` (studio-level contact is `support@eastbase.studio` — do not swap one for the other in product surfaces).
- **Users:** engineering leads, platform engineers, security/compliance owners. They distrust AI-washing; trust is earned by showing deterministic mechanics.
- **Stage (2026-07):** free early access, pre-customer. No public pricing. Paid billing dormant behind `ENABLE_PAID_BILLING`. AI review model execution intentionally disabled (durable queue exists; worker skips). **Never invent traction, customers, testimonials, or pricing.**
- **Differentiator:** deterministic governance + explainable agent attribution + human-attestation gate + compliance evidence export. Advisory AI is a supporting layer, never the visual or narrative center.

## Route Map

| Group               | Routes                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public/marketing    | `/` (Paper of Record landing: hero + seal, `#record`, `#method`, `#live`, `#evidence`, `#faq`), `/privacy`, `/terms`                                                                                                                                                                                                                                                         |
| Auth                | `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`                                                                                                                                                                                                                                                                                                                |
| App (authenticated) | `/dashboard`, `/activity`, `/pull-requests[/​[id]]`, `/repositories[/​[id]]` (+ `/ai`, `/rules`), `/approvals`, `/audit-log`, `/reports`, `/settings` (+ `/team`, `/billing`, `/github`, `/agents`, `/ai`, `/usage`)                                                                                                                                                         |
| Platform admin      | `/admin` (+ `/organizations[/​[id]]`, `/users`, `/subscriptions`, `/system`) — gated by `ADMIN_EMAILS`                                                                                                                                                                                                                                                                       |
| API                 | Auth (`/api/auth/[...all]`), health/diagnostics, GitHub (webhook + retry, installation, backfill, comment, sync), jobs (`/api/jobs/{github-webhooks,pr-reviews,retention}` — bearer `JOB_RUNNER_SECRET`), billing (checkout/portal — disabled unless paid billing on), Lemon Squeezy webhook, team invite accept, onboarding, exports (review packet, authorship, audit log) |

Server actions live in `actions.ts` files beside their pages: `app/pull-requests/`, `app/admin/`, `app/settings/{team,agents,ai}/`, `app/repositories/[id]/{ai,rules}/`.

## Key Files & Folders

| Path                                                                           | What it is                                                                                           |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `proxy.ts`                                                                     | Edge auth gate: session cookie, rate limits, CSRF on mutations. Public paths listed in `lib/site.ts` |
| `lib/data/app-data.ts`                                                         | **The** org-scoped read layer for app pages (tenancy boundary)                                       |
| `lib/admin/admin-data.ts`                                                      | The **only** module allowed to read across orgs                                                      |
| `lib/entitlements.ts`, `lib/usage.ts`                                          | Plan flags + numeric limits, enforced server-side; `free` currently has all flags on                 |
| `lib/env.ts`                                                                   | Env validation; production fails closed on missing secrets                                           |
| `lib/risk.ts`, `lib/test-gap.ts`, `lib/rules.ts`                               | Deterministic governance engines (tests in `tests/`)                                                 |
| `lib/agents/attribution.ts`                                                    | Agent attribution engine (weighted signals + org identity registry)                                  |
| `lib/attestation.ts`, `lib/approvals.ts`                                       | Human-accountability gate and approval records                                                       |
| `lib/github*.ts`, `lib/jobs/**`                                                | GitHub App sync/webhooks + durable job queue                                                         |
| `lib/billing.ts`, `lib/lemon-squeezy-webhooks.ts`                              | Dormant billing (keep intact for later monetization)                                                 |
| `lib/site.ts`, `lib/seo/**`, `app/{robots,sitemap,manifest,opengraph-image}.*` | Canonical positioning strings, metadata, JSON-LD                                                     |
| `public/llms.txt`, `public/llms-full.txt`, `public/ai-discovery.json`          | Agent-readable discovery layer (see `docs/operations/AI_DISCOVERABILITY.md`)                         |
| `app/globals.css`                                                              | Design-token source of truth (OKLCH, hue 264–278); `DESIGN.md` is the distilled reference            |
| `components/ui/**`                                                             | shadcn-style primitives wired to project tokens (not shadcn defaults)                                |
| `components/app/**`, `components/marketing/**`                                 | App shell/surfaces; marketing copy in `components/marketing/content.ts`                              |
| `prisma/schema.prisma`                                                         | Schema; migrations keep historical AgentGate names intentionally                                     |
| `tests/` (32 files)                                                            | Vitest unit tests per domain module                                                                  |
| `PRODUCT.md`, `DESIGN.md`                                                      | Brand personality, anti-references, distilled design language                                        |

## Services & Integrations

| Service                           | Status                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| GitHub App (Octokit)              | **Live core.** Install, sync, webhooks with durable delivery queue                          |
| PostgreSQL + Prisma 7             | Live. Demo fallback when `DATABASE_URL` missing (dev only; prod fails closed)               |
| Better Auth (+ Infra dash plugin) | Live. Email/password; verification when Resend configured                                   |
| Resend                            | Optional; mock transport in dev without keys                                                |
| Lemon Squeezy                     | **Dormant.** Webhooks/helpers intact; checkout/portal off unless `ENABLE_PAID_BILLING=true` |
| OpenRouter (BYOK)                 | Keys stored encrypted; review queue durable; **model execution disabled**                   |
| Vercel Analytics                  | Live (`app/layout.tsx`). No Sentry/PostHog — do not claim otherwise                         |

## Commands

```bash
pnpm install
pnpm dev            # port 3000; INVALID_ORIGIN if auth flows hit another port
pnpm lint
pnpm typecheck      # runs prisma generate first
pnpm test           # vitest run (equivalent to: pnpm exec vitest run tests)
pnpm build          # prisma generate + next build
pnpm db:generate / db:migrate / db:seed
pnpm format         # prettier --write . — see CRLF gotcha below before running repo-wide
```

CI (`.github/workflows/ci.yml`): lint → typecheck → test → `pnpm audit --audit-level moderate` → build.

## Read-First Docs

1. [`../AGENT_START_HERE.md`](../AGENT_START_HERE.md) — every session
2. Root [`AGENTS.md`](../../AGENTS.md) — operating guide, task→docs matrix, guardrails
3. [`../SYSTEM_DESIGN.md`](../SYSTEM_DESIGN.md) — before UI or structural changes
4. [`PROJECT_QUALITY_BAR.md`](PROJECT_QUALITY_BAR.md) — before shipping anything user-visible
5. Task-specific playbook in [`playbooks/`](playbooks/) if one matches

## Sensitive Areas — Do Not Change Casually

- **`proxy.ts` and `lib/auth*`** — the auth gate; a mistake exposes tenant data.
- **`lib/data/app-data.ts` org scoping and `lib/admin/admin-data.ts` boundary** — the tenancy model. Never add a cross-org read outside `lib/admin/`.
- **`lib/entitlements.ts` / `lib/usage.ts`** — launch posture encoded here (`free` flags all on). Re-gating is a product decision, not a cleanup.
- **Billing modules and Lemon Squeezy webhook handling** — dormant on purpose; do not delete or "simplify" them.
- **Attribution signal weights (`lib/agents/attribution.ts`) and scorecard/attestation semantics** — product-defining numbers with compliance meaning; changes need owner sign-off.
- **Compliance/audit export formats** — downstream evidence artifacts; treat shape changes as breaking.
- **`prisma/migrations/`** — append-only; old AgentGate-named migrations are intentional.
- **`public/llms*.txt`, `ai-discovery.json`, JSON-LD** — every claim must be true today (see AI_DISCOVERABILITY.md "never invent" list).
- **Marketing claims anywhere** — pre-customer product; no traction, logos, testimonials, or pricing.

## Repo Gotchas (learned the hard way)

- **Local `pnpm build` fails bare** — production env validation needs `GITHUB_*` values; prefix placeholder vars when verifying builds locally.
- **Repo-wide `pnpm format:check` fails on Windows checkouts** (CRLF drift). Run prettier scoped to the files you touched.
- **Demo mode:** empty `DATABASE_URL` in `.env.local` gives a no-login demo dataset — fastest way to eyeball app UI.
- **Tailwind v4:** plain author-CSS `.text-*` rules get dropped; define custom utilities with `@utility` in `globals.css`.
- **Skeletons:** when a page layout changes, update its `loading.tsx` / page-loading skeleton to match.
- **Next.js 16 differs from training data** — check `node_modules/next/dist/docs/` before using an API you "remember".
