# AgentGate Enhancement Plan

Last reviewed: 2026-05-02

## 1. Product Goal

AgentGate should become a GitHub-native operating layer for teams that ship AI-assisted code. The product should help a team connect repositories, detect risky AI-generated or AI-assisted pull requests, request the right review, record decisions, and prove what happened later through audit and reporting.

The current project is past a pure MVP. It already has real application foundations: authenticated workspaces, organization-scoped data access, Prisma-backed models, GitHub App boundaries, webhook handling, approval persistence, plan entitlements, usage metering, Paddle checkout/webhook boundaries, onboarding states, and audit export. The next phase should focus on replacing the remaining demo surfaces, making GitHub processing production-grade, and adding collaboration features that make the product feel like a real business workflow rather than a dashboard demo.

## 2. Current Baseline

Implemented strengths:

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, and local UI primitives.
- Better Auth sign-up and sign-in with Prisma-backed users, sessions, accounts, and verification records.
- Automatic default organization creation for new authenticated users.
- Middleware that protects app pages in production while preserving local demo mode without Postgres.
- Multi-tenant Prisma schema for organizations, members, repositories, pull requests, files, risk signals, test gaps, rules, approvals, activity, audit events, usage records, API keys, plans, and GitHub webhook deliveries.
- Organization-scoped data access in `lib/data/app-data.ts` for repositories, pull requests, repository rules, and audit events.
- GitHub App installation callback, manual repository sync, pull request sync, webhook signature verification, delivery dedupe, and pull request event processing.
- Deterministic risk scoring, test-gap detection, and repository rule evaluation.
- Persisted approval decisions with role checks, plan checks, audit events, and optional GitHub comments.
- Plan entitlements and usage metering for repository limits, monthly PR checks, approval workflows, GitHub comments, custom rules, and audit export.
- Paddle checkout and subscription webhook processing boundaries.
- Dashboard onboarding checklist, repository empty states, billing/usage/settings pages, and audit CSV export.
- Focused Vitest coverage for at least audit export behavior, with existing test scaffolding for domain logic.

Remaining product gaps:

- Some user-facing pages still read from `lib/demo-data.ts` directly, especially activity, dashboard trends/recent activity, approvals, settings, and team.
- Filtering inputs are mostly presentational and do not yet drive query state or server-side filtering.
- Rules are visible and evaluated, but customer-owned rule CRUD and policy templates are not yet a full workflow.
- Team management is not a real invite, role, seat, or access-control product yet.
- GitHub webhook processing is synchronous and narrow; it does not yet have a durable job queue, retry UI, check-run/status support, or broad event coverage.
- AI attribution is heuristic and based on author/title/branch naming rather than configurable identities, labels, commit trailers, or bot mappings.
- GitHub feedback is comment-oriented and not yet idempotent around updating a single managed comment or publishing check runs.
- Billing exists as a boundary, but lacks full customer portal, cancellation, invoice, trial, downgrade, overage, and plan-change UX.
- Observability, support diagnostics, admin tooling, and production incident workflows are not yet productized.
- Test coverage needs to expand from deterministic units into route, integration, and end-to-end workflows.

## 3. Product Principles

- Keep signals explainable. Every risk score, test gap, and rule decision should show why it fired.
- Make GitHub the center of gravity. Developers should get value in PR comments/checks without needing to open AgentGate for every change.
- Treat audit history as a product feature, not just logs. Customers should be able to answer who approved what, why, and when.
- Build multi-tenant and role-aware features by default. No server mutation should rely on client-provided organization context alone.
- Prefer advisory workflows before hard merge blocking. Start with comments, approvals, and audit records; add blocking once customers trust the signals.
- Finish real workflows before adding broad configurability. A small complete loop is more valuable than many partially wired settings pages.

## 4. Target Business Product

The first business-ready version should support this end-to-end flow:

1. A user signs up, gets a workspace, and installs the GitHub App.
2. AgentGate syncs selected repositories and open pull requests.
3. New or updated pull requests trigger risk, test-gap, and rule evaluation.
4. Risky changes create clear GitHub feedback and appear in an AgentGate review queue.
5. Authorized teammates approve, reject, request tests, or accept risk.
6. Decisions are recorded in pull request state, audit history, and optional GitHub comments/checks.
7. Usage, limits, and billing state are visible and enforced.
8. Team leads can review trends, noisy rules, approval bottlenecks, and audit exports.

## 5. Roadmap

### Phase 1: Finish Live Data Surfaces

Goal:

Remove the remaining "demo dashboard" feel by making core pages reflect organization-scoped database state.

Deliverables:

- Replace `lib/demo-data.ts` reads in activity, approvals, settings, team, and dashboard recent activity with Prisma-backed data access.
- Add persisted activity queries instead of rendering generated demo activity.
- Add real dashboard trend data from pull request, risk, test-gap, approval, and audit records.
- Wire filter/search inputs to URL query params and server-side filtering.
- Add consistent demo/live banners where local fallback data is still intentionally used.
- Add empty states for no activity, no approvals, no members, no billing state, and no historical trend data.

Verification:

- With a seeded database, every app page shows organization-scoped database data.
- With no database in local development, the app still clearly identifies demo fallback behavior.
- Activity, approvals, and dashboard trend pages no longer import `lib/demo-data.ts` directly.

### Phase 2: Production-Grade GitHub Pipeline

Goal:

Make GitHub ingestion reliable enough for pilot customers.

Deliverables:

- Introduce a durable job layer for webhook processing, manual sync, PR refresh, and GitHub output.
- Store webhook processing attempts, retry counts, last error, and processed timestamps.
- Expand event coverage for `pull_request`, `pull_request_review`, `check_suite`, `check_run`, `workflow_run`, `installation`, and `installation_repositories`.
- Capture CI/check status and update `ciStatus` from real GitHub state.
- Add periodic backfill for missed events and stale repositories.
- Make GitHub comments idempotent by storing and updating the managed AgentGate comment id.
- Add optional GitHub check runs that summarize AgentGate status.
- Add a sync diagnostics panel for last sync, last webhook, failures, and next retry.

Verification:

- Duplicate webhook deliveries do not duplicate PRs, events, usage, or comments.
- A PR update reaches AgentGate through a background job, not a slow webhook response path.
- CI status and close/merge state update correctly after GitHub events.
- Failed jobs are visible and retryable.

### Phase 3: Policy And Rules Product

Goal:

Turn repository rules into a customer-owned policy engine.

Deliverables:

- Add create, edit, enable, disable, duplicate, and delete flows for repository rules.
- Add organization-level rule templates that can be applied to repositories.
- Add rule scopes for repository, branch, path pattern, agent source, PR label, and risk level.
- Add actions for warn, request tests, require approval, request security review, and publish GitHub check.
- Add CODEOWNERS awareness for suggested reviewers.
- Add sensitive-file defaults for auth, billing, secrets, migrations, infrastructure, permissions, and dependencies.
- Add a "policy preview" mode that explains what rules would fire for a PR before saving changes.

Verification:

- Admins can manage rules without code changes.
- Rule changes are audited.
- Pull request approval status is derived from current rules and decisions.
- False positives can be reduced through configuration without hiding important signals.

### Phase 4: Team Workflow And Collaboration

Goal:

Make AgentGate useful for teams instead of single-user demos.

Deliverables:

- Add invite flow, pending invites, accepted invites, and invite expiration.
- Add owner, admin, member, and viewer role management UI.
- Enforce role checks on settings, billing, GitHub sync, rule management, approvals, and audit export.
- Add reviewer assignment or recommended reviewer suggestions.
- Add approval queues by assignee, repository, severity, and SLA.
- Add comment threads or decision notes on pull requests.
- Add notification preferences for email, Slack, or webhook destinations after the core flow is stable.

Verification:

- A workspace owner can invite a teammate and assign the right role.
- Viewers cannot mutate settings or approval decisions.
- Review queues help users find work without relying on raw pull request lists.

### Phase 5: Reporting, Audit, And Compliance

Goal:

Make the product valuable to engineering managers, security reviewers, and compliance stakeholders.

Deliverables:

- Add audit log filters for event type, actor, repository, pull request, severity, date range, and text search.
- Add saved audit exports for paid plans.
- Add PR review timeline that combines webhook events, risk changes, tests, approvals, comments, and merge state.
- Add dashboards for risky PR volume, test gaps, approval latency, noisy rules, and AI-assisted merge trends.
- Add repository and organization risk profiles over time.
- Add exportable incident review packet for a merged risky PR.

Verification:

- A customer can answer "what happened before this PR merged?" from the product.
- Audit export respects plan retention limits.
- Trend charts are generated from persisted data, not static demo arrays.

### Phase 6: Self-Serve Billing And Growth

Goal:

Make the product self-serve and commercially believable.

Deliverables:

- Add Paddle customer portal links for invoices, payment method, cancellation, and plan changes.
- Add trial state, upgrade prompts, downgrade handling, cancellation state, and failed payment state.
- Show plan limits and remaining usage in context where users hit limits.
- Add plan comparison with clear feature gating for approvals, comments, custom rules, and exports.
- Add owner-only billing access.
- Add customer-facing usage history by billing period.
- Add upgrade conversion events and activation metrics.

Verification:

- Checkout upgrades an organization and Paddle webhooks update plan state.
- Users see clear upgrade paths when limits block an action.
- Billing state is never purely mock-mode in production.

### Phase 7: Trust, Operations, And Enterprise Later

Goal:

Make production support and larger customer adoption sustainable.

Deliverables:

- Add structured logging for auth, GitHub, approval, billing, and job workflows.
- Add error tracking with release/environment context.
- Add health and diagnostics endpoints for database, GitHub, Paddle, and job processing.
- Add rate limits for public, auth, webhook, and mutation routes.
- Add security headers and production deployment checklist.
- Add customer data retention policy, privacy notes, and support contact docs.
- Later, add SSO, SCIM, custom retention, Slack/Teams alerts, API access, self-hosted deployment, and multi-provider support only when customer demand justifies them.

Verification:

- A production incident can be diagnosed from logs, errors, and diagnostics.
- Support can tell whether a repository is connected, syncing, failing, or over plan limits.
- Enterprise features are tied to real customer need rather than speculative scope.

## 6. Feature Ideas That Make AgentGate Feel More Powerful

Prioritized product upgrades:

- Agent identity registry: let admins map GitHub users, bot accounts, labels, branch prefixes, and commit trailers to Cursor, Codex, Claude Code, Copilot, Devin, or custom agents.
- PR risk timeline: show how risk changed across pushes, tests, comments, approvals, and merges.
- Managed GitHub check: publish pass/warn/fail status with links back to risk details and required approvals.
- Review packet: summarize risky files, missing tests, policy hits, reviewer notes, and recommended next action.
- Rule templates: one-click policies for startups, security-sensitive apps, billing systems, database-heavy repos, and infrastructure repos.
- Policy simulator: test a new rule against recent PRs before enabling it.
- Test recommendation workflow: convert detected test gaps into concrete requested tests and track whether later commits resolve them.
- Approval SLA: show aging approvals, owner, reviewer, and escalation status.
- Compliance export: package audit events for a date range or PR into a CSV/JSON bundle.
- Executive summary dashboard: weekly AI-assisted PRs, high-risk rate, approval latency, test-gap rate, and avoided-risk stories.
- Developer feedback loop: let reviewers mark risk signals as useful/noisy to tune rules over time.
- Support diagnostics: a workspace-level page showing connected app, last webhook, last sync, plan, usage, and recent failures.

## 7. Suggested Implementation Order

Start with the work that makes the current product feel real immediately:

1. Replace remaining direct demo imports on core pages with organization-scoped data.
2. Add real activity and dashboard trend queries.
3. Wire filters on pull requests, activity, audit, approvals, and repositories.
4. Add team invites and role management.
5. Add rule CRUD and templates.
6. Add durable GitHub jobs and sync diagnostics.
7. Add managed GitHub comments/check runs.
8. Add CI/check status ingestion.
9. Add billing portal and in-product limit upgrade prompts.
10. Add reporting and compliance polish.

Recommended first implementation milestone:

> A signed-in workspace owner can connect GitHub, sync real repositories, view real activity/trends, invite a teammate, configure a repository rule, review a risky PR, record an approval, and see the full timeline in audit history.

## 8. Definition Of Done

For each productization feature:

- It works with real organization-scoped data.
- It has server-side authorization and role checks.
- It does not depend on `lib/demo-data.ts` in production paths.
- It creates audit events when customer-relevant state changes.
- It has focused tests for the highest-risk behavior.
- It has clear empty, loading, error, and over-limit states.
- It fails safely when credentials or external services are missing.
- It updates documentation when setup, environment, or operational requirements change.

## 9. Next Sprint Proposal

The next sprint should be Phase 1:

- Add Prisma-backed activity queries.
- Convert dashboard recent activity and trends from demo arrays to database-derived data.
- Convert approvals and team/settings pages away from demo imports.
- Wire query filters on pull requests, activity, audit log, and repositories.
- Add regression tests for the new data access paths and cross-organization isolation.

This is the shortest path from "strong MVP" to "real product surface" because users will stop seeing static/demo sections while the existing GitHub, approval, audit, billing, and entitlement foundations remain intact.
