import type { SearchParams } from 'nuqs/server'
import Link from 'next/link'
import { EmptyState, ResultSummary } from '@/components/app/empty-state'
import { PageHeader } from '@/components/app/page-header'
import { ApprovalActions } from '@/components/app/approval-actions'
import { ApprovalFilters } from '@/app/approvals/filters'
import {
  ApprovalBadge,
  CiBadge,
  RiskBadge,
  TestGapBadge,
} from '@/components/app/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  getCurrentOrganization,
  listTeamMembers,
  listPullRequests,
  listRepositories,
} from '@/lib/data/app-data'
import { canRecordApproval } from '@/lib/collaboration'
import { isFeatureAvailable } from '@/lib/plans'
import { formatDate } from '@/lib/utils'
import { approvalsSearchParamsCache } from './search-params'

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function ApprovalsPage({ searchParams }: PageProps) {
  const [filters, organization] = await Promise.all([
    approvalsSearchParamsCache.parse(searchParams),
    getCurrentOrganization(),
  ])
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
    filters.approvalStatus !== 'all'
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
              <div className="font-medium text-foreground">
                Approval workflow requires the Team plan
              </div>
              <div className="text-sm text-muted-foreground">
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
        <CardContent className="space-y-4">
          <ApprovalFilters
            repositories={repositories}
            teamMembers={teamMembers}
          />
          <ResultSummary
            count={pending.length}
            label="approval queue items"
            detail={
              filters.approvalStatus === 'all'
                ? 'Pending reviews and high test-gap PRs'
                : 'Matching the selected approval status'
            }
          />
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        {pending.map((pr) => (
          <Card key={pr.id}>
            <CardHeader>
              <CardTitle>
                <Link
                  href={`/pull-requests/${pr.id}`}
                  className="hover:underline"
                >
                  #{pr.number} {pr.title}
                </Link>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {pr.repositoryName} · Updated {formatDate(pr.updatedAt)}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <RiskBadge level={pr.riskLevel} />
                <TestGapBadge status={pr.testGapStatus} />
                <CiBadge status={pr.ciStatus} />
                <ApprovalBadge status={pr.approvalStatus} />
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
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
                <label className="space-y-1.5">
                  <span className="block text-xs font-medium text-muted-foreground">
                    Assignee
                  </span>
                  <Select
                    name="assigneeId"
                    defaultValue={pr.assignedReviewer?.id ?? ''}
                    disabled={!canRecord}
                  >
                    <option value="">Unassigned</option>
                    {teamMembers
                      .filter((member) => member.role !== 'viewer')
                      .map((member) => (
                        <option key={member.userId} value={member.userId}>
                          {member.name}
                        </option>
                      ))}
                  </Select>
                </label>
                <label className="space-y-1.5">
                  <span className="block text-xs font-medium text-muted-foreground">
                    Review due date
                  </span>
                  <Input
                    type="date"
                    name="reviewDueAt"
                    defaultValue={pr.reviewDueAt?.slice(0, 10)}
                    disabled={!canRecord}
                  />
                </label>
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={!canRecord}
                  className="md:self-end"
                >
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
          <CardContent className="p-4">
            <EmptyState
              title="No approval items match these filters"
              description="New high-risk, AI-assisted, or test-gap pull requests will appear here."
              actions={
                <Button asChild variant="secondary">
                  <Link href="/pull-requests">View pull requests</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
