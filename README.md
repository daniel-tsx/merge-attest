# AgentGate

AgentGate is a SaaS MVP control center for engineering teams using AI coding agents. It monitors AI-assisted pull requests, scores risky changes, detects missing tests, evaluates lightweight repository rules, records approvals, and keeps an audit trail before code reaches production.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS v4 with shadcn-style local UI primitives
- PostgreSQL with Prisma ORM
- Better Auth with Prisma-backed user, account, session, and verification tables
- Octokit GitHub App service boundary
- Paddle billing service boundary
- React Hook Form and Zod dependencies for validated forms
- Recharts dashboards
- Vitest unit tests

## Setup

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm dev
```

The app runs with seeded demo data in the UI even when GitHub, Paddle, and PostgreSQL credentials are missing.

## Production Safety

Production deployments must provide `BETTER_AUTH_SECRET` and `GITHUB_WEBHOOK_SECRET`. Local development still supports demo mode, but production fails closed for missing auth and webhook secrets.

The demo GitHub comment helper at `/api/github/comment` is POST-only and disabled in production until it is replaced by an authenticated, organization-scoped approval or comment workflow.

Authenticated app access is available through `/sign-up` and `/sign-in`. When PostgreSQL is configured, new users are provisioned with a default free organization workspace. In production, app pages redirect unauthenticated users to `/sign-in`.

GitHub App setup uses `GITHUB_APP_SLUG` to link to the installation screen. Configure the app's setup callback URL to `/api/github/installation`; the callback stores `installation_id` on the current organization. Repository sync can then be triggered from `/settings/github`, `/repositories`, or a repository detail page.

The GitHub webhook endpoint at `/api/github/webhook` verifies signatures, records delivery ids for idempotency, resolves the organization from `installation.id`, and processes pull request plus installation repository events through the sync pipeline.

Approval decisions on pull request detail pages are persisted through `/api/pull-requests/[id]/approval`, update the pull request approval status, write audit events, and post a GitHub comment when live installation credentials are available.

Plan entitlements are defined in `lib/entitlements.ts` and enforced in server paths. GitHub sync records monthly `pr_checks` usage and stops processing new checks or repositories when the current plan limit is reached.

Paddle checkout starts at `/api/billing/checkout` when `PADDLE_API_KEY` and the relevant `PADDLE_*_PRICE_ID` variables are configured. Paddle webhooks are accepted at `/api/paddle/webhook`, verified with `PADDLE_WEBHOOK_SECRET`, and update organization subscription fields plus `planKey`.

The dashboard includes a first-run onboarding checklist that guides new organizations from workspace creation to GitHub installation, repository sync, and first pull request review. Repository empty states now point users to the next required setup action.

## Database

Set `DATABASE_URL` to a PostgreSQL database, then run:

```bash
pnpm db:migrate
pnpm db:seed
```

If you do not have local Postgres installed, create a database first and update `.env` with its connection string.

The initial Prisma migration is committed under `prisma/migrations`, along with the Better Auth session/account migration. Server-side repository and pull request pages now read through an organization-scoped Prisma data layer when `DATABASE_URL` is available. In local development, failed or missing database connections fall back to demo data so the MVP UI remains usable; production deployments require a working `DATABASE_URL`.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Key Routes

- `/dashboard`
- `/repositories`
- `/repositories/[id]`
- `/repositories/[id]/rules`
- `/pull-requests`
- `/pull-requests/[id]`
- `/activity`
- `/approvals`
- `/audit-log`
- `/settings`
- `/settings/team`
- `/settings/github`
- `/settings/billing`
- `/settings/usage`

## Architecture Notes

- `lib/risk.ts`: deterministic risk scoring and risk level mapping.
- `lib/test-gap.ts`: deterministic test gap detector with path-based suggestions.
- `lib/rules.ts`: repository rule evaluator.
- `lib/demo-data.ts`: realistic MVP data used by the UI and seed script.
- `lib/github.ts`: GitHub App integration boundary. It uses Octokit when app credentials and installation data exist, otherwise returns demo-mode responses.
- `lib/github-sync.ts`: GitHub repository and pull request import pipeline for installation-backed sync.
- `lib/github-webhooks.ts`: GitHub webhook delivery parsing, dedupe, and event dispatch.
- `lib/approvals.ts`: approval decision validation and status/audit mapping.
- `lib/billing.ts` and `lib/plans.ts`: Paddle client boundary and plan gates.
- `lib/entitlements.ts` and `lib/usage.ts`: numeric plan limits and monthly PR check metering.
- `lib/paddle-webhooks.ts`: Paddle webhook verification helpers and subscription-to-plan mapping.
- `lib/onboarding.ts`: self-serve setup checklist state for dashboard onboarding.
- `prisma/schema.prisma`: multi-tenant schema where business entities belong to an organization.
- `prisma/seed.ts`: seeds one organization, three users, four repositories, twenty pull requests, risk signals, test gap analyses, rules, approvals, audit events, and usage records.

Future integration points are intentionally narrow: replace `lib/demo-data.ts` reads with Prisma queries, persist approval actions as `Approval` and `AuditEvent` records, and call `syncPullRequests` from scheduled jobs or webhook handlers.
