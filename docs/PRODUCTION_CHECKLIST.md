# Production Checklist

Use this checklist before running AgentGate for customer work.

## Required Environment

- `DATABASE_URL` points at a managed PostgreSQL database with backups.
- `BETTER_AUTH_SECRET` is unique, strong, and not shared with local development.
- `BETTER_AUTH_URL` matches the production application URL.
- `GITHUB_WEBHOOK_SECRET` is configured in both AgentGate and the GitHub App.
- GitHub App credentials are configured for installation sync and comments.
- Paddle API key, webhook secret, customer portal URL, and plan price IDs are configured before enabling production billing.
- `APP_VERSION` or `VERCEL_GIT_COMMIT_SHA` is available for log and error context.

## Runtime Checks

- `GET /api/health` returns `ok` or only expected warnings.
- `GET /api/diagnostics` works for owners/admins and shows database, GitHub, Paddle, and job queue status.
- Webhook delivery retries are healthy with no unexpected failed jobs.
- Security headers are present on application and API responses.
- Rate limit headers are present on API responses.

## Operational Readiness

- Database migrations have been applied.
- Audit export retention matches the active customer plan.
- Billing mode is `live` in production, not `mock` or `unconfigured`.
- Support knows the configured support email and escalation path.
- Incident review packets can be exported for risky merged pull requests.
