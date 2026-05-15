import { Suspense } from 'react'
import type { SearchParams } from 'nuqs/server'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { EmptyState, ResultSummary } from '@/components/app/empty-state'
import { PageHeader } from '@/components/app/page-header'
import { TableSkeleton } from '@/components/app/page-loading'
import { PullRequestFilters } from '@/app/pull-requests/filters'
import {
  ApprovalBadge,
  CiBadge,
  RiskBadge,
  TestGapBadge,
} from '@/components/app/status-badge'
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
import { formatDate, formatNumber } from '@/lib/utils'
import { pullRequestSearchParamsCache } from './search-params'

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
          <TableHeader className="sticky top-0 z-10">
            <TableRow>
              <TableHead>Pull request</TableHead>
              <TableHead>Repository</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Tests</TableHead>
              <TableHead>CI</TableHead>
              <TableHead>Approval</TableHead>
              <TableHead>Diff</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pullRequests.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="min-w-80">
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
                <TableCell className="text-foreground">
                  {item.repositoryName}
                </TableCell>
                <TableCell className="capitalize">
                  {item.aiAssisted === null
                    ? 'unknown'
                    : item.agentSource.replace('_', ' ')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <RiskBadge level={item.riskLevel} />
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {item.riskScore}
                    </span>
                  </div>
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
                <TableCell className="font-mono text-xs">
                  <span className="text-success-strong">
                    +{formatNumber(item.linesAdded)}
                  </span>
                  <span className="text-subtle-foreground"> / </span>
                  <span className="text-danger">
                    -{formatNumber(item.linesDeleted)}
                  </span>
                </TableCell>
                <TableCell>{formatDate(item.updatedAt)}</TableCell>
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
