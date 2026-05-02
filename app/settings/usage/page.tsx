import type { SearchParams } from 'nuqs/server'
import { PageHeader } from '@/components/app/page-header'
import { UsageFilters } from '@/app/settings/usage/filters'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentOrganization, listRepositories } from '@/lib/data/app-data'
import {
  getPlanEntitlements,
  limitLabel,
  remainingLimit,
} from '@/lib/entitlements'
import { getPrCheckUsage, getPrCheckUsageHistory } from '@/lib/usage'
import { formatNumber } from '@/lib/utils'
import { usageSearchParamsCache } from './search-params'

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function UsageSettingsPage({ searchParams }: PageProps) {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usage"
        description="Monthly PR check consumption by repository."
      />
      <Card>
        <CardContent>
          <UsageFilters />
        </CardContent>
      </Card>
      {nearLimit && showCurrentPeriod ? (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-medium text-slate-950">
                {remainingChecks === 0
                  ? 'PR check limit reached'
                  : 'PR check limit is close'}
              </div>
              <div className="text-sm text-slate-600">
                Upgrade to keep syncing pull requests without interruptions.
              </div>
            </div>
            <Button asChild>
              <a href="/settings/billing">View upgrade options</a>
            </Button>
          </CardContent>
        </Card>
      ) : null}
      {showCurrentPeriod ? (
        <Card>
          <CardHeader>
            <CardTitle>Current Billing Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-semibold">
                {formatNumber(totalUsage)} checks
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {remainingChecks === null
                  ? 'Unlimited checks included'
                  : `${formatNumber(remainingChecks)} remaining of ${limitLabel(entitlements.prCheckLimit, 'checks/month')}`}
              </div>
              {entitlements.prCheckLimit ? (
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-slate-800"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              ) : null}
            </div>
            <div className="space-y-3">
              {repositories.map((repository) => (
                <div key={repository.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{repository.name}</span>
                    <span>{formatNumber(repository.monthlyPrCheckUsage)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-slate-800"
                      style={{
                        width: `${Math.max(8, totalUsage ? (repository.monthlyPrCheckUsage / totalUsage) * 100 : 0)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
      {showUsageHistory ? (
        <Card>
          <CardHeader>
            <CardTitle>Usage History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {usageHistory.length ? (
              usageHistory.map((usagePeriod) => (
                <div
                  key={usagePeriod.periodStart}
                  className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm"
                >
                  <div>
                    {new Date(usagePeriod.periodStart).toLocaleDateString()} -{' '}
                    {new Date(usagePeriod.periodEnd).toLocaleDateString()}
                  </div>
                  <div className="font-medium text-slate-950">
                    {formatNumber(usagePeriod.quantity)} checks
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-slate-200 p-4 text-sm text-slate-600">
                Usage history appears after PR checks are recorded.
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
