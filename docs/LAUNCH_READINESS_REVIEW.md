# AgentGate Launch Readiness Review

Review date: 2026-05-02

Implementation status: Phase 0 and Phase 1 fixes have been applied. Phase 2 has started with paid-launch configuration gates, transactional account recovery, aligned plan copy, and GitHub output entitlement enforcement.

## Executive Summary

AgentGate has moved beyond a static MVP. The current codebase includes Better Auth sign-in/sign-up, Prisma-backed multi-tenant models, organization-scoped read paths, GitHub App sync/webhook boundaries, persisted approvals, audit exports, Paddle checkout/webhook boundaries, plan entitlements, usage metering, and production-oriented docs.

The project is not ready for a public paid launch yet. It may be suitable for internal demos or a tightly controlled private pilot after the P0 security issues below are fixed. The biggest blockers are invite acceptance security, GitHub installation trust, missing CSRF protection, open redirect risk in auth callback handling, non-durable production controls, and operational gaps around observability, retention, billing lifecycle, and incident response.

Launch recommendation: **do not launch publicly until P0 and P1 items are addressed and verified in staging with real GitHub, PostgreSQL, Better Auth, and Paddle credentials.**

## Quality Checks Run

Commands run from the repository root:

- `pnpm lint`: passed.
- `pnpm typecheck`: passed after Prisma client generation.
- `pnpm test`: passed, 18 files and 70 tests.
- `pnpm build`: failed without production secrets because `BETTER_AUTH_SECRET` is required during production page-data collection.
- `pnpm build` with temporary placeholder `BETTER_AUTH_SECRET`, `GITHUB_WEBHOOK_SECRET`, and `DATABASE_URL`: passed.
- `pnpm audit --audit-level moderate`: failed with 2 moderate advisories:
  - `@hono/node-server <1.19.13`, via `prisma > @prisma/dev`, middleware bypass advisory `GHSA-92pp-h63x-v22m`.
  - `postcss <8.5.10`, via `next`, XSS advisory `GHSA-qx2v-qp2m-jg93`.

Build also warns that the Next.js `middleware` file convention is deprecated and should move to `proxy`.

## Review Scope

Reviewed:

- Product docs: `README.md`, `docs/README.md`, `docs/PRODUCTION_CHECKLIST.md`, `docs/PRODUCTIZATION_PLAN.md`, `docs/ENHANCEMENT_PLAN.md`, `docs/API.md`, `docs/PRIVACY_RETENTION_SUPPORT.md`, and `docs/ENTERPRISE_PLACEHOLDERS.md`.
- Security-sensitive modules: auth, middleware, rate limiting, security headers, GitHub webhooks/sync, Paddle webhooks, billing, diagnostics, team invites, approvals, audit exports, Prisma schema, and app data access.
- Product readiness surfaces: onboarding, dashboard, GitHub settings, billing, usage, team management, audit export, tests, build, and dependency audit.

Not reviewed:

- A live staging deployment.
- Browser-based UX flows against a running app.
- Real GitHub App, Paddle, email, or production database credentials.
- Infrastructure provider settings such as Vercel project config, database backups, DNS, WAF, or secret rotation.

## P0 Security Blockers

### 1. Invite Acceptance Is A State-Changing GET And The Token Is Not Bound To The Invite Email

Evidence:

- `app/api/team/invites/accept/route.ts` accepts invites via `GET`.
- The handler only requires a signed-in session and a valid token.
- It does not require `session.user.email` to match `invite.email`.
- It upserts membership and can update an existing member role based on the invite.
- `lib/data/app-data.ts` maps invite rows with the raw token and an accept URL.

Impact:

A leaked invite URL lets any signed-in user join the workspace as the invited role. Because it is a `GET`, link scanners, prefetchers, browser history sharing, or CSRF-like navigation can trigger acceptance. This is a launch-blocking tenant access-control issue.

Fix plan:

- Change invite acceptance to a confirmation page plus `POST`.
- Require the signed-in user's verified email to match the invite email, or explicitly implement an admin-approved transfer flow.
- Store only a hash of the invite token in the database.
- Mark tokens one-time-use and revoke older refreshed tokens.
- Add tests for wrong-email acceptance, expired token, revoked token, replayed token, and role escalation.

### 2. GitHub Installation Callback Trusts `installation_id` Without State Or Ownership Verification

Evidence:

- `app/api/github/installation/route.ts` reads `installation_id` from the URL and stores it on the current organization.
- There is no state nonce from the install link to bind the callback to the initiating organization/session.
- There is no verification that the current user owns or is allowed to connect that GitHub installation.

Impact:

If an attacker can supply or reuse a valid installation id, they may connect the wrong GitHub installation to a workspace. Because the app uses installation-authenticated Octokit calls, this risks cross-organization repository metadata exposure or destructive misconfiguration.

Fix plan:

- Generate and store a short-lived installation `state` nonce before redirecting to GitHub.
- Validate the callback `state` against the session and organization.
- After callback, verify the installation account id/login through GitHub before storing it.
- Store `githubAccountId` and `githubAccountLogin` together with `githubInstallationId`.
- Add tests for missing state, mismatched state, malformed installation id, and installation ownership mismatch.

### 3. Auth Callback Redirects Trust User-Controlled URLs

Evidence:

- `app/sign-in/page.tsx` and `app/sign-up/page.tsx` call `router.push(searchParams.get('callbackUrl') || '/dashboard')`.
- Middleware sets a relative callback URL, but a user can manually open `/sign-in?callbackUrl=...`.

Impact:

This can become an open redirect after successful sign-in/sign-up if `next/navigation` accepts absolute or protocol-relative URLs. Open redirects are often used in phishing and account takeover chains.

Fix plan:

- Normalize callback URLs with a helper that only permits same-origin relative paths beginning with a single `/`.
- Reject `//host`, `http://`, `https://`, backslash variants, and control characters.
- Use the same helper in middleware, GitHub callback redirects, invite redirects, sign-in, and sign-up.
- Add tests for safe and unsafe callback values.

### 4. Application Mutations Lack A Consistent CSRF Defense

Evidence:

- Many cookie-authenticated mutation routes accept form or JSON `POST` without CSRF tokens or Origin/Referer checks.
- Examples include team invites, team member changes, repository rules, approvals, comments, GitHub sync, webhook retry, billing checkout, and billing portal routes.
- The invite accept flow is currently a state-changing `GET`, which is worse than the `POST` routes.

Impact:

An attacker may be able to trigger state changes from another site if browser cookie settings or future auth cookie configuration allow it. Even with SameSite protections, high-impact SaaS settings should not rely only on browser defaults.

Fix plan:

- Add a shared mutation guard for non-webhook routes.
- Validate `Origin` against `BETTER_AUTH_URL` for browser mutations.
- Add a CSRF token for forms and JSON mutations.
- Exempt signed external webhooks that already use signature verification.
- Add route tests for missing/invalid Origin and missing/invalid CSRF token.

### 5. Production Environment Validation Exists But Is Not Invoked Globally

Evidence:

- `lib/env.ts` defines `validateProductionEnv`, but code search only found tests using it.
- `queryWithDemoFallback` returns fallback data immediately when there is no Prisma client, before checking `isProduction`.
- `pnpm build` fails without `BETTER_AUTH_SECRET`, but missing `DATABASE_URL` and `GITHUB_WEBHOOK_SECRET` are not validated by one central startup guard.

Impact:

The docs say production fails closed for missing required secrets. The implementation partly enforces this through individual code paths, but not as a single invariant. A misconfigured deployment could start with partial functionality, confusing diagnostics, or demo fallback behavior in places where production should hard fail.

Fix plan:

- Call `validateProductionEnv()` from a module imported by app startup, route handlers, and build/runtime entry points.
- Change `queryWithDemoFallback` so missing Prisma in production throws instead of falling back.
- Add a CI build mode that injects safe placeholder secrets or runs an explicit config-validation test separately.
- Add tests for production missing `DATABASE_URL` and production data fallback behavior.

## P1 Security And Compliance Risks

### 6. Rate Limiting Is In-Memory And Trusts Forwarded IP Headers Directly

Evidence:

- `lib/rate-limit.ts` stores buckets in a process-local `Map`.
- `middleware.ts` uses `x-forwarded-for` or `x-real-ip` directly.

Impact:

This does not work reliably across serverless instances or multiple Node workers. It can be bypassed by instance hopping and may be spoofable unless the deployment proxy reliably overwrites forwarded headers.

Fix plan:

- Move rate limiting to a shared store such as Redis, Upstash, Vercel KV, or a managed edge rate limiter.
- Use provider-trusted client IP extraction.
- Keep separate budgets for auth, webhook, export, and expensive sync routes.
- Add telemetry for rate-limit hits.

### 7. Security Headers Are Missing CSP

Evidence:

- `lib/security.ts` sets `X-Content-Type-Options`, `X-Frame-Options`, referrer policy, permissions policy, COOP, CORP, and HSTS in production.
- No Content Security Policy is configured.

Impact:

The current app escapes React-rendered content by default, but review notes, repository metadata, PR titles, and future integrations are attacker-controlled surfaces. CSP reduces the blast radius of XSS and third-party script mistakes.

Fix plan:

- Add a production CSP compatible with Next.js and the app's font/script requirements.
- Start in report-only mode in staging, then enforce.
- Avoid broad `unsafe-inline` except where required and justified.

### 8. Raw GitHub Webhook Bodies Are Stored In Database Metadata

Evidence:

- `lib/github-webhooks.ts` stores `rawBody` inside `GitHubWebhookDelivery.metadata`.

Impact:

Webhook payloads can contain private repository metadata, PR titles, branch names, usernames, comments, and other customer-confidential data. Storing raw payloads indefinitely increases privacy, retention, database bloat, and breach impact.

Fix plan:

- Store only minimal delivery metadata by default.
- If raw payload retention is needed for debugging, encrypt it, redact it, and expire it quickly.
- Add a retention cleanup job for webhook deliveries and audit exports.
- Update privacy docs with exact retention windows.

### 9. Public Health Endpoint Reveals Operational Detail

Evidence:

- `app/api/health/route.ts` is public and returns diagnostic checks plus release/environment context.
- `docs/API.md` documents `GET /api/health` as public.

Impact:

Public health details can reveal which dependencies are configured or broken. This is usually acceptable for a simple liveness endpoint, but detailed readiness should be internal.

Fix plan:

- Keep `/api/health` as minimal liveness: `{ status: "ok" }`.
- Move dependency checks to `/api/diagnostics`, which is already owner/admin gated.
- For infrastructure readiness, use a separate protected endpoint or platform health check.

### 10. Dependency Audit Has Moderate Vulnerabilities

Evidence:

- `pnpm audit --audit-level moderate` reports vulnerabilities in transitive `@hono/node-server` and `postcss`.

Impact:

The `@hono/node-server` advisory appears through Prisma development tooling, while `postcss` appears through Next. The runtime exposure should be assessed, but unresolved audit findings are not acceptable for a launch checklist.

Fix plan:

- Upgrade Prisma and Next/PostCSS when patched versions are available.
- If upstream packages lag, use a documented `pnpm` override only after checking compatibility.
- Add `pnpm audit --audit-level moderate` or equivalent to CI.

## P1 Product Readiness Blockers

### 11. No Email Verification Or Password Recovery Flow Is Documented

Status: Fixed in Phase 2 for email/password accounts by configuring Better Auth verification and reset email callbacks, adding `/forgot-password` and `/reset-password`, and requiring transactional email configuration in production.

Evidence:

- Sign-up enables email/password auth and creates a workspace after sign-up.
- Docs mention sign-up/sign-in, but not email verification, password reset, email provider setup, or anti-abuse controls.

Impact:

For public self-serve launch, users need email verification, password reset, and basic abuse controls. Without this, workspace ownership and support recovery are weak.

Fix plan:

- Configure verified email flow before workspace creation or before sensitive actions.
- Add password reset and account recovery.
- Add sign-up throttling and optional invite-only/private beta mode.
- Document auth email provider requirements.

### 12. GitHub Processing Is Not A Durable Background Job System

Evidence:

- `app/api/github/webhook/route.ts` enqueues a DB record and uses Next `after()` to process one delivery.
- Manual retry exists through `/api/github/webhook/retry`.
- There is no separate worker, queue service, cron processor, dead-letter process, or alerting.

Impact:

This is a good pilot scaffold, but launch traffic needs durable retries, visibility, and alerting. Webhook events are the product's system of record; losing or delaying them directly breaks customer trust.

Fix plan:

- Introduce a real queue/worker or scheduled job processor.
- Make webhook handlers acknowledge quickly and process out of band.
- Add retry backoff, dead-letter states, and alerts.
- Add integration tests for duplicate, failed, retried, and out-of-order webhooks.

### 13. PR Resync Can Overwrite Approval State

Evidence:

- `lib/github-sync.ts` recomputes `approvalStatus` during PR sync.
- The upsert update path writes `approvalStatus` based on current risk/rules.

Impact:

An already approved or risk-accepted PR can be moved back to pending on resync, or a rejected PR can lose its decision-derived status. The audit trail remains, but the current state can become misleading.

Fix plan:

- Derive current approval status from durable approval decisions plus current rule requirements.
- Preserve explicit reviewer decisions until invalidated by a meaningful PR change such as new head SHA.
- When head SHA changes after approval, record an audit event explaining why reapproval is required.
- Add regression tests for approve, resync same SHA, resync new SHA, reject, and risk accept.

### 14. Usage Metering Can Overcount Resyncs

Evidence:

- `recordPrChecks` is called for every successful `syncGitHubPullRequestRecord`.
- Duplicate webhook delivery dedupe exists, but ordinary PR updates, manual syncs, and backfills can count the same PR repeatedly.

Impact:

Customers can be charged or limited based on sync mechanics rather than meaningful PR checks. This will create billing disputes and bad activation experiences.

Fix plan:

- Define what counts as a billable PR check.
- Deduplicate by organization, repository, PR number, head SHA, and period.
- Show billable usage events in diagnostics.
- Add tests for duplicate delivery, manual resync, new commit SHA, and monthly boundary behavior.

### 15. Paddle Webhooks Are Not Idempotent By Event Id

Evidence:

- `lib/paddle-webhooks.ts` processes subscription events and writes audit events.
- There is no persisted Paddle event id table or dedupe check.

Impact:

Repeated Paddle webhook delivery can duplicate audit events and may apply stale subscription data. Billing lifecycle code must be idempotent before charging customers.

Fix plan:

- Add a `PaddleWebhookEvent` or generic `ExternalWebhookDelivery` table.
- Store `eventId`, event type, status, processed timestamp, and errors.
- Ignore already processed event ids.
- Add tests for replayed events and out-of-order subscription changes.

### 16. Billing And Plan Copy Are Inconsistent

Status: Fixed in Phase 2 by aligning Starter copy with entitlements, documenting billing portal configuration, and requiring paid-launch billing environment variables in production.

Evidence:

- `lib/plans.ts` says Starter includes "Basic custom rules".
- `lib/entitlements.ts` sets `starter.features.customRules` to `false`.
- `PADDLE_CUSTOMER_PORTAL_URL` is used in `lib/billing.ts` but is missing from `.env.example`.

Impact:

Plan mismatch creates customer confusion and support load. Missing environment documentation can break billing portal setup.

Fix plan:

- Align plan marketing copy, entitlements, UI disabled states, and docs.
- Add `PADDLE_CUSTOMER_PORTAL_URL` to `.env.example` and production checklist.
- Add tests for plan-gated routes and visible plan features.

### 17. GitHub Check Runs Are Published During Sync Without Plan Gating

Status: Fixed in Phase 2 by gating sync-time check-run publishing behind the GitHub output entitlement.

Evidence:

- `lib/github-sync.ts` publishes an AgentGate check run after PR sync.
- Approval route gates GitHub comments/check output by `githubComments`, but the sync path does not check a plan feature first.

Impact:

Free or lower-tier workspaces may receive GitHub output that pricing/entitlements say they should not have. This also risks noisy check-run spam before customers can configure output preferences.

Fix plan:

- Add an explicit `githubChecks` or `githubOutput` entitlement.
- Gate sync-time check run publishing by plan and repository settings.
- Make comments/check runs configurable per repository.
- Add tests for free, starter, team, and growth output behavior.

### 18. Audit Retention Is Filtered But Not Enforced As Data Lifecycle

Evidence:

- `getAuditRetentionStart` is used for exports and review packets.
- There is no cleanup/archive job for old audit events, audit exports, webhook deliveries, or usage records.

Impact:

The UI may respect retention windows, but the database can still retain data longer than promised. That is a compliance and trust issue.

Fix plan:

- Add retention jobs per data type and plan.
- Document exact retention behavior for audit events, exports, webhook payloads, and billing records.
- Add admin diagnostics for next retention run and deleted counts.

### 19. Observability Is Console-Only

Evidence:

- `lib/observability.ts` writes JSON lines to `console`.
- There is no configured error tracking, alerting, metrics backend, uptime monitor, or incident runbook.

Impact:

For launch, support needs to answer why a webhook, sync, approval, billing event, or export failed. Console logs alone are not enough.

Fix plan:

- Add error tracking with release/environment context.
- Add metrics for webhook volume/failures, sync latency, GitHub API errors, PR checks, approvals, billing events, and export failures.
- Add alert thresholds and an incident response runbook.
- Add a support-facing diagnostics checklist.

### 20. Support And Legal Readiness Are Placeholders

Status: Partially fixed in Phase 2 by replacing the placeholder support mailbox with required `SUPPORT_EMAIL` configuration and documenting response-target expectations. Terms, Privacy Policy, DPA posture, subprocessors, backup/restore policy, and deletion process still need final business/legal review.

Evidence:

- `docs/PRIVACY_RETENTION_SUPPORT.md` uses `support@agentgate.local`.
- The docs do not include production Terms, Privacy Policy, DPA posture, subprocessors, backup/restore policy, deletion process, or security contact.

Impact:

This blocks public paid launch and most serious pilots.

Fix plan:

- Replace placeholder support contact with a monitored mailbox.
- Add response targets for billing, security, and operational incidents.
- Publish privacy/terms and a basic data deletion/export process.
- Document subprocessors: hosting, database, GitHub, Paddle, email provider, observability provider.

## P2 Readiness Improvements

- Migrate Next.js `middleware.ts` to the new `proxy` convention to remove the build warning and stay aligned with Next.js 16.
- Add browser/E2E tests for sign-up, sign-in, GitHub installation callback, repository sync, approval decision, audit export, billing checkout, team invite, and role changes.
- Add configurable AI attribution instead of relying only on author/title/branch heuristics.
- Add repository-level settings for GitHub comments/check runs and noise control.
- Add staging seed and smoke-test scripts that run against a real database.
- Add database backup/restore documentation and verify restore in staging.
- Add explicit abuse controls for public sign-up: rate limits, CAPTCHA or email challenge if needed, and invite-only beta mode.
- Reduce public diagnostics detail and ensure logs never include secrets, invite tokens, raw webhook payloads, or full stack traces in customer-visible responses.

## Prioritized Fix Plan

### Phase 0: Launch Gate Security Fixes

Goal: remove access-control and auth-flow risks that block any external pilot.

Tasks:

1. Rework invite acceptance to POST, bind token to verified email, hash invite tokens, and add replay/expiry tests.
2. Add GitHub installation state validation and installation ownership verification.
3. Add safe callback URL normalization for sign-in, sign-up, middleware, and invite/GitHub redirects.
4. Add shared CSRF/Origin protection for browser mutation routes.
5. Invoke production environment validation globally and prevent production demo fallback.

Verification:

- Add focused route/unit tests for each security fix.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm audit --audit-level moderate`.
- Manually test sign-up, sign-in, invite acceptance, and GitHub installation callback in staging.

### Phase 1: Reliable Pilot Operations

Goal: make the GitHub-to-approval workflow trustworthy for a small private pilot.

Tasks:

1. Move webhook processing to a durable queue or scheduled worker.
2. Make approval status derivation resilient to PR resync and new head SHAs.
3. Fix usage metering semantics and dedupe billable checks.
4. Add Paddle webhook idempotency.
5. Add production observability, alerting, and support diagnostics.
6. Add retention cleanup for webhook payloads and audit data.

Verification:

- Replay duplicate GitHub and Paddle webhooks in staging.
- Confirm approved PRs preserve state across same-SHA resyncs and require reapproval after new commits.
- Confirm failed jobs retry and alert.
- Confirm audit retention removes or archives data according to plan.

### Phase 2: Paid Launch Readiness

Goal: prepare for charging customers.

Tasks:

1. Align pricing copy, plan entitlements, GitHub output gates, and billing docs.
2. Add email verification, password reset, and account recovery.
3. Replace support/legal placeholders with production policies and contacts.
4. Add E2E coverage for the full customer activation path.
5. Resolve dependency audit advisories through upgrades or documented overrides.
6. Migrate deprecated Next.js middleware to proxy.

Verification:

- Run a staging checkout and subscription lifecycle test with Paddle sandbox.
- Verify free, starter, team, growth, and enterprise plan gates.
- Complete a restore drill from a database backup.
- Run launch smoke tests against a production-like environment.

## Launch Checklist

Required before private pilot:

- [ ] P0 security fixes complete.
- [ ] Real production-like PostgreSQL database with migrations applied.
- [ ] Better Auth secret and URL configured.
- [ ] GitHub App credentials, webhook secret, callback URL, and permissions verified.
- [ ] Invite flow verified against wrong-user, replay, and expired-token scenarios.
- [ ] Webhook processing retries visible in diagnostics.
- [ ] Error tracking and alerting configured.
- [x] Support mailbox configuration required; monitor and escalation ownership still need operational confirmation.

Required before public paid launch:

- [ ] P1 product readiness blockers complete.
- [ ] Paddle checkout, portal, and webhook lifecycle tested in sandbox and live mode.
- [x] Plan entitlements match UI/docs/pricing.
- [ ] Audit retention cleanup implemented and documented.
- [x] Email verification and password recovery enabled.
- [ ] Dependency audit passes or has approved documented exceptions.
- [ ] E2E activation path passes in CI.
- [ ] Terms, privacy, security contact, data deletion/export, and subprocessors documented.
- [ ] Backup restore drill completed.

## Suggested Next Implementation Order

1. Fix invite acceptance.
2. Fix auth callback URL normalization.
3. Add CSRF/Origin guard.
4. Fix GitHub installation state and ownership verification.
5. Enforce production env validation and no production demo fallback.
6. Resolve approval-state overwrite on PR resync.
7. Make usage and Paddle webhooks idempotent.
8. Add durable job processing and observability.
9. Align billing/plan docs and gates.
10. Add E2E launch smoke tests.

