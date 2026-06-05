import type { SearchParams } from 'nuqs/server'
import { AlertTriangle, Database } from 'lucide-react'
import { EmptyState } from '@/components/app/empty-state'
import { PageHeader } from '@/components/app/page-header'
import { SettingsNav } from '@/components/app/settings-nav'
import { UsageFilters } from '@/app/settings/usage/filters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getCurrentOrganization, listRepositories } from '@/lib/data/app-data'
import {
  getPlanEntitlements,
  limitLabel,
  remainingLimit,
} from '@/lib/entitlements'
import { getPrCheckUsage, getPrCheckUsageHistory } from '@/lib/usage'
import { formatNumber } from '@/lib/utils'
import { usageSearchParamsCache } from './search-params'

export default async function UsageSettingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const [{ period }, organization] = await Promise.all([
    usageSearchParamsCache.parse(searchParams),
    getCurrentOrganization(),
  ])
  const [repositories, usageHistory, persistedUsage] = await Promise.all([
    listRepositories(organization.id),
    getPrCheckUsageHistory(organization.id),
    getPrCheckUsage(organization.id),
  ])
  const entitlements = getPlanEntitlements(organization.planKey)
  const repositoryUsage = repositories.reduce(
    (sum, repository) => sum + repository.monthlyPrCheckUsage,
    0,
  )
  const totalUsage =
    organization.dataMode === 'live' ? persistedUsage : repositoryUsage
  const remainingChecks = remainingLimit(entitlements.prCheckLimit, totalUsage)
  const usagePercent = entitlements.prCheckLimit
    ? Math.min(100, Math.round((totalUsage / entitlements.prCheckLimit) * 100))
    : 0
  const nearLimit =
    remainingChecks !== null && (remainingChecks === 0 || usagePercent >= 80)
  const showCurrentPeriod = period !== 'history'
  const showUsageHistory = period !== 'current'
  const usageBarTone =
    usagePercent >= 90
      ? 'bg-danger'
      : usagePercent >= 70
        ? 'bg-attention'
        : 'bg-accent'

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Usage"
        description="Monthly PR check consumption by repository."
      />
      <SettingsNav />
      <Card>
        <CardContent>
          <UsageFilters />
        </CardContent>
      </Card>
      {nearLimit && showCurrentPeriod ? (
        <Card className="border-attention-border bg-attention-soft/40">
          <CardContent className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-control bg-attention-soft text-attention">
              <AlertTriangle className="size-4" aria-hidden="true" />
            </div>
            <div>
              <div className="font-semibold text-foreground">
                {remainingChecks === 0
                  ? 'PR check limit reached'
                  : 'PR check limit is close'}
              </div>
              <div className="mt-0.5 text-sm text-muted-foreground">
                {remainingChecks === 0
                  ? 'New pull request checks will resume at the start of next month.'
                  : 'You are close to this month’s PR check allowance.'}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
      {showCurrentPeriod ? (
        <Card>
          <CardHeader>
            <CardTitle>Current billing period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                  {formatNumber(totalUsage)}
                </span>
                <span className="text-sm text-subtle-foreground">checks</span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {remainingChecks === null
                  ? 'Unlimited checks included'
                  : `${formatNumber(remainingChecks)} remaining of ${limitLabel(entitlements.prCheckLimit, 'checks/month')}`}
              </div>
              {entitlements.prCheckLimit ? (
                <Progress
                  value={Math.max(2, usagePercent)}
                  indicatorClassName={usageBarTone}
                  className="mt-3"
                  aria-label="PR checks used this billing period"
                />
              ) : null}
            </div>
            <div className="space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                Per repository
              </div>
              {repositories.length === 0 ? (
                <EmptyState
                  icon={Database}
                  title="No repositories yet"
                  description="Connect a repository to start tracking PR check usage."
                />
              ) : (
                repositories.map((repository) => {
                  const repoPercent = totalUsage
                    ? Math.max(
                        2,
                        Math.round(
                          (repository.monthlyPrCheckUsage / totalUsage) * 100,
                        ),
                      )
                    : 0
                  return (
                    <div key={repository.id}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">
                          {repository.name}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatNumber(repository.monthlyPrCheckUsage)}
                        </span>
                      </div>
                      <Progress
                        value={repoPercent}
                        indicatorClassName="bg-foreground/70"
                        className="h-1.5"
                        aria-label={`${repository.name} share of PR checks`}
                      />
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}
      {showUsageHistory ? (
        <Card>
          <CardHeader>
            <CardTitle>Usage history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {usageHistory.length ? (
              usageHistory.map((usagePeriod) => (
                <div
                  key={usagePeriod.periodStart}
                  className="flex items-center justify-between rounded-control border border-border bg-surface-muted/30 p-3 text-sm"
                >
                  <div className="text-muted-foreground">
                    {new Date(usagePeriod.periodStart).toLocaleDateString()}{' '}
                    <span className="text-subtle-foreground">→</span>{' '}
                    {new Date(usagePeriod.periodEnd).toLocaleDateString()}
                  </div>
                  <div className="font-medium tabular-nums text-foreground">
                    {formatNumber(usagePeriod.quantity)} checks
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Database}
                title="No usage history yet"
                description="Usage history appears after PR checks are recorded."
              />
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
