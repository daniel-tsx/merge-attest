import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Activity,
  Boxes,
  GitBranch,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { EmptyState } from '@/components/app/empty-state'
import { MetricCard } from '@/components/app/metric-card'
import { PageHeader } from '@/components/app/page-header'
import {
  ApprovalBadge,
  CiBadge,
  RiskBadge,
  TestGapBadge,
} from '@/components/app/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusDot } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  getCurrentOrganization,
  getRepository,
  getRepositoryPullRequests,
  getRepositoryRules,
  listAuditEvents,
} from '@/lib/data/app-data'
import { formatDate, formatNumber } from '@/lib/utils'

export default async function RepositoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [{ id }, organization] = await Promise.all([
    params,
    getCurrentOrganization(),
  ])
  const repository = await getRepository(organization.id, id)
  if (!repository) notFound()

  const [prs, rules, auditEvents] = await Promise.all([
    getRepositoryPullRequests(organization.id, id),
    getRepositoryRules(organization.id, id),
    listAuditEvents(organization.id, {
      repositoryId: id,
      take: 8,
    }),
  ])

  const connectionTone =
    repository.connectedStatus === 'connected'
      ? 'green'
      : repository.connectedStatus === 'demo'
        ? 'blue'
        : 'yellow'

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Boxes className="size-3.5" aria-hidden="true" />
            Repository
          </span>
        }
        title={repository.name}
        description={`${repository.owner}/${repository.name} · ${repository.visibility} · default branch ${repository.defaultBranch}`}
        actions={
          <>
            <form
              action={`/api/github/sync/repositories/${repository.id}`}
              method="post"
            >
              <input
                type="hidden"
                name="redirectTo"
                value={`/repositories/${repository.id}`}
              />
              <Button variant="secondary" type="submit">
                <RefreshCw aria-hidden="true" />
                Sync
              </Button>
            </form>
            <Button asChild>
              <a href={`/repositories/${repository.id}/rules`}>
                <ShieldCheck aria-hidden="true" />
                Rules
              </a>
            </Button>
          </>
        }
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Connection"
          value={
            <span className="inline-flex items-center gap-2 text-base font-semibold capitalize">
              <StatusDot
                tone={connectionTone}
                pulse={repository.connectedStatus === 'connected'}
              />
              {repository.connectedStatus}
            </span>
          }
          description={`Last synced ${formatDate(repository.lastSyncedAt)}`}
          icon={GitBranch}
          tone={
            repository.connectedStatus === 'connected' ? 'success' : 'neutral'
          }
        />
        <MetricCard
          label="Active rules"
          value={rules.length}
          description="Policy coverage"
          icon={ShieldCheck}
          tone={rules.length > 0 ? 'accent' : 'neutral'}
        />
        <MetricCard
          label="Monthly usage"
          value={`${formatNumber(repository.monthlyPrCheckUsage)}`}
          description="PR checks this period"
          icon={TrendingUp}
        />
        <MetricCard
          label="Risk profile"
          value={
            <span className="inline-flex items-center text-base">
              <RiskBadge level={repository.riskProfile} />
            </span>
          }
          description="Average across open PRs"
          icon={Activity}
          tone={
            repository.riskProfile === 'high'
              ? 'danger'
              : repository.riskProfile === 'medium'
                ? 'warning'
                : 'success'
          }
        />
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pull requests</CardTitle>
            <p className="text-xs text-muted-foreground">
              Latest activity in this repository.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <caption className="sr-only">
                  Pull requests for this repository with review status
                </caption>
                <TableHeader>
                  <TableRow>
                    <TableHead>PR</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Tests</TableHead>
                    <TableHead>CI</TableHead>
                    <TableHead>Approval</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prs.map((pr) => (
                    <TableRow key={pr.id}>
                      <TableCell className="min-w-72">
                        <Link
                          href={`/pull-requests/${pr.id}`}
                          className="font-medium text-foreground hover:text-accent"
                        >
                          #{pr.number} {pr.title}
                        </Link>
                        <div className="mt-0.5 text-xs text-subtle-foreground">
                          {formatDate(pr.updatedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <RiskBadge level={pr.riskLevel} />
                      </TableCell>
                      <TableCell>
                        <TestGapBadge status={pr.testGapStatus} />
                      </TableCell>
                      <TableCell>
                        <CiBadge status={pr.ciStatus} />
                      </TableCell>
                      <TableCell>
                        <ApprovalBadge status={pr.approvalStatus} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {prs.length === 0 ? (
              <div className="border-t border-border p-5">
                <EmptyState
                  title="No pull requests for this repository"
                  description="Sync this repository or open the pull request monitor to see review data."
                  actions={
                    <Button asChild variant="secondary">
                      <Link href="/pull-requests">Open PR monitor</Link>
                    </Button>
                  }
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Audit</CardTitle>
            <p className="text-xs text-muted-foreground">
              Repository-specific events.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {auditEvents.length ? (
              auditEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-control border border-border bg-surface-muted/30 p-3"
                >
                  <div className="text-sm font-medium text-foreground">
                    {event.summary}
                  </div>
                  <div className="mt-1 text-xs text-subtle-foreground">
                    {formatDate(event.createdAt)}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No repository audit events"
                description="Repository-specific audit events will appear after syncs, rule changes, or review activity."
                className="py-6"
              />
            )}
          </CardContent>
        </Card>
      </section>
      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <SettingsIcon className="size-3.5" aria-hidden="true" />
            Repository settings
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-control border border-border bg-surface-muted/30 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
              Provider
            </div>
            <div className="mt-1 font-medium text-foreground">
              {repository.provider}
            </div>
          </div>
          <div className="rounded-control border border-border bg-surface-muted/30 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
              Created
            </div>
            <div className="mt-1 font-medium text-foreground">
              {formatDate(repository.createdAt)}
            </div>
          </div>
          <div className="rounded-control border border-border bg-surface-muted/30 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
              Updated
            </div>
            <div className="mt-1 font-medium text-foreground">
              {formatDate(repository.updatedAt)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
