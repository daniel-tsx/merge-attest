# Agent Start Here

**Status:** `current`
**Last verified:** 2026-05-31 (code, config, and test commands checked against repo)

Read this file at the start of every non-trivial session, then follow the read order below.

## Read Order

1. `README.md` — product one-liner and quick start
2. This file — source-of-truth map, drift warnings, verification commands
3. Task-specific docs (pick one):
   - Local setup, routes, architecture → `operations/SETUP.md`
   - API endpoints → `features/API.md`
   - UI tokens and patterns → `features/DESIGN_SYSTEM.md`
   - Production launch → `operations/PRODUCTION_CHECKLIST.md`
   - Jobs, incidents, retention → `operations/OPERATIONS_RUNBOOK.md`
   - Privacy and support → `operations/PRIVACY_RETENTION_SUPPORT.md`
   - Active roadmap → `strategy/ENHANCEMENT_PLAN.md`
4. Code paths from the source-of-truth map (below) — trust code over docs when they disagree

Do **not** treat `archive/` docs as current product state unless the task is explicitly historical.

## Current Product Truth

AgentGate is a **GitHub-native SaaS control center** for teams shipping AI-assisted code. It monitors pull requests, scores risk, detects test gaps, evaluates repository rules, records approvals, meters plan usage, exports audit evidence, and queues advisory AI reviews.

**What is real today (verified in code):**

- Better Auth email/password with optional verification when Resend is configured
- Multi-tenant PostgreSQL via Prisma; org-scoped reads through `lib/data/app-data.ts`
- Local demo fallback when `DATABASE_URL` is missing (dev only; production fails closed)
- GitHub App install/sync/webhooks with durable delivery queue and job runner endpoints
- Persisted approvals, audit events, plan entitlements, and monthly PR-check metering
- Lemon Squeezy checkout, customer portal, and subscription webhooks
- OpenRouter BYOK storage, repository AI settings, durable PR review queue — **model execution intentionally not enabled yet**
- Deterministic risk, test-gap, and rule evaluation (not LLM-based)

**Not implemented:** product analytics (PostHog/etc.), error tracking SaaS (Sentry/etc.), non-GitHub SCM, enterprise SSO/SCIM (see `strategy/ENTERPRISE_PLACEHOLDERS.md`).

## Current Stack Truth

Verified from `package.json`, `prisma/schema.prisma`, and integration modules:

| Layer         | Choice                                                                             |
| ------------- | ---------------------------------------------------------------------------------- |
| App           | Next.js 16 App Router, React 19, TypeScript                                        |
| Styling       | Tailwind CSS v4, local shadcn-style primitives in `components/ui/`                 |
| URL state     | `nuqs` on filterable list pages                                                    |
| Database      | PostgreSQL + Prisma 7 (`lib/generated/prisma`)                                     |
| Auth          | Better Auth + `@better-auth/infra` dash plugin + Prisma adapter                    |
| GitHub        | Octokit GitHub App (`lib/github.ts`, sync/webhook modules)                         |
| Billing       | Lemon Squeezy (`lib/billing.ts`, `lib/lemon-squeezy-webhooks.ts`)                  |
| Email         | Resend (`lib/email.ts`)                                                            |
| AI            | OpenRouter BYOK (`lib/ai/openrouter.ts`) — advisory layer only                     |
| Charts        | Recharts (client island)                                                           |
| Tests         | Vitest (`tests/`, 219 tests)                                                       |
| Auth gate     | `proxy.ts` (session cookie + rate limits + CSRF on mutations)                      |
| Hosting       | Vercel-friendly (`VERCEL_GIT_COMMIT_SHA` in logs); no provider lock-in in app code |
| Observability | Structured JSON logs in `lib/observability.ts` only                                |

Package manager: **pnpm** (`packageManager` field in `package.json`).

## Known Documentation Drift

| Topic            | Code truth                                                          | Stale doc claim                                                         | Action                                                       |
| ---------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------ |
| Billing provider | Lemon Squeezy env vars in `.env.example`, `lib/billing.ts`          | `.github/workflows/ci.yml` still sets `PADDLE_*` placeholders           | Trust `.env.example` and billing modules; CI env is outdated |
| Product maturity | Real auth, Prisma, webhooks, billing boundaries                     | `archive/implementation/PRODUCTIZATION_PLAN.md` describes demo-only MVP | Historical only                                              |
| Launch blockers  | Many P0 fixes may be landed since review                            | `archive/reviews/LAUNCH_READINESS_REVIEW.md` (2026-05-02)               | Re-verify security claims in code before citing              |
| AI reviews       | Worker skips after guardrails: "model execution is not enabled yet" | Some ops docs imply live AI output                                      | Check `lib/jobs/pr-review-worker.ts`                         |
| Test command     | `pnpm exec vitest run tests` passes                                 | `pnpm test` also runs stale Paddle tests under `.claude/worktrees/`     | Prefer scoped test run until worktrees excluded              |
| Production auth  | `validateProductionEnv()` requires `BETTER_AUTH_API_KEY`            | `.env.example` lists it without "required in prod" emphasis             | Required in production per `lib/env.ts`                      |
| React Query      | `@tanstack/react-query` in dependencies                             | `features/DESIGN_SYSTEM.md` says unused                                 | Unused in app code; dependency may be removable later        |

## Source-of-Truth Map

| Area                 | Code truth                                                                                                                | Docs                                                  | Notes                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| Auth & sessions      | `lib/auth.ts`, `lib/auth/session.ts`, `lib/auth-client.ts`, `app/api/auth/[...all]/route.ts`, `proxy.ts`                  | `operations/SETUP.md`                                 | Better Auth Infra dash plugin uses `BETTER_AUTH_API_KEY` |
| Env validation       | `lib/env.ts`, `.env.example`                                                                                              | `operations/PRODUCTION_CHECKLIST.md`                  | Production throws on missing secrets                     |
| Data access          | `lib/data/app-data.ts`, `prisma/schema.prisma`                                                                            | `operations/SETUP.md`                                 | Demo fallback via `lib/demo-data.ts` when DB absent      |
| Risk scoring         | `lib/risk.ts`                                                                                                             | —                                                     | `tests/risk.test.ts`                                     |
| Test gaps            | `lib/test-gap.ts`                                                                                                         | —                                                     | `tests/test-gap.test.ts`                                 |
| Rules                | `lib/rules.ts`, `lib/rule-templates.ts`                                                                                   | —                                                     | `tests/rules.test.ts`                                    |
| Approvals            | `lib/approvals.ts`, `app/api/pull-requests/[id]/approval/`                                                                | `features/API.md`                                     | `tests/approvals.test.ts`                                |
| GitHub integration   | `lib/github.ts`, `lib/github-sync.ts`, `lib/github-webhooks.ts`, `app/api/github/**`                                      | `features/API.md`, `operations/OPERATIONS_RUNBOOK.md` | Webhook + job runner pattern                             |
| Billing              | `lib/billing.ts`, `lib/plans.ts`, `lib/lemon-squeezy-webhooks.ts`, `app/api/billing/**`, `app/api/lemon-squeezy/webhook/` | `features/API.md`                                     | Paddle fully removed from schema                         |
| Entitlements & usage | `lib/entitlements.ts`, `lib/usage.ts`                                                                                     | `operations/SETUP.md`                                 | Enforced server-side                                     |
| AI review            | `lib/ai/**`, `lib/jobs/pr-review-*.ts`, `app/api/jobs/pr-reviews/`                                                        | `features/API.md`, `operations/OPERATIONS_RUNBOOK.md` | Queue durable; execution disabled                        |
| Audit export         | `lib/audit-export.ts`, `app/api/audit-log/export/`                                                                        | `operations/PRIVACY_RETENTION_SUPPORT.md`             | `tests/audit-export.test.ts`                             |
| Email                | `lib/email.ts`                                                                                                            | `operations/PRODUCTION_CHECKLIST.md`                  | Resend; mock in dev without keys                         |
| Jobs & retention     | `lib/jobs/queue.ts`, `app/api/jobs/**`, `lib/retention.ts`                                                                | `operations/OPERATIONS_RUNBOOK.md`                    | Bearer `JOB_RUNNER_SECRET`                               |
| Diagnostics          | `lib/diagnostics.ts`, `app/api/diagnostics/route.ts`                                                                      | `features/API.md`                                     | Owner/admin only                                         |
| UI design            | `app/globals.css`, `components/ui/**`, `components/app/**`                                                                | `features/DESIGN_SYSTEM.md`                           | Tokens in CSS, not Tailwind theme file                   |
| Onboarding           | `lib/onboarding.ts`, `components/app/onboarding-checklist.tsx`                                                            | —                                                     | `tests/onboarding.test.ts`                               |

## Doc Status Guide

| Location                  | Purpose                                       | Status               |
| ------------------------- | --------------------------------------------- | -------------------- |
| `AGENT_START_HERE.md`     | Session entry point                           | `current`            |
| `README.md`               | Doc index                                     | `current`            |
| `features/`               | Feature/system reference (API, design system) | `current`            |
| `operations/`             | Setup, production, runbooks, privacy          | `current`            |
| `strategy/`               | Roadmap and deferred enterprise scope         | `current` (planning) |
| `archive/implementation/` | Shipped or superseded build plans             | `historical`         |
| `archive/reviews/`        | Point-in-time audits                          | `historical`         |
| `archive/ui/`             | UI revamp plans (mostly shipped)              | `historical`         |

Status labels to use when editing docs: `current`, `planned`, `shipped`, `historical`, `superseded`.

## Work Rules for Agents

- Read this file and task-specific **current** docs before coding.
- Trust **code** over docs; surface drift, update docs only when behavior changes durably.
- Keep diffs surgical; do not refactor unrelated code.
- Prefer pnpm; on Windows use `cmd` for shell commands when possible.
- Do not use linear gradient backgrounds unless requested; use design tokens from `app/globals.css`.
- Move completed plans and stale reviews to `archive/` — do not delete history.
- Next.js 16 APIs differ from training data — check `node_modules/next/dist/docs/` when unsure.

## Verification Commands

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm exec vitest run tests
pnpm format:check
pnpm build
git diff --check
```

CI (`.github/workflows/ci.yml`) also runs `pnpm audit --audit-level moderate`. Production build needs real or placeholder production env vars (see `tests/env.test.ts` and `lib/env.ts`).

Scoped checks by area:

```bash
pnpm exec vitest run tests/billing.test.ts tests/lemon-squeezy-webhooks.test.ts
pnpm exec vitest run tests/github-webhook.test.ts tests/github-sync.test.ts
pnpm exec vitest run tests/pr-review-lifecycle.test.ts tests/ai-review.test.ts
```

Database:

```bash
pnpm db:generate
pnpm db:migrate    # dev
pnpm db:seed
```

## Environment Variable Truth

Source: `.env.example` + `lib/env.ts` + module readers. `✓` = required in production.

| Variable                                    | Purpose                                               |
| ------------------------------------------- | ----------------------------------------------------- |
| `DATABASE_URL` ✓                            | PostgreSQL connection                                 |
| `BETTER_AUTH_SECRET` ✓                      | Auth signing secret                                   |
| `BETTER_AUTH_URL` ✓                         | Public app URL for auth                               |
| `BETTER_AUTH_API_KEY` ✓                     | Better Auth Infra dash plugin                         |
| `BETTER_AUTH_API_URL`                       | Better Auth Infra override                            |
| `BETTER_AUTH_KV_URL`                        | Better Auth Infra KV                                  |
| `AI_PROVIDER_ENCRYPTION_KEY`                | OpenRouter key encryption (falls back to auth secret) |
| `GITHUB_APP_ID` ✓                           | GitHub App                                            |
| `GITHUB_APP_SLUG` ✓                         | Install URL slug                                      |
| `GITHUB_APP_PRIVATE_KEY` ✓                  | App auth                                              |
| `GITHUB_WEBHOOK_SECRET` ✓                   | Webhook HMAC                                          |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | OAuth (if used)                                       |
| `LEMON_SQUEEZY_API_KEY`                     | Billing live mode                                     |
| `LEMON_SQUEEZY_STORE_ID`                    | Billing live mode                                     |
| `LEMON_SQUEEZY_WEBHOOK_SECRET`              | Subscription webhooks                                 |
| `LEMON_SQUEEZY_*_VARIANT_ID`                | Starter / Team / Growth plans                         |
| `EMAIL_FROM`                                | Transactional email                                   |
| `RESEND_API_KEY`                            | Resend delivery                                       |
| `JOB_RUNNER_SECRET`                         | Scheduled job bearer auth                             |
| `SUPPORT_EMAIL`                             | Support contact surface                               |
| `APP_VERSION`                               | Release label in logs                                 |

**Removed:** all `PADDLE_*` variables (legacy; migration `20260518173000_lemon_squeezy_billing`).

## Before Ending Task Checklist

- [ ] Behavior matches code truth above (not stale archive docs)
- [ ] Tests relevant to the change pass (`pnpm exec vitest run tests/...`)
- [ ] If routes, env vars, schema, billing, auth, or user-visible behavior changed → update the matching **current** doc
- [ ] If a plan shipped or a review is stale → move it under `archive/` and update `docs/README.md`
- [ ] Active Markdown links point to new paths under `docs/features|operations|strategy/`
- [ ] No secrets committed; `.env.example` updated if new env vars added
- [ ] `pnpm format:check` clean if Markdown or config formatting changed
