import { Database, GitPullRequest, History, Mail, Rocket } from 'lucide-react'
import { PageHeader } from '@/components/app/page-header'
import { SettingsNav } from '@/components/app/settings-nav'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentOrganization } from '@/lib/data/app-data'
import { getPlanEntitlements, limitLabel } from '@/lib/entitlements'
import { getSupportEmail } from '@/lib/env'

const includedFeatures = [
  'Risk scoring and test-gap detection',
  'Approval workflow and reviewer assignment',
  'Custom repository rules and agent identity rules',
  'GitHub comments, check runs, audit exports, and evidence reports',
]

export default async function BillingSettingsPage() {
  const organization = await getCurrentOrganization()
  const entitlements = getPlanEntitlements(organization.planKey)
  const supportEmail = getSupportEmail()
  const mailto = `mailto:${supportEmail}?subject=Higher%20MergeAttest%20early-access%20limits`
  const limits = [
    {
      label: 'Repositories',
      value: limitLabel(entitlements.repositoryLimit, 'connected repositories'),
      icon: Database,
    },
    {
      label: 'PR checks',
      value: limitLabel(entitlements.prCheckLimit, 'PR checks/month'),
      icon: GitPullRequest,
    },
    {
      label: 'Audit history',
      value: entitlements.auditRetentionDays
        ? `${entitlements.auditRetentionDays} days`
        : 'Unlimited retention',
      icon: History,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Plan and launch access"
        description="MergeAttest is in free early access. Core governance features are enabled now; only usage limits apply while paid expansion plans stay disabled."
        actions={
          <Button asChild variant="secondary">
            <a href={mailto}>
              <Mail aria-hidden="true" />
              Request higher limits
            </a>
          </Button>
        }
      />
      <SettingsNav />

      <Card className="border-info-border bg-info-soft/40">
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-control bg-info-soft text-info">
              <Rocket className="size-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-semibold text-foreground">
                  Free early-access launch
                </div>
                <Badge tone="blue" withDot>
                  No paid checkout
                </Badge>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Paid plans are planned after the launch period to expand usage
                for teams that outgrow the free limits. No credit card is
                required during early access.
              </p>
            </div>
          </div>
          <div className="rounded-control border border-info-border bg-surface px-3 py-2 text-sm">
            <span className="text-subtle-foreground">Current plan:</span>{' '}
            <span className="font-semibold capitalize text-foreground">
              {organization.planKey}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {limits.map((limit) => {
          const Icon = limit.icon
          return (
            <Card key={limit.label}>
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-control bg-surface-muted text-accent ring-1 ring-border">
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                      {limit.label}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-foreground">
                      {limit.value}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Included during early access</CardTitle>
          <p className="text-xs text-muted-foreground">
            These features are available on the free launch plan. If limits
            block an active pilot, contact support so usage needs can shape the
            paid expansion plan.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 md:grid-cols-2">
            {includedFeatures.map((feature) => (
              <li
                key={feature}
                className="rounded-control border border-border bg-surface-muted/30 p-3 text-sm text-muted-foreground"
              >
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
