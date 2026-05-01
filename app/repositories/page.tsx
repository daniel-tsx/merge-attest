import type { SearchParams } from 'nuqs/server'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { EmptyState, ResultSummary } from '@/components/app/empty-state'
import { PageHeader } from '@/components/app/page-header'
import { RepositoryFilters } from '@/app/repositories/filters'
import { RiskBadge } from '@/components/app/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getCurrentOrganization, listRepositories } from '@/lib/data/app-data'
import { getPlanEntitlements, remainingLimit } from '@/lib/entitlements'
import { formatDate, formatNumber } from '@/lib/utils'
import { repositorySearchParamsCache } from './search-params'

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function RepositoriesPage({ searchParams }: PageProps) {
  const filters = await repositorySearchParamsCache.parse(searchParams)
  const organization = await getCurrentOrganization()
  const [allRepositories, repositories] = await Promise.all([
    listRepositories(organization.id),
    listRepositories(organization.id, filters),
  ])
  const entitlements = getPlanEntitlements(organization.planKey)
  const remainingRepositories = remainingLimit(
    entitlements.repositoryLimit,
    allRepositories.length,
  )
  const repositoryLimitReached = remainingRepositories === 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repositories"
        description="Connected GitHub repositories, rule coverage, usage, and risk profiles."
        actions={
          <form action="/api/github/sync/repositories" method="post">
            <input type="hidden" name="redirectTo" value="/repositories" />
            <Button variant="secondary" type="submit">
              <RefreshCw />
              Sync repositories
            </Button>
          </form>
        }
      />
      {repositoryLimitReached ? (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-medium text-foreground">
                Repository limit reached
              </div>
              <div className="text-sm text-muted-foreground">
                Your {organization.planKey} plan includes{' '}
                {entitlements.repositoryLimit} repositories. Upgrade before
                syncing additional repositories.
              </div>
            </div>
            <Button asChild>
              <a href="/settings/billing">View upgrade options</a>
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardContent className="space-y-4">
          {allRepositories.length === 0 ? (
            <EmptyState
              title="No repositories synced yet"
              description="Connect the GitHub App, then sync repositories to import open pull requests and start applying AgentGate rules."
              actions={
                organization.githubInstallationId ? (
                  <form action="/api/github/sync/repositories" method="post">
                    <input
                      type="hidden"
                      name="redirectTo"
                      value="/repositories"
                    />
                    <Button type="submit">
                      <RefreshCw />
                      Sync repositories
                    </Button>
                  </form>
                ) : (
                  <Button asChild>
                    <Link href="/settings/github">Connect GitHub</Link>
                  </Button>
                )
              }
            />
          ) : (
            <>
              <RepositoryFilters />
              <ResultSummary
                count={repositories.length}
                label="repositories"
                detail={`${allRepositories.length} total connected`}
              />
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rules</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Last synced</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repositories.map((repository) => (
                      <TableRow key={repository.id}>
                        <TableCell>
                          <Link
                            href={`/repositories/${repository.id}`}
                            className="font-medium text-foreground hover:underline"
                          >
                            {repository.name}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {repository.provider} · {repository.defaultBranch} ·{' '}
                            {repository.visibility}
                          </div>
                        </TableCell>
                        <TableCell>{repository.owner}</TableCell>
                        <TableCell>{repository.connectedStatus}</TableCell>
                        <TableCell>{repository.activeRulesCount}</TableCell>
                        <TableCell>
                          {formatNumber(repository.monthlyPrCheckUsage)} checks
                        </TableCell>
                        <TableCell>
                          <RiskBadge level={repository.riskProfile} />
                        </TableCell>
                        <TableCell>
                          {formatDate(repository.lastSyncedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {repositories.length === 0 ? (
                  <div className="border-t border-border p-4">
                    <EmptyState
                      title="No repositories match these filters"
                      description="Adjust or clear filters to see more repositories."
                    />
                  </div>
                ) : null}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
