# Setup and Architecture

**Status:** `current`
**Last verified:** 2026-05-31

Agent onboarding entry: `docs/AGENT_START_HERE.md`

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS v4 with shadcn-style local UI primitives
- nuqs for typed URL state on filterable App Router pages
- PostgreSQL with Prisma ORM
- Better Auth with Prisma-backed user, account, session, and verification tables
- Octokit GitHub App service boundary
- OpenRouter BYOK AI review provider boundary
- Lemon Squeezy billing service boundary
- React Hook Form and Zod for validated forms
- Recharts dashboards
- Vitest unit tests

## Local Setup

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm dev
```

The app runs with seeded demo data in the UI when GitHub, Lemon Squeezy, and PostgreSQL credentials are missing. Production deployments should use real PostgreSQL, Better Auth, GitHub App, Lemon Squeezy, transactional email, and support credentials.

## Production Safety

Production deployments must provide database, Better Auth, GitHub App, Lemon Squeezy, job runner, transactional email, and support environment variables. Local development still supports demo mode, but production fails closed for missing launch-critical configuration.

Authenticated app access is available through `/sign-up` and `/sign-in`. Password reset is available through `/forgot-password` and `/reset-password`, and production sign-up requires transactional email for verification. When PostgreSQL is configured, new users are provisioned with a default free organization workspace. In production, app pages redirect unauthenticated users to `/sign-in`.

GitHub App setup uses `GITHUB_APP_SLUG` to link to the installation screen. Configure the app's setup callback URL to `/api/github/installation`; the callback stores `installation_id` on the current organization. Repository sync can then be triggered from `/settings/github`, `/repositories`, or a repository detail page.

The GitHub webhook endpoint at `/api/github/webhook` verifies signatures, records delivery ids for idempotency, resolves the organization from `installation.id`, and processes pull request plus installation repository events through the sync pipeline.

Approval decisions on pull request detail pages are persisted through `/api/pull-requests/[id]/approval`, update the pull request approval status, write audit events, and post GitHub comments/check runs when live installation credentials and plan entitlements are available.

Plan entitlements are defined in `lib/entitlements.ts` and enforced in server paths. GitHub sync records monthly `pr_checks` usage, stops processing new checks or repositories when the current plan limit is reached, and only publishes GitHub check runs for plans with GitHub output enabled.

Lemon Squeezy checkout starts at `/api/billing/checkout` when `LEMON_SQUEEZY_API_KEY`, `LEMON_SQUEEZY_STORE_ID`, and the relevant `LEMON_SQUEEZY_*_VARIANT_ID` variables are configured. Lemon Squeezy webhooks are accepted at `/api/lemon-squeezy/webhook`, verified with `LEMON_SQUEEZY_WEBHOOK_SECRET`, and update organization subscription fields plus `planKey`.

The Lemon Squeezy migration intentionally starts new Lemon Squeezy customer and subscription fields empty rather than reusing old Paddle identifiers. If a database has live Paddle subscribers, migrate those customers and subscriptions through Lemon Squeezy first, then backfill the resulting Lemon Squeezy ids before relying on customer portal access or webhook-only entitlement sync.

The dashboard includes a first-run onboarding checklist that guides new organizations from workspace creation to GitHub installation, repository sync, and first pull request review. Repository empty states point users to the next required setup action.

Audit exports are available at `/api/audit-log/export` for plans with the `auditExport` entitlement. The export returns CSV within the organization's current retention window, with unlimited retention for Enterprise.

AI pull request reviews are available as an advisory review layer. Repository AI review settings are disabled by default and can be configured at `/repositories/[id]/ai`; organization OpenRouter keys are stored from `/settings/ai` using encrypted credential storage. The current worker has durable lifecycle, diff filtering, validation, and GitHub output boundaries in place, but real model execution is intentionally not enabled yet.

Operational jobs and incident checks are documented in `operations/OPERATIONS_RUNBOOK.md`.

## Database

Set `DATABASE_URL` to a PostgreSQL database, then run:

```bash
pnpm db:migrate
pnpm db:seed
```

If you do not have local Postgres installed, create a database first and update `.env` with its connection string.

The initial Prisma migration is committed under `prisma/migrations`, along with the Better Auth session/account migration. Server-side repository and pull request pages read through an organization-scoped Prisma data layer when `DATABASE_URL` is available. In local development, failed or missing database connections fall back to demo data so the MVP UI remains usable; production deployments require a working `DATABASE_URL`.

For existing deployments, apply migrations with `pnpm prisma migrate deploy`. The `20260518173000_lemon_squeezy_billing` migration removes the legacy Paddle billing columns and webhook table, adds Lemon Squeezy billing identifiers, and creates the provider-neutral `BillingWebhookEvent` table used for webhook idempotency.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm exec vitest run tests
pnpm build
```

## Key Routes

- `/dashboard`
- `/forgot-password`
- `/reset-password`
- `/repositories`
- `/repositories/[id]`
- `/repositories/[id]/ai`
- `/repositories/[id]/rules`
- `/pull-requests`
- `/pull-requests/[id]`
- `/activity`
- `/approvals`
- `/audit-log`
- `/settings`
- `/settings/team`
- `/settings/github`
- `/settings/ai`
- `/settings/billing`
- `/settings/usage`

## Architecture Notes

- `lib/risk.ts`: deterministic risk scoring and risk level mapping.
- `lib/test-gap.ts`: deterministic test gap detector with path-based suggestions.
- `lib/rules.ts`: repository rule evaluator.
- `lib/data/app-data.ts`: organization-scoped data access with local demo fallback.
- `lib/demo-data.ts`: realistic MVP data used by the local UI fallback and seed script.
- `lib/auth.ts` and `lib/auth/session.ts`: Better Auth configuration, session lookup, and organization provisioning.
- `lib/email.ts`: Resend-backed transactional email boundary for verification and password reset.
- `lib/github.ts`: GitHub App integration boundary. It uses Octokit when app credentials and installation data exist, otherwise returns demo-mode responses.
- `lib/github-sync.ts`: GitHub repository and pull request import pipeline for installation-backed sync.
- `lib/github-webhooks.ts`: GitHub webhook delivery parsing, dedupe, and event dispatch.
- `lib/jobs/pr-review-lifecycle.ts` and `lib/jobs/pr-review-worker.ts`: durable AI pull request review lifecycle, idempotency, and worker orchestration.
- `lib/ai/credentials.ts`, `lib/ai/openrouter.ts`, `lib/ai/settings.ts`, and `lib/ai/review.ts`: encrypted OpenRouter BYOK storage, key verification, repository AI review settings, and AI response validation.
- `lib/github/diff.ts` and `lib/github/output.ts`: PR diff filtering, changed-line validation support, managed AI review comments, inline review publishing, and advisory check-run output.
- `lib/approvals.ts`: approval decision validation and status/audit mapping.
- `lib/billing.ts` and `lib/plans.ts`: Lemon Squeezy checkout/customer portal boundary and plan metadata.
- `lib/entitlements.ts` and `lib/usage.ts`: numeric plan limits and monthly PR check metering.
- `lib/lemon-squeezy-webhooks.ts`: Lemon Squeezy webhook verification helpers and subscription-to-plan mapping.
- `lib/onboarding.ts`: self-serve setup checklist state for dashboard onboarding.
- `lib/audit-export.ts`: compliance-oriented audit retention windows and CSV serialization.
- `prisma/schema.prisma`: multi-tenant schema where business entities belong to an organization.
- `prisma/seed.ts`: seeds one organization, three users, four repositories, twenty pull requests, risk signals, test gap analyses, rules, approvals, audit events, and usage records.
- `proxy.ts`: auth gate, rate limiting, CSRF checks on mutations, security headers.

## Related Docs

- System design and UI layers: [`../SYSTEM_DESIGN.md`](../SYSTEM_DESIGN.md)
- API reference: `features/API.md`
- Production checklist: `operations/PRODUCTION_CHECKLIST.md`
- Active roadmap: `strategy/ENHANCEMENT_PLAN.md`
