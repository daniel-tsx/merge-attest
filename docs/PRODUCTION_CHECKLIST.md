# Production Checklist

Use this checklist before running AgentGate for customer work.

## Required Environment

- `DATABASE_URL` points at a managed PostgreSQL database with backups.
- `BETTER_AUTH_SECRET` is unique, strong, and not shared with local development.
- `BETTER_AUTH_URL` matches the production application URL.
- `GITHUB_APP_ID`, `GITHUB_APP_SLUG`, and `GITHUB_APP_PRIVATE_KEY` are configured for the production GitHub App.
- `GITHUB_WEBHOOK_SECRET` is configured in both AgentGate and the GitHub App.
- Paddle API key, webhook secret, customer portal URL, and Starter/Team/Growth price IDs are configured before enabling production billing.
- `EMAIL_FROM` and `RESEND_API_KEY` are configured before enabling email verification and password reset delivery.
- `JOB_RUNNER_SECRET` is configured before enabling scheduled operational job endpoints.
- `SUPPORT_EMAIL` is configured before publishing support contact details.
- `APP_VERSION` or `VERCEL_GIT_COMMIT_SHA` is available for log and error context.

## Runtime Checks

- `GET /api/health` returns `{ "status": "ok" }` without exposing dependency details.
- `GET /api/diagnostics` works for owners/admins and shows database, GitHub, Paddle, email, and job queue status.
- Scheduled calls to `/api/jobs/github-webhooks` and `/api/jobs/retention` succeed with the job runner bearer token.
- Password reset from `/forgot-password` sends an email and `/reset-password` accepts the token once.
- New production sign-ups receive verification email before workspace access.
- Webhook delivery retries are healthy with no unexpected failed jobs.
- Security headers are present on application and API responses.
- Rate limit headers are present on API responses.

## Operational Readiness

- CI passes lint, typecheck, tests, dependency audit, and production build.
- Database migrations have been applied.
- Audit export retention matches the active customer plan.
- Billing mode is `live` in production, not `mock` or `unconfigured`.
- Transactional email mode is `live` in production, not `mock` or `unconfigured`.
- Support knows the configured support email and escalation path.
- Incident review packets can be exported for risky merged pull requests.
