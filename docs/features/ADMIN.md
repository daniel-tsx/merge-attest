# Platform Admin Dashboard

**Status:** `current`
**Location:** `docs/features/ADMIN.md`
**Last verified:** 2026-06-10

A cross-tenant operator console at `/admin` for the SaaS operator. It is distinct from the per-organization `OrganizationRole.admin` (admin _within one workspace_): the platform admin sees data across **every** organization.

## Access control

- Gated by `ADMIN_EMAILS` — a comma-separated, case-insensitive allowlist. Blank disables admin access entirely.
- `lib/env.ts` → `getAdminEmails()` parses the allowlist.
- `lib/admin/access.ts`:
  - `isPlatformAdminEmail(email, env?)` — pure allowlist check.
  - `getPlatformAdminContext()` — request-cached; returns `{ email, isAdmin }` (null without DB/session).
  - `requirePlatformAdmin()` — used by `app/admin/layout.tsx`; renders `notFound()` (404, least disclosure) for non-admins.
- **Defense in depth:** `proxy.ts` already forces sign-in on `/admin/*`; the layout guard enforces the allowlist; and **every admin server action re-checks `getPlatformAdminContext()`** — the UI is never the only gate.
- The **Admin** sidebar item appears only when `app/layout.tsx` resolves the signed-in user as a platform admin.

## Data boundary

`lib/admin/admin-data.ts` is the **only** module that intentionally queries across organizations. Every other read stays org-scoped through `lib/data/app-data.ts`. Pure, unit-tested aggregation helpers live in `lib/admin/metrics.ts` (`estimateMrr`, `bucketByWeek`, `planDistribution`, `billingStatusDistribution`, `PLAN_MONTHLY_PRICE`).

## Pages

| Route                       | Purpose                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `/admin`                    | Analytics overview: KPI cards, signups chart, plan distribution, billing breakdown, recent signups, health summary |
| `/admin/subscriptions`      | Per-org billing list with filters, MRR/active/trial/churn metrics, and plan + billing-status overrides             |
| `/admin/users`              | All users with filters; guarded permanent deletion                                                                 |
| `/admin/organizations`      | Workspace list with filters                                                                                        |
| `/admin/organizations/[id]` | Org drill-down: subscription overrides, members, repositories, recent audit events                                 |
| `/admin/system`             | Integration checks, webhook queue, billing events, AI review job health (read-only)                                |

## Write actions (`app/admin/actions.ts`)

All re-check admin access and write an `AuditEvent`.

- `updateOrgBilling(orgId, formData)` — overrides `planKey` + `billingStatus` (enum-validated). **Mutates MergeAttest's database only** — it does not call Lemon Squeezy. Use it for comped accounts or reconciling webhook drift; real billing changes go through the customer portal.
- `openCustomerPortal(orgId, formData)` — resolves the Lemon Squeezy customer-portal URL (`lib/billing.ts`) and redirects.
- `deleteUser(userId, formData)` — permanent. Refuses to delete your own account, any `ADMIN_EMAILS` account, or the sole owner of an organization. Writes a per-org audit event before deletion.

## Pagination

The subscriptions, users, and organizations lists use Relay-style cursor
pagination (`lib/admin/pagination.ts`, `ADMIN_PAGE_SIZE = 25`) over a
newest-first ordering. Forward (`after`) and backward (`before`) cursors travel
in the URL; the Previous/Next controls are built server-side with each route's
`serialize*SearchParams`. Applying or resetting a filter clears the cursors via
the `resetKeys` prop on `UrlFilterForm`. Summary metrics (subscriptions
MRR/active/trialing/churn and each list's total count) are aggregated across the
full filtered set, not just the visible page.

## Known limitations

- MRR is estimated from plan list prices (active + trialing only), not actual Lemon Squeezy revenue. Enterprise is custom (counted as 0).
- Signup time series is bucketed in JS (`bucketByWeek`), suitable for current scale.
- No tenant impersonation; no dedicated per-user detail page (membership summary is inline).

## Tests

- `tests/admin-access.test.ts` — allowlist parsing + email matching.
- `tests/admin-metrics.test.ts` — MRR, distributions, weekly bucketing.
- `tests/admin-pagination.test.ts` — cursor query args and next/prev derivation.
