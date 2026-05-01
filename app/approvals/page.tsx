import { PageHeader } from '@/components/app/page-header'
import { ApprovalActions } from '@/components/app/approval-actions'
import {
  ApprovalBadge,
  CiBadge,
  RiskBadge,
  TestGapBadge,
} from '@/components/app/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  getCurrentOrganization,
  listTeamMembers,
  listPullRequests,
  listRepositories,
} from '@/lib/data/app-data'
import { canRecordApproval } from '@/lib/collaboration'
import { isFeatureAvailable } from '@/lib/plans'
import { formatDate } from '@/lib/utils'

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

export default async function ApprovalsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const approvalStatus = readParam(params, 'approvalStatus')
  const filters = {
    query: readParam(params, 'query'),
    repositoryId: readParam(params, 'repositoryId'),
    approvalStatus,
    riskLevel: readParam(params, 'riskLevel'),
    assigneeId: readParam(params, 'assigneeId'),
    slaStatus: readParam(params, 'slaStatus'),
  }
  const organization = await getCurrentOrganization()
  const [repositories, teamMembers, pullRequests] = await Promise.all([
    listRepositories(organization.id),
    listTeamMembers(organization.id),
    listPullRequests(organization.id, filters),
  ])
  const approvalsAvailable = isFeatureAvailable(
    organization.planKey,
    'approvals',
  )
  const canRecord = approvalsAvailable && canRecordApproval(organization.role)
  const pending =
    approvalStatus && approvalStatus !== 'all'
      ? pullRequests
      : pullRequests.filter(
          (pr) =>
            pr.approvalStatus === 'pending' || pr.testGapStatus === 'high',
        )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals"
        description="Human review queue for risky, AI-assisted, or test-gap pull requests."
      />
      {!approvalsAvailable ? (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-medium text-slate-950">
                Approval workflow requires the Team plan
              </div>
              <div className="text-sm text-slate-600">
                Upgrade to record approval decisions, reviewer assignments, and
                risk acceptance.
              </div>
            </div>
            <Button asChild>
              <a href="/settings/billing">View upgrade options</a>
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[1fr_180px_150px_160px_150px_140px_auto]">
            <Input
              name="query"
              defaultValue={filters.query}
              placeholder="Filter approvals"
              aria-label="Filter approvals"
            />
            <select
              name="repositoryId"
              defaultValue={filters.repositoryId ?? 'all'}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="all">All repositories</option>
              {repositories.map((repository) => (
                <option key={repository.id} value={repository.id}>
                  {repository.name}
                </option>
              ))}
            </select>
            <select
              name="riskLevel"
              defaultValue={filters.riskLevel ?? 'all'}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="all">All severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select
              name="assigneeId"
              defaultValue={filters.assigneeId ?? 'all'}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="all">All assignees</option>
              <option value="unassigned">Unassigned</option>
              {teamMembers
                .filter((member) => member.role !== 'viewer')
                .map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.name}
                  </option>
                ))}
            </select>
            <select
              name="slaStatus"
              defaultValue={filters.slaStatus ?? 'all'}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="all">All SLAs</option>
              <option value="overdue">Overdue</option>
              <option value="due_soon">Due soon</option>
              <option value="on_track">On track</option>
              <option value="none">No SLA</option>
            </select>
            <select
              name="approvalStatus"
              defaultValue={filters.approvalStatus ?? 'all'}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="all">Needs review</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="risk_accepted">Risk accepted</option>
            </select>
            <Button type="submit" variant="secondary">
              Apply
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        {pending.map((pr) => (
          <Card key={pr.id}>
            <CardHeader>
              <CardTitle>
                <a href={`/pull-requests/${pr.id}`} className="hover:underline">
                  #{pr.number} {pr.title}
                </a>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <RiskBadge level={pr.riskLevel} />
                <TestGapBadge status={pr.testGapStatus} />
                <CiBadge status={pr.ciStatus} />
                <ApprovalBadge status={pr.approvalStatus} />
              </div>
              <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                <div>{pr.repositoryName}</div>
                <div>Updated {formatDate(pr.updatedAt)}</div>
                <div>{pr.filesChangedCount} files changed</div>
                <div>{pr.ruleViolations.length} rule violations</div>
                <div>
                  Assignee:{' '}
                  {pr.assignedReviewer?.name ??
                    pr.reviewerSuggestion ??
                    'Unassigned'}
                </div>
                <div>
                  SLA:{' '}
                  {pr.reviewDueAt
                    ? `${pr.reviewSlaStatus.replaceAll('_', ' ')} (${formatDate(
                        pr.reviewDueAt,
                      )})`
                    : 'No due date'}
                </div>
              </div>
              <form
                action={`/api/pull-requests/${pr.id}/assignment`}
                method="post"
                className="grid gap-2 md:grid-cols-[1fr_160px_auto]"
              >
                <select
                  name="assigneeId"
                  defaultValue={pr.assignedReviewer?.id ?? ''}
                  disabled={!canRecord}
                  className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="">Unassigned</option>
                  {teamMembers
                    .filter((member) => member.role !== 'viewer')
                    .map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.name}
                      </option>
                    ))}
                </select>
                <Input
                  type="date"
                  name="reviewDueAt"
                  defaultValue={pr.reviewDueAt?.slice(0, 10)}
                  disabled={!canRecord}
                />
                <Button type="submit" variant="secondary" disabled={!canRecord}>
                  Assign
                </Button>
              </form>
              <ApprovalActions prId={pr.id} canRecord={canRecord} />
            </CardContent>
          </Card>
        ))}
      </div>
      {pending.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-slate-600">
            No approval items match these filters. New high-risk, AI-assisted,
            or test-gap pull requests will appear here.
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
