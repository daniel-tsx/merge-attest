# API Notes

**Status:** `current`
**Location:** `docs/features/API.md`
**Last verified:** 2026-06-10

MergeAttest exposes a small set of operational and integration endpoints. In-app mutations (approvals, reviewer assignment, review notes, team and invite management, rule CRUD, agent registry, AI settings) are **server actions** colocated with their routes — they are not part of this HTTP surface.

## Health And Diagnostics

- `GET /api/health`: public liveness check. It returns only `{ "status": "ok" }`.
- `GET /api/diagnostics`: owner/admin diagnostic payload with plan limits, repository count, PR check usage, and recent webhook failures.
- `POST /api/ai/openrouter/test`: owner/admin OpenRouter key verifier. Accepts a small JSON body with `apiKey`, trims surrounding whitespace, rejects empty or oversized keys, verifies the key with OpenRouter, and returns validity plus model count without returning the submitted key.
- `POST /api/jobs/github-webhooks`: bearer-authenticated job runner for queued GitHub webhook deliveries. Requires `Authorization: Bearer $JOB_RUNNER_SECRET`.
- `POST /api/jobs/pr-reviews`: bearer-authenticated job runner for queued AI pull request reviews. Requires `Authorization: Bearer $JOB_RUNNER_SECRET`.
- `POST /api/jobs/retention`: bearer-authenticated retention cleanup runner. Requires `Authorization: Bearer $JOB_RUNNER_SECRET`.

## GitHub Integration

- `GET /api/github/installation`: GitHub App setup callback; verifies the signed `state` parameter and installation metadata, stores `installation_id` on the current organization, and redirects to GitHub settings.
- `POST /api/github/sync/repositories`: owner/admin manual repository sync for the current installation.
- `POST /api/github/sync/repositories/:id`: owner/admin pull request sync for one repository.
- `POST /api/github/backfill`: owner/admin backfill for stale repositories that missed webhook events.
- `POST /api/github/webhook/retry`: owner/admin retry of queued/failed webhook deliveries for the current organization.
- `POST /api/github/comment`: demo-only comment helper; returns a stub response without live credentials.

## Webhooks

- `POST /api/github/webhook`: GitHub webhook receiver. Requires a valid GitHub signature in production.
- `POST /api/lemon-squeezy/webhook`: Lemon Squeezy webhook receiver. Requires Lemon Squeezy webhook verification.

## Team And Onboarding

- `GET /api/team/invites/accept?token=…`: invite acceptance landing; validates the single-use invite token.
- `POST /api/team/invites/accept`: accepts the invite for the signed-in user and adds the membership.
- `POST /api/onboarding/organization`: ensures the signed-in user has an organization and returns it.

## Billing

- `POST /api/billing/checkout`: owner-only checkout entry point for paid plans; disabled during free early access unless `ENABLE_PAID_BILLING=true`.
- `POST /api/billing/portal`: owner-only Lemon Squeezy customer portal redirect; disabled during free early access unless `ENABLE_PAID_BILLING=true`.

## Account Recovery

- `POST /api/auth/request-password-reset`: Better Auth endpoint used by `/forgot-password`; sends a reset email when transactional email is configured.
- `POST /api/auth/reset-password`: Better Auth endpoint used by `/reset-password`; accepts a single-use reset token and new password.

## Exports

- `GET /api/audit-log/export`: owner/admin CSV export, plan gated.
- `GET /api/pull-requests/:id/review-packet`: owner/admin markdown review packet export, plan gated.
- `GET /api/compliance/authorship/export?format=csv|json`: owner/admin AI-authorship export, gated by `auditExport` and the plan retention window. `csv` = per-agent ledger; `json` = compliance evidence bundle. See [`AI_GOVERNANCE.md`](AI_GOVERNANCE.md).

## AI Review Notes

- AI review jobs are created idempotently by organization, repository, pull request number, and head SHA.
- Repository AI review settings are disabled by default. Missing or disabled settings cause the worker to skip rather than post output.
- Missing OpenRouter credentials block jobs with a user-actionable status rather than failing the job.
- GitHub AI output is gated by the existing GitHub comments entitlement and sanitizes AI-authored markdown before publishing.
- Review packets include AI review status and output summaries, but do not expose raw GitHub provider ids.

## Rate Limits

API responses include rate limit headers:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

Current categories are public, auth, webhook, and mutation routes.
