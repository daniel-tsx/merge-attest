# API Notes

AgentGate exposes a small set of operational and integration endpoints.

## Health And Diagnostics

- `GET /api/health`: public liveness check. It returns only `{ "status": "ok" }`.
- `GET /api/diagnostics`: owner/admin diagnostic payload with plan limits, repository count, PR check usage, and recent webhook failures.
- `POST /api/ai/openrouter/test`: owner/admin OpenRouter key verifier. Returns validity and model count without returning the submitted key.
- `POST /api/jobs/github-webhooks`: bearer-authenticated job runner for queued GitHub webhook deliveries. Requires `Authorization: Bearer $JOB_RUNNER_SECRET`.
- `POST /api/jobs/pr-reviews`: bearer-authenticated job runner for queued AI pull request reviews. Requires `Authorization: Bearer $JOB_RUNNER_SECRET`.
- `POST /api/jobs/retention`: bearer-authenticated retention cleanup runner. Requires `Authorization: Bearer $JOB_RUNNER_SECRET`.

## Webhooks

- `POST /api/github/webhook`: GitHub webhook receiver. Requires a valid GitHub signature in production.
- `POST /api/paddle/webhook`: Paddle webhook receiver. Requires Paddle webhook verification.

## Billing

- `POST /api/billing/checkout`: owner-only checkout entry point for paid plans.
- `POST /api/billing/portal`: owner-only Paddle customer portal redirect.

## Account Recovery

- `POST /api/auth/request-password-reset`: Better Auth endpoint used by `/forgot-password`; sends a reset email when transactional email is configured.
- `POST /api/auth/reset-password`: Better Auth endpoint used by `/reset-password`; accepts a single-use reset token and new password.

## Exports

- `GET /api/audit-log/export`: owner/admin CSV export, plan gated.
- `GET /api/pull-requests/:id/review-packet`: owner/admin markdown review packet export, plan gated.

## Rate Limits

API responses include rate limit headers:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

Current categories are public, auth, webhook, and mutation routes.
