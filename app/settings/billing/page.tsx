import { PageHeader } from '@/components/app/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentOrganization } from '@/lib/data/app-data'
import { getPlanEntitlements, limitLabel } from '@/lib/entitlements'
import {
  getBillingCallout,
  getBillingMode,
  getBillingStatusLabel,
  getPaddleCustomerPortalUrl,
  getPaddlePriceId,
  isPaidPlan,
} from '@/lib/billing'
import { canManageBilling } from '@/lib/collaboration'
import { plans } from '@/lib/plans'

const billingMessages: Record<string, string> = {
  checkout_unavailable:
    'Checkout is unavailable. Configure Paddle API keys and price IDs.',
  portal_unavailable:
    'Customer portal is unavailable. Configure Paddle portal URL and customer ID.',
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
  const portalUrl = getPaddleCustomerPortalUrl(organization.paddleCustomerId)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description={`Plan gates are enforced server-side. Paddle billing mode: ${billingMode}.`}
        actions={
          canManage ? (
            <form action="/api/billing/portal" method="post">
              <Button variant="secondary" type="submit" disabled={!portalUrl}>
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
      {billingMessage && billingMessages[billingMessage] ? (
        <Card>
          <CardContent className="p-4 text-sm text-slate-700">
            {billingMessages[billingMessage]}
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-4">
          <div>
            <div className="text-xs uppercase text-slate-500">Current plan</div>
            <div className="mt-2 text-lg font-semibold text-slate-950">
              {organization.planKey}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">
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
              >
                {getBillingStatusLabel(organization.billingStatus)}
              </Badge>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Lifecycle</div>
            <div className="mt-2 text-sm text-slate-700">
              {getBillingCallout({
                status: organization.billingStatus,
                trialEndsAt: organization.trialEndsAt,
                cancellationEffectiveAt: organization.cancellationEffectiveAt,
                failedPaymentAt: organization.failedPaymentAt,
              })}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Access</div>
            <div className="mt-2 text-sm text-slate-700">
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

          return (
            <Card
              key={plan.key}
              className={current ? 'border-slate-950' : undefined}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{plan.name}</CardTitle>
                  {current ? <Badge tone="blue">current</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-semibold">
                  {plan.priceMonthly}
                  <span className="text-sm font-normal text-slate-500">
                    /month
                  </span>
                </div>
                <div className="space-y-1 text-sm text-slate-600">
                  <div>
                    {limitLabel(entitlements.repositoryLimit, 'repositories')}
                  </div>
                  <div>
                    {limitLabel(entitlements.prCheckLimit, 'PR checks/month')}
                  </div>
                  <div>
                    {entitlements.auditRetentionDays
                      ? `${entitlements.auditRetentionDays}-day audit history`
                      : 'Custom audit retention'}
                  </div>
                </div>
                <ul className="space-y-1 text-sm text-slate-700">
                  {plan.features.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    Approvals:{' '}
                    {entitlements.features.approvals ? 'included' : 'upgrade'}
                  </div>
                  <div>
                    Custom rules:{' '}
                    {entitlements.features.customRules ? 'included' : 'upgrade'}
                  </div>
                  <div>
                    GitHub comments:{' '}
                    {entitlements.features.githubComments
                      ? 'included'
                      : 'upgrade'}
                  </div>
                  <div>
                    Audit exports:{' '}
                    {entitlements.features.auditExport ? 'included' : 'upgrade'}
                  </div>
                </div>
                {current ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Current plan
                  </Button>
                ) : isPaidPlan(plan.key) &&
                  billingMode === 'live' &&
                  getPaddlePriceId(plan.key) &&
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
                        ? 'Configure Paddle price'
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
