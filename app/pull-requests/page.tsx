import { Suspense } from 'react'
import type { SearchParams } from 'nuqs/server'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { EmptyState, ResultSummary } from '@/components/app/empty-state'
import { PageHeader } from '@/components/app/page-header'
import { TableSkeleton } from '@/components/app/page-loading'
import { PullRequestFilters } from '@/app/pull-requests/filters'
import {
  AiReviewBadge,
  ApprovalBadge,
  CiBadge,
  TestGapBadge,
} from '@/components/app/status-badge'
import { RiskScoreBar } from '@/components/app/risk-score'
import { SortableHeader } from '@/components/app/sortable-header'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getCurrentOrganization, listPullRequests } from '@/lib/data/app-data'
import { getLatestAiReviewJob } from '@/lib/reporting'
import { formatDate, formatNumber } from '@/lib/utils'
import { pullRequestSearchParamsCache } from './search-params'
import { sortPullRequests } from './sort'

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default function PullRequestsPage({ searchParams }: PageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Review work"
        title="Pull request monitor"
        description="Scan AI-assisted pull requests by risk, test gap, CI state, and approval status."
      />
      <Card>
        <CardContent className="space-y-5">
          <PullRequestFilters />
          <Suspense fallback={<TableSkeleton label="Loading pull requests" />}>
            <PullRequestTable searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

async function PullRequestTable({ searchParams }: PageProps) {
  const [filters, organization] = await Promise.all([
    pullRequestSearchParamsCache.parse(searchParams),
    getCurrentOrganization(),
  ])
  const pullRequests = await listPullRequests(organization.id, filters)
  const sorted = sortPullRequests(pullRequests, filters.sort, filters.dir)

  return (
    <>
      <ResultSummary
        count={pullRequests.length}
        label="pull requests"
        detail="Matching the current URL filters"
      />
      <div className="-mx-5 overflow-x-auto">
        <Table>
          <caption className="sr-only">
            Pull request monitor results with repository, agent, risk, test, CI,
            approval, diff, and updated status
          </caption>
          <TableHeader className="sticky top-0 z-20">
            <TableRow>
              <TableHead className="sticky left-0 z-30 bg-surface-muted">
                <SortableHeader sortKey="pr" label="Pull request" />
              </TableHead>
              <TableHead>
                <SortableHeader sortKey="repository" label="Repository" />
              </TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>
                <SortableHeader sortKey="risk" label="Risk" />
              </TableHead>
              <TableHead>
                <SortableHeader sortKey="tests" label="Tests" />
              </TableHead>
              <TableHead>
                <SortableHeader sortKey="ci" label="CI" />
              </TableHead>
              <TableHead>
                <SortableHeader sortKey="approval" label="Approval" />
              </TableHead>
              <TableHead>AI review</TableHead>
              <TableHead>
                <SortableHeader sortKey="diff" label="Diff" />
              </TableHead>
              <TableHead>
                <SortableHeader sortKey="updated" label="Updated" />
              </TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((item) => (
              <TableRow key={item.id} className="group">
                <TableCell className="sticky left-0 z-10 min-w-80 bg-surface-elevated group-hover:bg-surface-hover">
                  <Link
                    className="font-medium text-foreground hover:text-accent"
                    href={`/pull-requests/${item.id}`}
                  >
                    #{item.number} {item.title}
                  </Link>
                  <div className="mt-0.5 text-xs text-subtle-foreground">
                    {item.author} ·{' '}
                    <span className="font-mono text-[11px]">
                      {item.branch} → {item.baseBranch}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-foreground">
                  {item.repositoryName}
                </TableCell>
                <TableCell className="whitespace-nowrap capitalize">
                  {item.aiAssisted === null
                    ? 'unknown'
                    : item.agentSource.replace('_', ' ')}
                </TableCell>
                <TableCell>
                  <RiskScoreBar level={item.riskLevel} score={item.riskScore} />
                </TableCell>
                <TableCell>
                  <TestGapBadge status={item.testGapStatus} />
                </TableCell>
                <TableCell>
                  <CiBadge status={item.ciStatus} />
                </TableCell>
                <TableCell>
                  <ApprovalBadge status={item.approvalStatus} />
                </TableCell>
                <TableCell>
                  <AiReviewBadge status={getLatestAiReviewJob(item)?.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap font-mono text-xs">
                  <span className="text-success-strong">
                    +{formatNumber(item.linesAdded)}
                  </span>
                  <span className="text-subtle-foreground"> / </span>
                  <span className="text-danger">
                    -{formatNumber(item.linesDeleted)}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(item.updatedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/pull-requests/${item.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                  >
                    Review
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {pullRequests.length === 0 ? (
          <div className="border-t border-border p-5">
            <EmptyState
              title="No pull requests match these filters"
              description="Sync repositories or clear the filters to see more results."
            />
          </div>
        ) : null}
      </div>
    </>
  )
}
