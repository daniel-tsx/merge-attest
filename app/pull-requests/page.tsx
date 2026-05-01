import type { SearchParams } from 'nuqs/server'
import { PageHeader } from '@/components/app/page-header'
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

export default async function PullRequestsPage({ searchParams }: PageProps) {
  const filters = await pullRequestSearchParamsCache.parse(searchParams)
  const organization = await getCurrentOrganization()
  const pullRequests = await listPullRequests(organization.id, filters)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pull Request Monitor"
        description="Scan AI-assisted pull requests by risk, test gap, CI state, and approval status."
      />
      <Card>
        <CardContent className="space-y-4">
          <PullRequestFilters />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {pullRequests.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="min-w-80">
                      <a
                        className="font-medium text-slate-950 hover:underline"
                        href={`/pull-requests/${item.id}`}
                      >
                        #{item.number} {item.title}
                      </a>
                      <div className="text-xs text-slate-500">
                        {item.author} · {item.branch} → {item.baseBranch}
                      </div>
                    </TableCell>
                    <TableCell>{item.repositoryName}</TableCell>
                    <TableCell>
                      {item.aiAssisted === null
                        ? 'unknown'
                        : item.agentSource.replace('_', ' ')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <RiskBadge level={item.riskLevel} />
                        <span className="text-xs text-slate-500">
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
                    <TableCell>
                      +{formatNumber(item.linesAdded)} / -
                      {formatNumber(item.linesDeleted)}
                    </TableCell>
                    <TableCell>{formatDate(item.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {pullRequests.length === 0 ? (
              <div className="border-t border-slate-200 p-4 text-sm text-slate-600">
                No pull requests match these filters. Sync repositories or clear
                the filters to see more results.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
