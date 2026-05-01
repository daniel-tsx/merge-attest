import { PageHeader } from '@/components/app/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentOrganization, listRepositories } from '@/lib/data/app-data'
import {
  getPlanEntitlements,
  limitLabel,
  remainingLimit,
} from '@/lib/entitlements'
import { getPrCheckUsage } from '@/lib/usage'
import { formatNumber } from '@/lib/utils'

export default async function UsageSettingsPage() {
  const organization = await getCurrentOrganization()
  const repositories = await listRepositories(organization.id)
  const entitlements = getPlanEntitlements(organization.planKey)
  const persistedUsage = await getPrCheckUsage(organization.id)
  const repositoryUsage = repositories.reduce(
    (sum, repository) => sum + repository.monthlyPrCheckUsage,
    0,
  )
  const totalUsage =
    organization.dataMode === 'live' ? persistedUsage : repositoryUsage
  const remainingChecks = remainingLimit(entitlements.prCheckLimit, totalUsage)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usage"
        description="Monthly PR check consumption by repository."
      />
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
    </div>
  )
}
