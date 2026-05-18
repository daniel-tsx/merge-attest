import { Check, ExternalLink, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/app/page-header'
import { SettingsNav } from '@/components/app/settings-nav'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentOrganization } from '@/lib/data/app-data'
import { getPlanEntitlements, limitLabel } from '@/lib/entitlements'
import {
  getBillingCallout,
  getBillingMode,
  getBillingStatusLabel,
  getLemonSqueezyVariantId,
  hasLemonSqueezyCustomerPortalAccess,
  isPaidPlan,
} from '@/lib/billing'
import { canManageBilling } from '@/lib/collaboration'
import { plans } from '@/lib/plans'
import { cn } from '@/lib/utils'

const billingMessages: Record<string, string> = {
  checkout_unavailable:
    'Checkout is unavailable. Configure Lemon Squeezy API keys and variant IDs.',
  portal_unavailable:
    'Customer portal is unavailable. Complete Lemon Squeezy checkout before opening the portal.',
}

function readParam(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const value = params?.[key]
  return Array.isArray(value) ? value[0] : value
}

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const [params, organization] = await Promise.all([
    searchParams ?? Promise.resolve(undefined),
    getCurrentOrganization(),
  ])
  const billingMessage = readParam(params, 'billing')
  const billingMode = getBillingMode()
  const canManage = canManageBilling(organization.role)
  const hasPortalAccess = hasLemonSqueezyCustomerPortalAccess({
    customerId: organization.lemonSqueezyCustomerId,
    subscriptionId: organization.lemonSqueezySubscriptionId,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Billing"
        description={`Plan gates are enforced server-side. Lemon Squeezy billing mode: ${billingMode}.`}
        actions={
          canManage ? (
            <form action="/api/billing/portal" method="post">
              <Button
                variant="secondary"
                type="submit"
                disabled={!hasPortalAccess}
              >
                <ExternalLink aria-hidden="true" />
                Manage billing portal
              </Button>
            </form>
          ) : (
            <Button variant="secondary" disabled>
              Owner-only billing
            </Button>
          )
        }
      />
      <SettingsNav />
      {billingMessage && billingMessages[billingMessage] ? (
        <Card className="border-info-border bg-info-soft/40">
          <CardContent className="text-sm text-info">
            {billingMessages[billingMessage]}
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="rounded-control border border-border bg-surface-muted/30 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
              Current plan
            </div>
            <div className="mt-1.5 text-lg font-semibold capitalize text-foreground">
              {organization.planKey}
            </div>
          </div>
          <div className="rounded-control border border-border bg-surface-muted/30 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
              Billing status
            </div>
            <div className="mt-2">
              <Badge
                tone={
                  organization.billingStatus === 'past_due' ||
                  organization.billingStatus === 'canceled'
                    ? 'red'
                    : organization.billingStatus === 'trialing'
                      ? 'blue'
                      : 'green'
                }
                withDot
              >
                {getBillingStatusLabel(organization.billingStatus)}
              </Badge>
            </div>
          </div>
          <div className="rounded-control border border-border bg-surface-muted/30 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
              Lifecycle
            </div>
            <div className="mt-1.5 text-sm text-muted-foreground">
              {getBillingCallout({
                status: organization.billingStatus,
                trialEndsAt: organization.trialEndsAt,
                cancellationEffectiveAt: organization.cancellationEffectiveAt,
                failedPaymentAt: organization.failedPaymentAt,
              })}
            </div>
          </div>
          <div className="rounded-control border border-border bg-surface-muted/30 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
              Access
            </div>
            <div className="mt-1.5 text-sm text-muted-foreground">
              {canManage
                ? 'You can manage billing.'
                : 'Only owners can manage billing.'}
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const entitlements = getPlanEntitlements(plan.key)
          const current = plan.key === organization.planKey

          const featureRows: Array<[string, boolean]> = [
            ['Approvals', entitlements.features.approvals],
            ['Custom rules', entitlements.features.customRules],
            ['GitHub comments', entitlements.features.githubComments],
            ['Audit exports', entitlements.features.auditExport],
          ]

          return (
            <Card
              key={plan.key}
              className={cn(
                'relative overflow-hidden transition-shadow hover:shadow-card-hover',
                current && 'border-accent ring-2 ring-accent-ring',
              )}
            >
              {current ? (
                <div className="absolute right-3 top-3">
                  <Badge tone="blue" withDot>
                    Current
                  </Badge>
                </div>
              ) : null}
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  {plan.key === 'team' ? (
                    <Sparkles
                      className="size-3.5 text-accent"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-semibold tracking-tight text-foreground">
                      {plan.priceMonthly}
                    </span>
                    <span className="text-sm text-subtle-foreground">
                      /month
                    </span>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-baseline justify-between gap-2 border-b border-divider pb-2">
                    <span className="text-subtle-foreground">Repositories</span>
                    <span className="font-medium text-foreground">
                      {limitLabel(entitlements.repositoryLimit, 'repos')}
                    </span>
                  </li>
                  <li className="flex items-baseline justify-between gap-2 border-b border-divider pb-2">
                    <span className="text-subtle-foreground">PR checks</span>
                    <span className="font-medium text-foreground">
                      {limitLabel(entitlements.prCheckLimit, '/month')}
                    </span>
                  </li>
                  <li className="flex items-baseline justify-between gap-2 border-b border-divider pb-2">
                    <span className="text-subtle-foreground">
                      Audit history
                    </span>
                    <span className="font-medium text-foreground">
                      {entitlements.auditRetentionDays
                        ? `${entitlements.auditRetentionDays} days`
                        : 'Custom'}
                    </span>
                  </li>
                </ul>
                <ul className="space-y-1.5 text-sm">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-foreground"
                    >
                      <Check
                        className="mt-0.5 size-3.5 shrink-0 text-success"
                        aria-hidden="true"
                      />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <ul className="grid grid-cols-2 gap-2 border-t border-divider pt-4 text-xs">
                  {featureRows.map(([label, included]) => (
                    <li
                      key={label}
                      className="inline-flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span
                        className={cn(
                          'inline-flex size-3.5 shrink-0 items-center justify-center rounded-full',
                          included
                            ? 'bg-success-soft text-success-strong'
                            : 'bg-surface-subtle text-subtle-foreground',
                        )}
                      >
                        {included ? (
                          <Check className="size-2.5" aria-hidden="true" />
                        ) : (
                          <span className="size-1 rounded-full bg-current" />
                        )}
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>
                {current ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Current plan
                  </Button>
                ) : isPaidPlan(plan.key) &&
                  billingMode === 'live' &&
                  getLemonSqueezyVariantId(plan.key) &&
                  canManage ? (
                  <form action="/api/billing/checkout" method="post">
                    <input type="hidden" name="planKey" value={plan.key} />
                    <Button className="w-full" type="submit">
                      Start checkout
                    </Button>
                  </form>
                ) : (
                  <Button className="w-full" disabled>
                    {!canManage
                      ? 'Owner-only checkout'
                      : isPaidPlan(plan.key)
                        ? 'Configure Lemon Squeezy variant'
                        : 'Contact sales'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
