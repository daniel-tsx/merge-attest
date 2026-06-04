import { Suspense } from 'react'
import type { SearchParams } from 'nuqs/server'
import Link from 'next/link'
import {
  AlertTriangle,
  Boxes,
  Eye,
  GitBranch,
  Lock,
  MoreHorizontal,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldCheck,
} from 'lucide-react'
import { EmptyState, ResultSummary } from '@/components/app/empty-state'
import { PageHeader } from '@/components/app/page-header'
import { ListSkeleton } from '@/components/app/page-loading'
import { RepositoryFilters } from '@/app/repositories/filters'
import { RiskBadge } from '@/components/app/status-badge'
import { Badge, StatusDot } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  applyRepositoryFilters,
  getCurrentOrganization,
  listRepositories,
} from '@/lib/data/app-data'
import { getPlanEntitlements, remainingLimit } from '@/lib/entitlements'
import { formatDate, formatNumber } from '@/lib/utils'
import { repositorySearchParamsCache } from './search-params'

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default function RepositoriesPage({ searchParams }: PageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Review work"
        title="Repositories"
        description="Connected GitHub repositories, rule coverage, usage, and risk profiles."
        actions={
          <form action="/api/github/sync/repositories" method="post">
            <input type="hidden" name="redirectTo" value="/repositories" />
            <Button variant="secondary" type="submit">
              <RefreshCw aria-hidden="true" />
              Sync repositories
            </Button>
          </form>
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <RepositoriesContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function RepositoriesContent({ searchParams }: PageProps) {
  const [filters, organization] = await Promise.all([
    repositorySearchParamsCache.parse(searchParams),
    getCurrentOrganization(),
  ])
  const allRepositories = await listRepositories(organization.id)
  const repositories = applyRepositoryFilters(allRepositories, filters)
  const entitlements = getPlanEntitlements(organization.planKey)
  const remainingRepositories = remainingLimit(
    entitlements.repositoryLimit,
    allRepositories.length,
  )
  const repositoryLimitReached = remainingRepositories === 0

  return (
    <>
      {repositoryLimitReached ? (
        <Card className="border-attention-border bg-attention-soft/40">
          <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-control bg-attention-soft text-attention">
                <AlertTriangle className="size-4" aria-hidden="true" />
              </div>
              <div>
                <div className="font-semibold text-foreground">
                  Repository limit reached
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  Your{' '}
                  <span className="font-medium capitalize">
                    {organization.planKey}
                  </span>{' '}
                  plan includes {entitlements.repositoryLimit} repositories.
                  Upgrade before syncing additional repositories.
                </div>
              </div>
            </div>
            <Button asChild>
              <a href="/settings/billing">View upgrade options</a>
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardContent className="space-y-5">
          {allRepositories.length === 0 ? (
            <EmptyState
              icon={Boxes}
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
                      <RefreshCw aria-hidden="true" />
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
              <div className="-mx-5 overflow-x-auto">
                <Table>
                  <caption className="sr-only">
                    Connected repositories with status, policy coverage, usage,
                    risk, and sync time
                  </caption>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rules</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Last synced</TableHead>
                      <TableHead className="text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repositories.map((repository) => (
                      <TableRow key={repository.id}>
                        <TableCell>
                          <Link
                            href={`/repositories/${repository.id}`}
                            className="font-medium text-foreground hover:text-accent"
                          >
                            {repository.name}
                          </Link>
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-subtle-foreground">
                            <span>{repository.provider}</span>
                            <span aria-hidden="true">·</span>
                            <GitBranch className="size-3" aria-hidden="true" />
                            <span className="font-mono text-[11px]">
                              {repository.defaultBranch}
                            </span>
                            {repository.visibility === 'private' ? (
                              <>
                                <span aria-hidden="true">·</span>
                                <Lock className="size-3" aria-hidden="true" />
                                <span>private</span>
                              </>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {repository.owner}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-foreground">
                            <StatusDot
                              tone={
                                repository.connectedStatus === 'connected'
                                  ? 'green'
                                  : repository.connectedStatus === 'demo'
                                    ? 'blue'
                                    : 'yellow'
                              }
                            />
                            <span className="capitalize">
                              {repository.connectedStatus}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge tone="slate">
                            {repository.activeRulesCount} active
                          </Badge>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatNumber(repository.monthlyPrCheckUsage)} checks
                        </TableCell>
                        <TableCell>
                          <RiskBadge level={repository.riskProfile} />
                        </TableCell>
                        <TableCell>
                          {formatDate(repository.lastSyncedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Actions for ${repository.name}`}
                              >
                                <MoreHorizontal aria-hidden="true" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuLabel>
                                {repository.name}
                              </DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/repositories/${repository.id}`}>
                                  <Eye aria-hidden="true" />
                                  View repository
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/repositories/${repository.id}/rules`}
                                >
                                  <ShieldCheck aria-hidden="true" />
                                  Rules
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/repositories/${repository.id}/ai`}
                                >
                                  <SettingsIcon aria-hidden="true" />
                                  AI settings
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <form
                                action={`/api/github/sync/repositories/${repository.id}`}
                                method="post"
                              >
                                <input
                                  type="hidden"
                                  name="redirectTo"
                                  value="/repositories"
                                />
                                <DropdownMenuItem asChild>
                                  <button type="submit" className="w-full">
                                    <RefreshCw aria-hidden="true" />
                                    Sync now
                                  </button>
                                </DropdownMenuItem>
                              </form>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {repositories.length === 0 ? (
                  <div className="border-t border-border p-5">
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
    </>
  )
}
