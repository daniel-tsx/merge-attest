# AgentGate

AgentGate is a SaaS MVP control center for engineering teams using AI coding agents. It monitors AI-assisted pull requests, scores risky changes, detects missing tests, evaluates lightweight repository rules, records approvals, and keeps an audit trail before code reaches production.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS v4 with shadcn-style local UI primitives
- PostgreSQL with Prisma ORM
- BetterAuth integration route placeholder
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

## Database

Set `DATABASE_URL` to a PostgreSQL database, then run:

```bash
pnpm db:migrate
pnpm db:seed
```

If you do not have local Postgres installed, create a database first and update `.env` with its connection string.

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
- `lib/billing.ts` and `lib/plans.ts`: Paddle client boundary and plan gates.
- `prisma/schema.prisma`: multi-tenant schema where business entities belong to an organization.
- `prisma/seed.ts`: seeds one organization, three users, four repositories, twenty pull requests, risk signals, test gap analyses, rules, approvals, audit events, and usage records.

Future integration points are intentionally narrow: replace `lib/demo-data.ts` reads with Prisma queries, persist approval actions as `Approval` and `AuditEvent` records, and call `syncPullRequests` from scheduled jobs or webhook handlers.
