# API Notes

**Status:** `current`
**Location:** `docs/features/API.md`

Auteur exposes a small set of operational and integration endpoints.

## Health And Diagnostics

- `GET /api/health`: public liveness check. It returns only `{ "status": "ok" }`.
- `GET /api/diagnostics`: owner/admin diagnostic payload with plan limits, repository count, PR check usage, and recent webhook failures.
- `POST /api/ai/openrouter/test`: owner/admin OpenRouter key verifier. Accepts a small JSON body with `apiKey`, trims surrounding whitespace, rejects empty or oversized keys, verifies the key with OpenRouter, and returns validity plus model count without returning the submitted key.
- `POST /api/jobs/github-webhooks`: bearer-authenticated job runner for queued GitHub webhook deliveries. Requires `Authorization: Bearer $JOB_RUNNER_SECRET`.
- `POST /api/jobs/pr-reviews`: bearer-authenticated job runner for queued AI pull request reviews. Requires `Authorization: Bearer $JOB_RUNNER_SECRET`.
- `POST /api/jobs/retention`: bearer-authenticated retention cleanup runner. Requires `Authorization: Bearer $JOB_RUNNER_SECRET`.

## Webhooks

- `POST /api/github/webhook`: GitHub webhook receiver. Requires a valid GitHub signature in production.
- `POST /api/lemon-squeezy/webhook`: Lemon Squeezy webhook receiver. Requires Lemon Squeezy webhook verification.

## Billing

- `POST /api/billing/checkout`: owner-only checkout entry point for paid plans.
- `POST /api/billing/portal`: owner-only Lemon Squeezy customer portal redirect.

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
