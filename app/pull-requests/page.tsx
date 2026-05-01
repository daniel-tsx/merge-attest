import { PageHeader } from '@/components/app/page-header'
import {
  ApprovalBadge,
  CiBadge,
  RiskBadge,
  TestGapBadge,
} from '@/components/app/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

export default async function PullRequestsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const filters = {
    query: readParam(params, 'query'),
    riskLevel: readParam(params, 'riskLevel'),
    agentSource: readParam(params, 'agentSource'),
    approvalStatus: readParam(params, 'approvalStatus'),
  }
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
          <form className="grid gap-3 md:grid-cols-[1fr_160px_160px_180px_auto]">
            <Input
              name="query"
              defaultValue={filters.query}
              placeholder="Filter pull requests"
              aria-label="Filter pull requests"
            />
            <select
              name="riskLevel"
              defaultValue={filters.riskLevel ?? 'all'}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="all">All risk</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              name="agentSource"
              defaultValue={filters.agentSource ?? 'all'}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="all">All agents</option>
              <option value="cursor">Cursor</option>
              <option value="codex">Codex</option>
              <option value="claude_code">Claude Code</option>
              <option value="copilot">Copilot</option>
              <option value="devin">Devin</option>
              <option value="manual">Manual</option>
            </select>
            <select
              name="approvalStatus"
              defaultValue={filters.approvalStatus ?? 'all'}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="all">Approval status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="risk_accepted">Risk accepted</option>
              <option value="not_required">Not required</option>
            </select>
            <Button type="submit" variant="secondary">
              Apply
            </Button>
          </form>
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
