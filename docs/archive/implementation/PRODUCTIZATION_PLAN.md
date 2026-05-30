# AgentGate Productization Plan

**Status:** `superseded` — historical baseline; see `docs/strategy/ENHANCEMENT_PLAN.md` and code
**Location:** `docs/archive/implementation/PRODUCTIZATION_PLAN.md`

Last updated: 2026-05-01

## 1. Executive Summary

AgentGate is currently a strong MVP for a SaaS control center that helps engineering teams manage risk from AI-assisted pull requests. The product already has a clear narrative, polished demo surfaces, deterministic risk scoring, test gap detection, rule evaluation, a multi-tenant Prisma schema, and integration boundaries for GitHub, Better Auth, and Lemon Squeezy.

The main gap is that the app is not yet a real system of record. Most pages read from `lib/demo-data.ts`, approvals are stored in browser `localStorage`, GitHub webhooks acknowledge events without persistence, billing is mock-mode only, and the app does not yet enforce authentication, organization scoping, plans, usage, or production security controls.

The productization goal is to turn AgentGate from "convincing demo" into a real business product that can onboard teams, connect GitHub repositories, monitor real pull requests, produce trustworthy risk and test-gap signals, enforce approval workflows, maintain audit history, and charge customers based on plan limits.

## 2. Product Direction

### 2.1 Product Thesis

AI coding agents increase engineering velocity, but they also increase the volume of code changes that teams must review, validate, and govern. Teams need a lightweight control plane that answers:

- Which pull requests were created or significantly changed by AI agents?
- Which changes are risky because they touch sensitive areas such as auth, billing, infrastructure, dependencies, migrations, or public APIs?
- Which risky changes lack tests?
- Which repository rules were triggered?
- Who reviewed, approved, rejected, or accepted risk?
- What happened over time for audit, compliance, and incident review?

AgentGate should become the trusted layer between AI-assisted development and production deployment.

### 2.2 Ideal Customer Profile

Primary ICP:

- Small to mid-sized engineering teams using Cursor, Claude Code, Codex, Copilot, Devin, or similar agentic coding workflows.
- Teams with 5 to 100 engineers that merge through GitHub pull requests.
- Teams that care about auditability, security, quality, and operational reliability, but do not want heavy enterprise governance tooling.

Secondary ICP:

- Engineering leaders introducing AI coding agents into regulated or security-sensitive environments.
- Platform teams that want visibility across many repositories.
- Agencies or consultancies using AI agents across client projects and needing proof of review.

### 2.3 Core Personas

- Engineering Manager: wants visibility, adoption metrics, and confidence that AI-assisted work is reviewed.
- Staff or Principal Engineer: wants risky changes routed to the right reviewers before merge.
- Security Engineer: wants auth, secrets, dependencies, billing, infrastructure, and permission changes flagged.
- Developer: wants clear feedback on why a PR is risky and what tests or approvals are needed.
- Founder or CTO: wants to safely increase AI coding adoption without slowing the team down.

### 2.4 Positioning

AgentGate should be positioned as:

> A GitHub-native risk and approval layer for teams shipping AI-assisted code.

Avoid over-claiming early. The first business-ready version should not claim deep static analysis, perfect AI attribution, or complete compliance automation. It should claim practical, explainable guardrails that work immediately from GitHub pull request metadata, changed files, CI status, and repository rules.

### 2.5 Business Outcome

The business product should help customers:

- Reduce risky AI-assisted merges.
- Increase confidence in generated code.
- Improve test coverage discipline.
- Keep a searchable audit trail.
- Prove review and approval happened before production.
- Scale AI coding adoption safely.

## 3. Current MVP Assessment

### 3.1 What Already Exists

Current implemented strengths:

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4.
- A coherent SaaS information architecture with dashboard, repositories, pull requests, approvals, activity, audit log, team, GitHub, billing, and usage pages.
- Local UI primitives and consistent app shell.
- Deterministic risk scoring in `lib/risk.ts`.
- Deterministic test-gap analysis in `lib/test-gap.ts`.
- Repository rule evaluation in `lib/rules.ts`.
- Unit tests for risk, test-gap, and rule logic.
- Prisma schema with organizations, members, repositories, pull requests, files, risk signals, test gaps, rules, approvals, activity, audit events, plans, usage records, and API keys.
- Seed script with realistic demo data.
- GitHub App service boundary in `lib/github.ts`.
- Better Auth integration boundary in `lib/auth.ts`.
- Lemon Squeezy billing boundary in `lib/billing.ts`.
- Plan definitions and basic feature gate helper in `lib/plans.ts`.

### 3.2 MVP Limitations

Current product limitations:

- Pages import demo data directly instead of querying PostgreSQL.
- No app-wide login, session gating, or organization context.
- No multi-tenant enforcement on server routes.
- No production GitHub installation flow.
- GitHub webhook route verifies signatures when configured, then returns a message without persistence.
- Webhook verification returns demo success when no secret is configured.
- The GitHub comment route is a GET endpoint that acts on the first demo PR.
- `postPullRequestComment` does not accept an installation id, so live comment posting cannot work correctly for a GitHub App installation.
- Approvals are stored in `localStorage`, not the database.
- Billing page is mock-mode only.
- Plan limits are not enforced.
- Usage is demo-derived and not billable metering.
- No Prisma migrations are present in the reviewed repo snapshot.
- No queue, idempotency, retry, or background worker exists for webhook processing.
- No production observability, structured logging, error tracking, or health routes.
- No integration or E2E test coverage for auth, GitHub, billing, or API routes.

### 3.3 Highest-Risk Gaps

The highest-risk gaps to address before any pilot are:

- Public or unauthenticated access to sensitive app surfaces.
- Demo data being presented as if it were real customer data.
- Webhook and GitHub action routes being safe only for demo use.
- Lack of organization scoping and authorization.
- Lack of durable approval and audit records.
- Lack of reproducible database migrations.

## 4. Product Principles

### 4.1 Keep The Product Explainable

Every score and recommendation should show why it exists. Early customers will trust explainable deterministic signals more than opaque AI claims.

### 4.2 GitHub First

The first commercial version should integrate deeply with GitHub before expanding to other providers. The repo schema already assumes `RepositoryProvider.github`, and GitHub is the fastest path to real customer value.

### 4.3 Durable Audit Over Cosmetic UI

Approval and audit features must become server-side records before the product can be trusted. The UI should reflect database state, not browser-local decisions.

### 4.4 Multi-Tenant By Default

Every business entity should be scoped by organization from the first real implementation step. Avoid retrofitting tenancy later.

### 4.5 Start With Guardrails, Not Enforcement

Early versions should comment, warn, request approval, and record decisions. Hard merge blocking can come after customers trust the signals.

### 4.6 Prefer Narrow Production Loops

Implement one complete path end to end before broadening features. For example: sign in, create org, connect GitHub, sync repositories, receive PR event, calculate risk, display PR, approve, audit.

## 5. Target Product Capabilities

### 5.1 Onboarding

Business-ready onboarding should include:

- Sign up and sign in.
- Create or join an organization.
- Install the GitHub App.
- Select repositories to monitor.
- Import current open pull requests.
- Show first risk dashboard from real data.
- Invite teammates.
- Pick or confirm a plan.

Success criteria:

- A new user can reach a live dashboard without manual database changes.
- Demo mode is clearly separated from production mode.
- A customer can understand what data AgentGate can access and why.

### 5.2 Real Pull Request Monitoring

AgentGate should monitor:

- Pull request opened, reopened, synchronized, edited, closed, and merged events.
- Review requested and review submitted events.
- Check suite or check run status updates.
- Push events when needed for branch updates.
- Repository installation and repository selection changes.

For each relevant PR event:

- Upsert repository and pull request records.
- Fetch changed files.
- Store file-level metadata.
- Infer or record AI-assisted status.
- Run risk scoring.
- Run test-gap detection.
- Evaluate repository rules.
- Create activity and audit events.
- Optionally post GitHub comments or check runs.

Success criteria:

- A real GitHub PR appears in AgentGate within seconds or minutes of webhook delivery.
- Re-running the same webhook does not duplicate records.
- Closing or merging a PR updates status correctly.

### 5.3 Risk Scoring

The current deterministic engine is a good starting point. Productization should improve it by adding:

- Repository-specific rule weights.
- Organization-level risk profile defaults.
- Branch sensitivity, such as higher risk for changes targeting `main`.
- CODEOWNERS awareness when available.
- Secret, permission, and infrastructure file patterns.
- Dependency risk classification.
- Migration and schema change classification.
- Historical context, such as repeated failing CI or repeated rule violations.

Success criteria:

- Every risk score has a visible explanation.
- Customers can tune what is high-risk per repository.
- False positives can be reduced without hiding important signals.

### 5.4 Test-Gap Detection

The current path-based detector should become a practical test discipline tool:

- Detect source changes without matching test changes.
- Suggest likely test file locations.
- Highlight high-impact untested areas.
- Track unresolved test requests.
- Add optional GitHub comment output.
- Add organization and repo-level configuration for test path conventions.

Success criteria:

- Developers understand what test is being requested and why.
- Test-gap status updates when a PR adds test files.
- High-impact untested changes can require approval or risk acceptance.

### 5.5 Rules And Approval Workflows

Repository rules should become customer-owned workflow policy:

- Create, update, enable, disable, and delete rules.
- Rule triggers: AI-assisted PR, high risk, auth change, billing change, migration, dependency change, high test gap, failing CI.
- Rule actions: warn, request tests, require approval, request security review, block merge later.
- Approval decisions: approve, reject, request tests, accept risk.
- Approval notes and reviewer identity.
- Role-based permissions for who can approve high-risk changes.

Success criteria:

- Approval actions persist in PostgreSQL.
- Pull request approval status is derived from rules and decisions.
- Audit events record who decided what and when.
- The PR detail page is a trustworthy source of review state.

### 5.6 Audit Log

The audit log should be treated as a core paid feature:

- Immutable event records for important customer actions.
- Organization, repository, pull request, actor, timestamp, and metadata fields.
- Filtering by event type, repo, actor, severity, and date range.
- Export to CSV in paid plans.
- Retention limits by plan.

Success criteria:

- A customer can answer "what happened before this PR merged?"
- Audit records are not browser-local or synthetic.
- Retention and export features match plan entitlements.

### 5.7 GitHub Output

AgentGate should feed back into GitHub:

- PR comments summarizing risk and requested actions.
- Optional check runs for AgentGate status.
- Links from GitHub back to AgentGate PR detail.
- Avoid noisy repeated comments by updating an existing bot comment when possible.

Success criteria:

- Developers do not need to open AgentGate for every PR.
- GitHub output is idempotent and not spammy.
- Customers can turn comments and checks on or off per repository.

### 5.8 Billing And Usage

Plans should become enforceable business logic:

- Free: limited repositories, limited monthly PR checks, short audit retention.
- Starter: GitHub comments, more PR checks, basic custom rules.
- Team: approval workflow, custom repo rules, longer audit retention.
- Growth: advanced risk controls, exports, higher limits.
- Enterprise: SSO, custom retention, priority support, self-hosted or private deployment options later.

Metered usage should include:

- Monitored repositories.
- PR checks per billing period.
- Audit retention.
- Team members where relevant.

Success criteria:

- Lemon Squeezy checkout creates or updates subscriptions.
- Lemon Squeezy webhooks update organization plan state.
- API and UI enforce plan limits.
- Usage records are generated from real PR processing.

## 6. Technical Architecture Plan

### 6.1 Application Layers

Recommended layers:

- `app/`: route handlers, server components, pages, layouts.
- `components/`: UI components only.
- `lib/domain/`: risk, test-gap, rules, approval status, plan entitlement logic.
- `lib/data/`: Prisma-backed query and mutation functions.
- `lib/github/`: GitHub App auth, webhook parsing, API calls, comment/check-run helpers.
- `lib/auth/`: session helpers, role checks, organization context.
- `lib/billing/`: Lemon Squeezy client, checkout, webhook handling, entitlement sync.
- `lib/jobs/`: background job definitions and processors.
- `tests/`: unit, integration, and route tests.

This can be introduced gradually. Do not refactor everything at once. Start with a small data access layer for repositories and pull requests, then move one page at a time away from `lib/demo-data.ts`.

### 6.2 Database

Immediate database work:

- Create and commit Prisma migrations.
- Confirm Prisma 7 client generation works in development and build.
- Add a shared Prisma client module if not already present.
- Add seed data only for local development.
- Add indexes for common query paths.
- Add external GitHub identifiers where needed.

Schema additions likely needed:

- GitHub repository id.
- GitHub pull request node id or database id.
- GitHub installation account login and account id.
- Pull request head SHA.
- Pull request merge commit SHA.
- Pull request URL.
- Last processed webhook delivery id.
- GitHub comment id for idempotent comment updates.
- Subscription customer id and subscription id.
- Organization invite records.
- Optional team or role permission records later.

Success criteria:

- The app can be deployed from migrations alone.
- Production pages do not depend on seed data.
- Critical upserts use stable external IDs.

### 6.3 Auth And Authorization

Auth work:

- Remove production fallback secrets.
- Add sign-in and sign-up pages.
- Add app middleware or equivalent route protection.
- Create organization on first signup.
- Allow users to switch organization if they belong to more than one.
- Add role checks for owner, admin, member, and viewer.
- Restrict settings, billing, GitHub installation, rules, and approval actions by role.

Authorization rules:

- Owners manage billing, members, and dangerous settings.
- Admins manage repositories and rules.
- Members can view and approve according to policy.
- Viewers can read dashboards and audit logs only.

Success criteria:

- No customer data is visible without a valid session.
- Every server mutation validates organization membership and role.
- API routes do not trust client-provided organization ids alone.

### 6.4 GitHub Integration

GitHub App work:

- Implement installation callback or setup flow.
- Store installation id on organization or repository connection records.
- Sync selected repositories after installation.
- Use installation id in all GitHub API calls.
- Verify webhook signatures in production.
- Store webhook delivery ids for idempotency.
- Process installation, repository, pull request, check suite, and check run events.
- Add periodic backfill or sync job for missed events.

Webhook processing design:

1. Verify signature.
2. Parse event name and delivery id.
3. Store raw event metadata or mark delivery as received.
4. Resolve organization by installation id.
5. Enqueue a job for expensive sync work.
6. Return quickly to GitHub.
7. Worker fetches current GitHub state and upserts database records.
8. Worker runs risk, test-gap, and rules.
9. Worker writes activity, audit, usage, and optional GitHub output.

Success criteria:

- Webhook route is fast and idempotent.
- Processing can retry safely.
- Missing GitHub credentials fail clearly in production.

### 6.5 Background Jobs

A business-ready product needs background processing for:

- Webhook event processing.
- Repository sync and backfill.
- GitHub comment or check-run updates.
- Usage aggregation.
- Audit retention cleanup.
- Subscription reconciliation.

Implementation options:

- Start simple with a hosted queue provider or database-backed job table.
- If deploying on Vercel, consider a managed queue plus cron jobs.
- Keep job processors idempotent and small.

Success criteria:

- GitHub webhook delivery is not blocked by slow API calls.
- Failed processing is visible and retryable.
- Duplicate events do not duplicate customer-visible records.

### 6.6 Observability

Production observability should include:

- Structured request and job logs.
- Error tracking with release version and environment.
- Metrics for webhook volume, job failures, sync latency, GitHub API errors, PR checks, approvals, and billing events.
- Admin-only health or diagnostics page.
- Alerting for high webhook failure rates, queue backlog, Lemon Squeezy webhook failures, and database errors.

Success criteria:

- A production incident can be diagnosed without SSH or guessing.
- Customer support can answer whether a repo is connected and when it last synced.

### 6.7 Security

Security requirements:

- Required production secrets.
- Fail closed on missing webhook secret in production.
- No state-changing GET endpoints.
- CSRF-safe mutations.
- Session and role checks on every mutation.
- Organization scoping in every query.
- Secure storage and rotation path for GitHub private key and Lemon Squeezy secrets.
- Rate limits for public routes and webhook routes.
- Security headers.
- Input validation with Zod or similar on route handlers and server actions.
- Audit logging for sensitive settings changes.

Success criteria:

- A deployed app cannot be used anonymously to access or mutate customer data.
- GitHub and Lemon Squeezy webhook authenticity is verified.
- Security-sensitive actions are auditable.

## 7. Business Model Plan

### 7.1 Pricing Hypothesis

Keep the existing plan ladder, but validate with early customers:

- Free: 1 repository, 50 PR checks per month, 7-day audit history.
- Starter: 3 repositories, 300 PR checks per month, GitHub comments, basic custom rules.
- Team: 10 repositories, 2,000 PR checks per month, approval workflow, custom repo rules.
- Growth: higher limits, advanced risk controls, sensitive-file rules, exports, longer audit history.
- Enterprise: SSO, custom retention, procurement support, priority support, deployment flexibility later.

Initial recommendation:

- Make Team the primary paid plan.
- Keep Free useful enough for self-serve discovery.
- Avoid building Enterprise-only features before paid Team customers exist.

### 7.2 Packaging

Features by plan:

- Free: dashboard, PR risk view, basic test-gap warning, one repo.
- Starter: GitHub comments, repo rules, more checks.
- Team: approvals, audit retention, team members, custom rules.
- Growth: audit export, advanced rules, higher limits, priority onboarding.
- Enterprise: SSO, custom contracts, advanced retention, custom deployment.

### 7.3 Metrics

Product metrics:

- Organizations created.
- GitHub installations completed.
- Repositories connected.
- PR checks processed.
- Risky PRs detected.
- Test gaps detected.
- Approvals recorded.
- GitHub comments posted.
- Time from webhook to PR visible.
- Weekly active organizations.

Business metrics:

- Free to paid conversion.
- Trial activation rate.
- Team plan conversion rate.
- Monthly recurring revenue.
- Churn.
- Expansion by repositories or checks.
- Support tickets per customer.

Quality metrics:

- False positive feedback rate.
- Ignored comment rate.
- Approval override frequency.
- Webhook failure rate.
- Job retry rate.

## 8. Roadmap

### Phase 0: Safety, Honesty, And Product Boundary

Goal:

Make the MVP safe to run in a real environment without misleading users or exposing sensitive behavior.

Deliverables:

- Clearly separate demo mode from production mode.
- Remove production fallback for `BETTER_AUTH_SECRET`.
- Require GitHub webhook secret in production.
- Remove or protect `GET /api/github/comment`.
- Add environment validation.
- Add security notes to README.
- Add initial production checklist.

Verification:

- App fails clearly when required production secrets are missing.
- State-changing behavior is not exposed through unauthenticated GET routes.
- Tests cover webhook signature behavior and environment validation.

### Phase 1: Auth, Organizations, And Database Read Path

Goal:

Move from static demo app to authenticated multi-tenant app backed by PostgreSQL.

Deliverables:

- Sign-up and sign-in pages.
- Session-gated app routes.
- Organization creation on signup.
- Organization membership and role helpers.
- Shared Prisma client.
- Committed initial migrations.
- Data access layer for organizations, repositories, pull requests, activity, and audit events.
- Replace demo data reads for dashboard, repositories, pull requests, activity, and audit pages.
- Local seed remains available only for development.

Verification:

- A signed-in user sees only their organization's data.
- A signed-out user cannot access app pages.
- Existing unit tests pass.
- Add integration tests for organization-scoped queries.

### Phase 2: GitHub Installation And Repository Sync

Goal:

Let a real customer connect GitHub and populate AgentGate with real repositories and pull requests.

Deliverables:

- GitHub App installation flow.
- Store installation id and selected repositories.
- Repository sync job.
- Pull request sync job.
- Changed files persistence.
- External GitHub ids for idempotent upserts.
- Manual "sync now" action for admins.
- Last synced status in settings and repository pages.

Verification:

- Installing the GitHub App creates or updates repository records.
- Manual sync imports current open PRs.
- Re-running sync does not duplicate records.
- GitHub API failures are logged and surfaced clearly.

### Phase 3: Webhook Processing And Risk Pipeline

Goal:

Turn incoming GitHub events into continuously updated AgentGate PR records.

Deliverables:

- Webhook event dispatcher.
- Signature verification and delivery id idempotency.
- Queue or job processing.
- PR event handlers.
- CI/check status handlers.
- Risk scoring from persisted files and CI status.
- Test-gap analysis from persisted files.
- Rule evaluation against repo rules.
- Activity, audit, and usage records from the pipeline.

Verification:

- Opening or updating a GitHub PR updates AgentGate.
- Risk and test-gap status change when files or CI status change.
- Duplicate webhook delivery is safe.
- Webhook route responds quickly.

### Phase 4: Durable Approvals And GitHub Feedback

Goal:

Make AgentGate a trusted approval and audit system, not just a dashboard.

Deliverables:

- Replace localStorage approval actions with server mutations.
- Persist approval decisions, notes, reviewer identity, and timestamps.
- Update PR approval status from rule requirements and decisions.
- Add approval permission checks.
- Create audit events for approvals, rejections, test requests, and risk acceptance.
- Post or update GitHub PR comments.
- Optional GitHub check run for AgentGate status.

Verification:

- Approval decisions survive refresh, browser change, and teammate access.
- Unauthorized users cannot approve restricted PRs.
- GitHub comments are idempotent.
- Audit log reflects the approval lifecycle.

### Phase 5: Billing, Entitlements, And Usage Limits

Goal:

Enable self-serve paid usage.

Deliverables:

- Lemon Squeezy checkout session route.
- Lemon Squeezy webhook route with signature verification.
- Customer and subscription mapping.
- Organization plan state updates.
- Usage metering for PR checks.
- Enforcement of repository and PR check limits.
- Plan-based feature gates for comments, approvals, custom rules, audit retention, and exports.
- Billing settings page from real subscription state.

Verification:

- Checkout upgrades an organization.
- Lemon Squeezy subscription changes update organization entitlements.
- Over-limit actions are blocked or prompt upgrade.
- Usage page reflects real metered activity.

### Phase 6: Product Polish And Self-Serve Growth

Goal:

Improve activation, trust, and customer retention.

Deliverables:

- Guided onboarding checklist.
- Empty states and error states for disconnected GitHub, no repos, no PRs, and failed sync.
- Rule templates for common teams.
- Better PR detail explanations.
- Audit filters and CSV export.
- Team invite flow.
- Notification preferences.
- In-app feedback on false positives or noisy rules.
- Public marketing landing page if not already planned outside this app.

Verification:

- A new customer can onboard without direct developer assistance.
- Common empty or failed states are understandable.
- Customer feedback can be collected from the product.

### Phase 7: Enterprise Readiness Later

Goal:

Add features only after validated demand from paying teams.

Potential deliverables:

- SSO and SCIM.
- Custom audit retention.
- Compliance exports.
- Slack or Teams alerts.
- CODEOWNERS integration.
- Advanced policy engine.
- Self-hosted deployment option.
- Multi-provider support beyond GitHub.

Verification:

- Each enterprise feature is tied to a real customer need or deal.
- The implementation does not slow down core Team plan delivery.

## 9. Detailed Workstreams

### 9.1 UX And Product Experience

Needed improvements:

- Add sign-in, sign-up, organization setup, and GitHub installation pages.
- Replace static "Team plan" and "demo data" labels with real organization state.
- Add production-safe demo banners when demo data is used.
- Improve empty states for first-time users.
- Add loading, error, and disconnected states for GitHub sync.
- Add clear explanations for risk scores and rule violations.
- Add action-oriented PR detail page sections.
- Add admin-only settings sections.

First implementation target:

- End-to-end onboarding from signup to connected repository.

### 9.2 Data And Domain

Needed improvements:

- Create a small repository layer instead of importing Prisma everywhere.
- Keep risk, test-gap, and rule functions pure and testable.
- Add domain services for PR processing and approval status.
- Add database constraints and indexes for external IDs.
- Add migration discipline.

First implementation target:

- Prisma-backed repositories and pull request list pages.

### 9.3 GitHub

Needed improvements:

- Installation flow.
- Installation id storage.
- Correct installation-authenticated API calls.
- Webhook dispatch and idempotency.
- Sync jobs and retry behavior.
- Comment or check-run output.

First implementation target:

- Manual repository and PR sync from a stored installation id.

### 9.4 Security

Needed improvements:

- Production env validation.
- Route protection.
- Role checks.
- Webhook verification.
- No state-changing GET endpoints.
- Rate limiting.
- Security headers.
- Audit sensitive settings changes.

First implementation target:

- Protected app routes and safe webhook/comment APIs.

### 9.5 Billing

Needed improvements:

- Real checkout.
- Webhook processing.
- Subscription storage.
- Entitlement calculation.
- Usage metering.
- Limit enforcement.

First implementation target:

- Lemon Squeezy checkout and webhook subscription sync.

### 9.6 Testing

Needed tests:

- Unit tests for new domain services.
- Integration tests for Prisma queries and org scoping.
- Route handler tests for webhook and billing signatures.
- E2E tests for signup, GitHub connection mock, PR detail, approval.
- Regression tests for risk/test-gap/rule engines.

First implementation target:

- Webhook verification tests and org-scoped query tests.

### 9.7 Operations

Needed improvements:

- Production deployment checklist.
- Required env validation.
- Health/readiness endpoint.
- Structured logging.
- Error tracking.
- Job monitoring.
- Backup and restore plan.
- Incident runbook.

First implementation target:

- Environment validation plus basic structured logs around webhook and job processing.

## 10. Suggested File And Module Evolution

Keep early changes surgical. Avoid a full rewrite.

Near-term additions:

- `lib/prisma.ts`: shared Prisma client.
- `lib/env.ts`: validated environment configuration.
- `lib/auth/session.ts`: current session and organization helpers.
- `lib/auth/permissions.ts`: role and permission checks.
- `lib/data/organizations.ts`: organization queries.
- `lib/data/repositories.ts`: repository queries.
- `lib/data/pull-requests.ts`: PR queries and upserts.
- `lib/data/audit-events.ts`: audit queries and writers.
- `lib/github/webhooks.ts`: webhook verification and event dispatch.
- `lib/github/client.ts`: GitHub App and installation clients.
- `lib/jobs/pr-sync.ts`: PR sync processing.
- `lib/domain/approvals.ts`: approval status calculation.
- `app/(auth)/sign-in/page.tsx`: sign-in page.
- `app/(auth)/sign-up/page.tsx`: sign-up page.
- `middleware.ts`: route protection if compatible with the current Next.js version.

Existing modules to keep:

- Keep `lib/risk.ts`, `lib/test-gap.ts`, and `lib/rules.ts` as pure domain logic.
- Keep `lib/demo-data.ts` for local demo and tests until real data paths cover all pages.
- Keep UI primitives and app shell, but make their badges and navigation state real.

Existing modules to change carefully:

- `lib/auth.ts`: remove unsafe production fallback and connect auth to DB requirements.
- `lib/github.ts`: split into client, webhook, sync, and output helpers as it grows.
- `components/app/approval-actions.tsx`: move from client-only localStorage to server-backed mutation.
- `app/api/github/webhook/route.ts`: move from acknowledge-only to verify, dispatch, and enqueue.
- `app/api/github/comment/route.ts`: remove, protect, or convert to a POST-only authenticated action.

## 11. Implementation Order

The first implementation sequence should be:

1. Add environment validation and production safety guards.
2. Add auth-gated app access and organization context.
3. Create migrations and shared Prisma access.
4. Move repository and PR read paths from demo data to Prisma.
5. Add GitHub installation id storage and manual sync.
6. Add webhook dispatch and idempotent PR processing.
7. Persist approvals and audit events.
8. Add GitHub comments or check runs.
9. Add Lemon Squeezy checkout and subscription webhook handling.
10. Enforce plans and usage limits.
11. Add self-serve onboarding polish.
12. Add export, notifications, and advanced controls after customer validation.

This order is designed to produce usable milestones quickly while reducing security and data-model risk early.

## 12. First Milestone Definition

The first real-business milestone should be:

> A signed-in customer can create an organization, connect one GitHub repository, sync real open pull requests, see risk and test-gap analysis from persisted data, approve or request tests on a PR, and see the action in the audit log.

In scope:

- Auth.
- Organization context.
- PostgreSQL read/write paths.
- One GitHub installation.
- Repository sync.
- Open PR sync.
- Risk, test-gap, and rule processing.
- Durable approvals.
- Durable audit events.

Out of scope:

- Lemon Squeezy billing.
- Hard merge blocking.
- Slack notifications.
- Enterprise SSO.
- Multi-provider support.
- Advanced ML analysis.

Why this milestone:

- It proves the product works on real customer data.
- It validates the core value proposition.
- It creates the foundation for billing and plan limits.
- It avoids building monetization flows before activation is possible.

## 13. Pilot Readiness Checklist

Before inviting pilot customers:

- App requires login.
- Organization scoping is enforced.
- Required production secrets are validated.
- GitHub webhook signature verification is required in production.
- GitHub installation and sync work for at least one org.
- PR data is persisted.
- Approval decisions are persisted.
- Audit events are persisted.
- Demo mode is clearly labeled or disabled.
- Basic error tracking is configured.
- Basic webhook/job logs are available.
- Tests cover risk, test-gap, rules, webhook signatures, and organization scoping.
- README includes production setup.
- Support path is documented.

## 14. Paid Launch Checklist

Before charging customers:

- Lemon Squeezy checkout is live.
- Lemon Squeezy webhooks are verified and idempotent.
- Organization plan state updates from subscription events.
- Plan gates are enforced server-side.
- Usage records are generated from real PR processing.
- Billing page reflects real subscription and usage state.
- Upgrade and cancellation states are handled.
- Customer data retention policy is documented.
- Terms, privacy, and support contact exist.
- Backups and incident response basics are in place.

## 15. Key Risks And Mitigations

### Risk: False Positives Reduce Trust

Mitigation:

- Keep explanations visible.
- Add repo-level tuning.
- Collect feedback on noisy signals.
- Start with advisory comments before hard blocking.

### Risk: GitHub Event Complexity Causes Data Drift

Mitigation:

- Use idempotent upserts.
- Store delivery ids.
- Add manual sync and periodic backfill.
- Prefer fetching current PR state in jobs over trusting webhook payloads alone.

### Risk: Multi-Tenancy Bugs Leak Data

Mitigation:

- Centralize organization context helpers.
- Require organization filters in data access functions.
- Add integration tests for cross-org isolation.
- Avoid raw page-level Prisma queries where possible.

### Risk: Billing Before Activation Wastes Time

Mitigation:

- Build billing after the first real GitHub-to-approval workflow works.
- Keep plan definitions ready but delay advanced entitlement complexity.

### Risk: Overbuilding Enterprise Features

Mitigation:

- Keep Enterprise placeholders out of implementation until a real customer requires them.
- Focus on Team plan activation and retention first.

## 16. Open Product Questions

Questions to answer during implementation and customer discovery:

- How should AgentGate reliably infer "AI-assisted" across tools?
- Should customers manually mark PRs as AI-assisted, or should AgentGate infer from authors, labels, branch names, commit trailers, or bot identities?
- Should AgentGate post comments on every risky PR or only when rules trigger?
- Should approvals live only in AgentGate, or should they map to GitHub reviews/checks?
- What is the minimum useful audit export for early paid customers?
- Which plan limit matters most: repositories, PR checks, seats, or audit retention?
- How much rule configurability is needed before it becomes confusing?
- Is hard merge blocking necessary for Team customers, or only Growth and Enterprise?

## 17. Near-Term Backlog

Highest priority:

- Add `lib/env.ts` with required production env validation.
- Remove unsafe production fallback auth secret.
- Make webhook verification fail closed in production.
- Remove or protect `GET /api/github/comment`.
- Add shared Prisma client.
- Create initial Prisma migration.
- Add sign-in and sign-up routes.
- Add organization creation and membership lookup.
- Replace repository list with Prisma-backed data.
- Replace pull request list with Prisma-backed data.

Next priority:

- Add GitHub installation storage.
- Add manual repository sync.
- Add manual pull request sync.
- Persist changed files.
- Run risk/test-gap/rules during sync.
- Add audit events for sync and scoring.
- Replace approval localStorage with database writes.

Then:

- Add webhook idempotency.
- Add job queue or job table.
- Add GitHub comments.
- Add Lemon Squeezy checkout.
- Add plan enforcement.
- Add usage metering.
- Add audit export.

## 18. Definition Of Done For Productization Work

For each productization feature:

- It works with real organization-scoped data.
- It has server-side authorization.
- It does not depend on `lib/demo-data.ts` in production paths.
- It creates audit events when customer-relevant state changes.
- It has focused tests for the highest-risk behavior.
- It has clear empty, loading, and error states.
- It fails safely when credentials or external services are missing.
- It updates README or setup docs when environment or operational requirements change.

## 19. Recommended Next Step

Start with Phase 0 and Phase 1 together:

1. Add production environment validation.
2. Secure auth and route access.
3. Commit database migrations.
4. Add a Prisma data access layer.
5. Move repositories and pull requests from demo data to PostgreSQL.

This gives the project a real foundation without overbuilding billing, enterprise features, or advanced policy logic before the core customer workflow is real.
