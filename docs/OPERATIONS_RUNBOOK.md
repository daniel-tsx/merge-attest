# Operations Runbook

## CI Gate

Every pull request should pass:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm audit --audit-level moderate`
- `pnpm build`

The GitHub Actions workflow in `.github/workflows/ci.yml` runs the same checks with placeholder production-safe environment values.

## Required Production Jobs

Configure scheduled HTTPS `POST` calls with `Authorization: Bearer $JOB_RUNNER_SECRET`:

- `/api/jobs/github-webhooks`: process queued or retryable GitHub webhook deliveries. Recommended cadence: every 1-5 minutes.
- `/api/jobs/pr-reviews`: process queued AI pull request review jobs. Recommended cadence: every 1-5 minutes.
- `/api/jobs/retention`: clean operational retention data. Recommended cadence: daily.

Expected success response for `/api/jobs/github-webhooks`:

```json
{ "processed": 0, "failed": 0, "skipped": 0 }
```

Expected success response for `/api/jobs/pr-reviews`:

```json
{ "processed": 0, "blocked": 0, "failed": 0, "skipped": 0 }
```

Expected success response for `/api/jobs/retention`:

```json
{
  "auditEventsDeleted": 0,
  "webhookDeliveriesDeleted": 0,
  "billingEventsDeleted": 0,
  "auditExportsDeleted": 0
}
```

## Runtime Checks

- `/api/health` is public liveness only and should return `{ "status": "ok" }`.
- `/api/diagnostics` is owner/admin-only and should be used for dependency readiness, webhook job state, and retention warnings.
- AI review diagnostics should show queued, active, blocked, failed, and stale review job counts.
- GitHub settings should show the result of manual sync, stale backfill, retry, and installation callback errors.
- Password reset and sign-up verification should send through the configured transactional email provider.

## Alerting Targets

Set alerts for:

- `GET /api/health` non-200 response.
- `/api/jobs/github-webhooks` failures or repeated non-zero `failed` counts.
- `/api/jobs/pr-reviews` failures or stale queued review jobs in diagnostics.
- `/api/jobs/retention` failures.
- `/api/diagnostics` job check warnings that persist beyond one retry window.
- Lemon Squeezy webhook route returning 401/5xx.
- GitHub webhook route returning 401/5xx.
- Transactional email failures for verification or password reset.

## Incident Triage

1. Check `/api/diagnostics` as a workspace owner/admin.
2. Review failed GitHub webhook deliveries in `/settings/github`.
3. Trigger "Retry failed webhooks" from GitHub settings or call `/api/jobs/github-webhooks`.
4. If AI review jobs are stale, call `/api/jobs/pr-reviews` and inspect blocked or failed counts. Blocked jobs usually mean missing OpenRouter credentials, disabled repository AI settings, unavailable diffs, or a plan/output entitlement mismatch.
5. Confirm recent deploy version via logs using `APP_VERSION` or `VERCEL_GIT_COMMIT_SHA`.
6. If billing state is stale, check Lemon Squeezy webhook delivery status and replay from Lemon Squeezy if needed.
7. If account recovery fails, verify `EMAIL_FROM`, `RESEND_API_KEY`, and provider delivery logs.
8. If retention warnings persist, call `/api/jobs/retention` and inspect job logs.

## Data Retention

The retention job removes:

- Audit events older than the active plan retention window.
- Processed or ignored GitHub webhook deliveries older than 30 days.
- Processed or ignored billing webhook events older than 365 days.
- Audit export records older than 30 days.

Billing identifiers and usage records remain available for billing support unless a future data deletion workflow removes them explicitly.

## Billing Migration

The Lemon Squeezy database migration creates new Lemon Squeezy billing fields and removes legacy Paddle billing fields. Do not assume old Paddle customer or subscription ids are valid in Lemon Squeezy. For live customers, complete the provider-side migration/import first, then reconcile each organization with its Lemon Squeezy customer id, subscription id, subscription status, and variant id.

If `prisma migrate deploy` is blocked by an older failed migration, inspect whether that migration left partial database objects behind before resolving it. Only mark a migration as applied after the expected table, indexes, and foreign keys are present.

## AI Review Operations

- OpenRouter keys are organization-scoped and encrypted before storage. Rotate `AI_PROVIDER_ENCRYPTION_KEY` only with a credential migration plan.
- Repository AI review settings are disabled by default. Enable them per repository after key verification succeeds in `/settings/ai`.
- The worker currently validates queueing, credentials, settings, diffs, and response guardrails. Real model execution is not enabled yet, so guardrail-passing jobs are skipped with an explanatory status.
- AI-authored GitHub markdown is sanitized before publishing to neutralize mentions and hidden comment markers.
