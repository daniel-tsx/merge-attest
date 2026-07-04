# Playbook: Security & Access Review

**Status:** `current` (2026-07-04)
**Framing:** this is a **defensive review** — access-control review, ownership validation, server-side authorization, webhook integrity, rate-limit review, private-data protection, and negative-path authorization tests. No offensive testing, no destructive verification, no production targets. Findings are reported with severity and fixed defensively.

## Read First

`docs/SYSTEM_DESIGN.md` (security model + tenancy), `docs/architecture/security-architecture.html` and `authentication-architecture.html`, `docs/features/ADMIN.md` (the cross-tenant boundary), `docs/features/API.md` (endpoint auth expectations), `proxy.ts`, `lib/env.ts`.

## The Trust Model (verify, don't assume)

- **Edge gate:** `proxy.ts` — session cookie required outside `publicAppPaths` (`lib/site.ts`), rate limits, CSRF on mutations.
- **Tenancy:** all app reads flow through `lib/data/app-data.ts`, scoped to the caller's org. `lib/admin/admin-data.ts` is the **only** legitimate cross-org reader, gated by the `ADMIN_EMAILS` allowlist re-checked in every admin action.
- **Roles:** `lib/collaboration.ts` — owner/admin/member checks in server actions; invites expire.
- **Machine auth:** GitHub webhook HMAC (`GITHUB_WEBHOOK_SECRET`), Lemon Squeezy webhook signature, job routes bearer `JOB_RUNNER_SECRET`.
- **Entitlements:** `lib/entitlements.ts` + `lib/usage.ts`, enforced server-side.
- **Secrets:** OpenRouter BYOK keys encrypted (`AI_PROVIDER_ENCRYPTION_KEY`); prod env fails closed (`lib/env.ts`).

## Review Areas & Negative-Path Tests

For each area: read the enforcement point, then write/verify a test that the **rejection** happens. Existing negative-path coverage lives in `tests/admin-access.test.ts`, `tests/collaboration.test.ts`, `tests/entitlements.test.ts`, `tests/github-webhook.test.ts` — extend those patterns.

1. **Cross-org isolation:** as a member of org A, request org B's PR, repository, report, export, invite, and settings — expect not-found/forbidden on every path (pages, server actions, API routes, exports).
2. **Role escalation paths:** member attempts owner/admin-only actions (team management, rule deletion, billing surface, agent registry) — expect rejection server-side, not just hidden UI.
3. **Admin boundary:** non-allowlisted user hits `/admin` pages and admin server actions directly; verify every action re-checks the allowlist (not only the layout).
4. **Webhook integrity:** unsigned/mis-signed GitHub and Lemon Squeezy payloads rejected; replayed deliveries idempotent (delivery queue semantics).
5. **Job routes:** missing/wrong bearer token rejected on all three `/api/jobs/*` routes.
6. **Export endpoints:** review packet, authorship export, audit-log export require session + org membership — these carry the most sensitive aggregated data.
7. **Rate limits & CSRF:** confirm `proxy.ts` coverage for new mutation routes added since the last review.
8. **Data minimization:** confirm no full source files stored (metadata + changed paths only, per `PRIVACY_RETENTION_SUPPORT.md`); no secrets in logs (`lib/observability.ts` output).
9. **Demo-mode boundary:** demo fallback activates only without `DATABASE_URL` in dev; production fails closed.

## Method

Inventory new/changed surfaces since the last review (git log on `app/api/`, `actions.ts` files, `lib/admin/`) → trace each to its enforcement point → write negative-path tests where missing → fix gaps defensively (add the server-side check; never weaken an existing one) → report.

## Severity

P0 cross-tenant data exposure or auth bypass · P1 missing server-side check with real data behind it · P2 defense-in-depth gap (e.g., missing rate limit) · P3 hardening nice-to-have.

## Verify

```bash
pnpm exec vitest run tests/admin-access.test.ts tests/collaboration.test.ts tests/entitlements.test.ts tests/github-webhook.test.ts tests/lemon-squeezy-webhooks.test.ts
pnpm lint && pnpm typecheck && pnpm test
```

## Output

Findings table (area, severity, evidence file:line, fix or recommendation), tests added, explicitly state what was **not** reviewed. Never include exploit-style reproduction beyond the failing negative-path test. Per `docs/agent-prompts/handoff-after-major-task.md`.
