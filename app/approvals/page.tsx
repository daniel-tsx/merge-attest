import type { SearchParams } from 'nuqs/server'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Calendar,
  ShieldAlert,
} from 'lucide-react'
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
import { Card, CardContent } from '@/components/ui/card'
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

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
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
        eyebrow="Review work"
        title="Approval queue"
        description="Human review queue for risky, AI-assisted, or test-gap pull requests."
      />
      {!approvalsAvailable ? (
        <Card className="border-info-border bg-info-soft/40">
          <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-control bg-info-soft text-info">
                <ShieldAlert className="size-4" aria-hidden="true" />
              </div>
              <div>
                <div className="font-semibold text-foreground">
                  Approval workflow requires the Team plan
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  Upgrade to record approval decisions, reviewer assignments, and
                  risk acceptance.
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
          <Card key={pr.id} className="overflow-hidden">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/pull-requests/${pr.id}`}
                    className="group inline-flex items-start gap-1.5"
                  >
                    <h3 className="text-sm font-semibold tracking-tight text-foreground group-hover:text-accent">
                      #{pr.number} {pr.title}
                    </h3>
                    <ArrowUpRight
                      className="mt-0.5 size-3.5 text-subtle-foreground transition-colors group-hover:text-accent"
                      aria-hidden="true"
                    />
                  </Link>
                  <p className="mt-1 text-xs text-subtle-foreground">
                    {pr.repositoryName} · Updated {formatDate(pr.updatedAt)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <RiskBadge level={pr.riskLevel} />
                <TestGapBadge status={pr.testGapStatus} />
                <CiBadge status={pr.ciStatus} />
                <ApprovalBadge status={pr.approvalStatus} />
              </div>
              <dl className="grid gap-3 rounded-control border border-border bg-surface-muted/30 p-3 text-xs sm:grid-cols-2">
                <div>
                  <dt className="text-subtle-foreground">Files changed</dt>
                  <dd className="mt-0.5 font-medium text-foreground tabular-nums">
                    {pr.filesChangedCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-subtle-foreground">Rule violations</dt>
                  <dd className="mt-0.5 font-medium text-foreground tabular-nums">
                    {pr.ruleViolations.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-subtle-foreground">Assignee</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {pr.assignedReviewer?.name ??
                      pr.reviewerSuggestion ??
                      'Unassigned'}
                  </dd>
                </div>
                <div>
                  <dt className="text-subtle-foreground">SLA</dt>
                  <dd className="mt-0.5 inline-flex items-center gap-1.5 font-medium text-foreground">
                    {pr.reviewDueAt ? (
                      <>
                        {pr.reviewSlaStatus === 'overdue' ? (
                          <AlertTriangle
                            className="size-3 text-danger"
                            aria-hidden="true"
                          />
                        ) : (
                          <Calendar
                            className="size-3 text-subtle-foreground"
                            aria-hidden="true"
                          />
                        )}
                        <span className="capitalize">
                          {pr.reviewSlaStatus.replaceAll('_', ' ')} ·{' '}
                          {formatDate(pr.reviewDueAt)}
                        </span>
                      </>
                    ) : (
                      <span className="text-subtle-foreground">No due date</span>
                    )}
                  </dd>
                </div>
              </dl>
              <form
                action={`/api/pull-requests/${pr.id}/assignment`}
                method="post"
                className="grid gap-2 md:grid-cols-[1fr_160px_auto]"
              >
                <label className="space-y-1.5">
                  <span className="block text-[11px] font-medium uppercase tracking-wider text-subtle-foreground">
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
                  <span className="block text-[11px] font-medium uppercase tracking-wider text-subtle-foreground">
                    Review due
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
          <CardContent>
            <EmptyState
              icon={BadgeCheck}
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
