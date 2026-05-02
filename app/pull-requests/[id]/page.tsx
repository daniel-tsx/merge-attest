import { notFound } from 'next/navigation'
import { EmptyState } from '@/components/app/empty-state'
import { ApprovalActions } from '@/components/app/approval-actions'
import { PageHeader } from '@/components/app/page-header'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  getCurrentOrganization,
  getPullRequest,
  listActivityEvents,
  listTeamMembers,
  listAuditEvents,
} from '@/lib/data/app-data'
import { getPlanEntitlements } from '@/lib/entitlements'
import { buildPullRequestTimeline } from '@/lib/reporting'
import { canRecordApproval } from '@/lib/collaboration'
import { isFeatureAvailable } from '@/lib/plans'
import { formatDate, formatNumber } from '@/lib/utils'

type FeedbackTone = 'danger' | 'info' | 'success'

function feedbackClasses(tone: FeedbackTone) {
  if (tone === 'danger') {
    return 'border-danger-border bg-danger-soft text-danger'
  }

  if (tone === 'success') {
    return 'border-success-border bg-success-soft text-success'
  }

  return 'border-info-border bg-info-soft text-info'
}

export default async function PullRequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ id }, resolvedSearchParams, organization] = await Promise.all([
    params,
    searchParams ?? Promise.resolve(undefined),
    getCurrentOrganization(),
  ])
  const assignmentStatus =
    typeof resolvedSearchParams?.assignment === 'string'
      ? resolvedSearchParams.assignment
      : undefined
  const commentStatus =
    typeof resolvedSearchParams?.comment === 'string'
      ? resolvedSearchParams.comment
      : undefined
  const [pr, teamMembers] = await Promise.all([
    getPullRequest(organization.id, id),
    listTeamMembers(organization.id),
  ])
  if (!pr) notFound()
  const [auditEvents, activityEvents] = await Promise.all([
    listAuditEvents(organization.id, {
      pullRequestId: pr.id,
      take: 8,
    }),
    listActivityEvents(organization.id, {
      pullRequestId: pr.id,
      take: 8,
    }),
  ])
  const reviewers = teamMembers.filter((member) => member.role !== 'viewer')
  const approvalsAvailable = isFeatureAvailable(
    organization.planKey,
    'approvals',
  )
  const canRecord = approvalsAvailable && canRecordApproval(organization.role)
  const entitlements = getPlanEntitlements(organization.planKey)
  const timeline = buildPullRequestTimeline({
    pullRequest: pr,
    auditEvents,
    activityEvents,
  })
  const feedbackMessages = [
    assignmentStatus === 'assigned'
      ? { text: 'Reviewer assignment updated.', tone: 'success' as const }
      : assignmentStatus === 'unassigned'
        ? { text: 'Reviewer assignment cleared.', tone: 'info' as const }
        : assignmentStatus === 'forbidden'
          ? {
              text: 'You do not have permission to assign reviewers.',
              tone: 'danger' as const,
            }
          : null,
    commentStatus === 'added'
      ? { text: 'Internal review note added.', tone: 'success' as const }
      : commentStatus === 'forbidden'
        ? {
            text: 'You do not have permission to add review notes.',
            tone: 'danger' as const,
          }
        : commentStatus === 'empty'
          ? { text: 'Write a note before submitting.', tone: 'info' as const }
          : null,
  ].filter(
    (message): message is { text: string; tone: FeedbackTone } =>
      message !== null,
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={`#${pr.number} ${pr.title}`}
        description={`${pr.repositoryName} · ${pr.author} · ${pr.branch} → ${pr.baseBranch}`}
        actions={
          entitlements.features.auditExport ? (
            <Button asChild variant="secondary">
              <a href={`/api/pull-requests/${pr.id}/review-packet`}>
                Export review packet
              </a>
            </Button>
          ) : (
            <Button variant="secondary" disabled>
              Growth plan review packet
            </Button>
          )
        }
      />
      {feedbackMessages.length ? (
        <div className="grid gap-2">
          {feedbackMessages.map((message) => (
            <div
              key={message.text}
              role="status"
              className={`rounded-card border px-4 py-3 text-sm ${feedbackClasses(
                message.tone,
              )}`}
            >
              {message.text}
            </div>
          ))}
        </div>
      ) : null}
      <section className="grid gap-3 md:grid-cols-5">
        <Card>
          <CardContent>
            <div className="text-xs uppercase text-muted-foreground">
              Risk score
            </div>
            <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
              {pr.riskScore}
              <RiskBadge level={pr.riskLevel} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs uppercase text-muted-foreground">
              Test gap
            </div>
            <div className="mt-2">
              <TestGapBadge status={pr.testGapStatus} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs uppercase text-muted-foreground">CI</div>
            <div className="mt-2">
              <CiBadge status={pr.ciStatus} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs uppercase text-muted-foreground">
              Approval
            </div>
            <div className="mt-2">
              <ApprovalBadge status={pr.approvalStatus} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs uppercase text-muted-foreground">Diff</div>
            <div className="mt-2 text-lg font-semibold">
              +{formatNumber(pr.linesAdded)} / -{formatNumber(pr.linesDeleted)}
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pr.riskSignals.map((signal) => (
                <div
                  key={signal.key}
                  className="rounded-control border border-border p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-foreground">
                      {signal.label}
                    </div>
                    <div className="text-sm font-semibold">+{signal.score}</div>
                  </div>
                  {signal.filePaths.length ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {signal.filePaths.join(', ')}
                    </div>
                  ) : null}
                </div>
              ))}
              {pr.riskSignals.length === 0 ? (
                <EmptyState
                  title="No risk signals"
                  description="Risk signals will appear when a pull request triggers scoring rules."
                  className="p-4"
                />
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Changed Files</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Path</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Additions</TableHead>
                    <TableHead>Deletions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pr.files.map((file) => (
                    <TableRow key={file.path}>
                      <TableCell className="font-mono text-xs">
                        {file.path}
                      </TableCell>
                      <TableCell>{file.changeType}</TableCell>
                      <TableCell>{file.additions}</TableCell>
                      <TableCell>{file.deletions}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Test Gap Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{pr.testGapAnalysis.summary}</p>
              <div>
                <div className="font-medium">Suggested test files</div>
                <ul className="mt-1 list-inside list-disc text-muted-foreground">
                  {pr.testGapAnalysis.suggestedTestFiles.map((item) => (
                    <li key={item} className="font-mono text-xs">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-medium">Suggested test cases</div>
                <ul className="mt-1 list-inside list-disc text-muted-foreground">
                  {pr.testGapAnalysis.suggestedTestCases.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approval Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!approvalsAvailable ? (
                <div className="rounded-control border border-info-border bg-info-soft p-3 text-sm text-info">
                  Approval decisions require the Team plan or higher. Upgrade in
                  billing to enable this workflow.
                </div>
              ) : null}
              <div className="rounded-control border border-border p-3">
                <div className="text-sm font-medium text-foreground">
                  Reviewer assignment
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Suggested reviewer:{' '}
                  {pr.reviewerSuggestion ?? 'No reviewer suggestion yet'}
                </div>
                <form
                  action={`/api/pull-requests/${pr.id}/assignment`}
                  method="post"
                  className="mt-3 grid gap-2"
                >
                  <Select
                    name="assigneeId"
                    defaultValue={pr.assignedReviewer?.id ?? ''}
                    disabled={!canRecord}
                  >
                    <option value="">Unassigned</option>
                    {reviewers.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.name}
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="date"
                    name="reviewDueAt"
                    defaultValue={pr.reviewDueAt?.slice(0, 10)}
                    disabled={!canRecord}
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={!canRecord}
                  >
                    Update assignment
                  </Button>
                </form>
                <div className="mt-2 text-xs text-muted-foreground">
                  Current: {pr.assignedReviewer?.name ?? 'Unassigned'} ·{' '}
                  {pr.reviewDueAt
                    ? `${pr.reviewSlaStatus.replaceAll('_', ' ')} by ${formatDate(
                        pr.reviewDueAt,
                      )}`
                    : 'No SLA'}
                </div>
              </div>
              <ApprovalActions prId={pr.id} canRecord={canRecord} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Rule Violations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pr.ruleViolations.map((violation) => (
                <div
                  key={violation.id}
                  className="rounded-control border border-border p-3"
                >
                  <RiskBadge level={violation.severity} />
                  <div className="mt-2 text-sm font-medium">
                    {violation.ruleName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {violation.actionType.replaceAll('_', ' ')}
                  </div>
                </div>
              ))}
              {pr.ruleViolations.length === 0 ? (
                <EmptyState
                  title="No rule hits"
                  description="This pull request did not trigger any configured rules."
                  className="p-4"
                />
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Review Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <form
                action={`/api/pull-requests/${pr.id}/comments`}
                method="post"
                className="space-y-2"
              >
                <Textarea
                  name="body"
                  placeholder="Add an internal review note"
                  maxLength={2000}
                  disabled={!canRecord}
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  disabled={!canRecord}
                >
                  Add note
                </Button>
              </form>
              {pr.comments.length ? (
                pr.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-control border border-border p-3 text-sm"
                  >
                    <div className="font-medium">{comment.author}</div>
                    <div className="mt-1 text-muted-foreground">
                      {comment.body}
                    </div>
                    <div className="mt-1 text-xs text-subtle-foreground">
                      {formatDate(comment.createdAt)}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No internal review notes"
                  description="Add a note to capture reviewer context for this pull request."
                  className="p-4"
                />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pr.approvals.length ? (
                pr.approvals.map((approval) => (
                  <div
                    key={approval.id}
                    className="rounded-control border border-border p-3 text-sm"
                  >
                    <div className="font-medium">{approval.reviewer}</div>
                    <div className="text-muted-foreground">
                      {approval.decision.replaceAll('_', ' ')}
                    </div>
                    <div className="text-xs text-subtle-foreground">
                      {approval.note}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No approval decisions"
                  description="Approval decisions will appear after a reviewer records one."
                  className="p-4"
                />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Review Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {timeline.map((item) => (
                <div
                  key={`${item.source}-${item.id}`}
                  className="rounded-control border border-border p-3 text-sm"
                >
                  <div className="font-medium">{item.title}</div>
                  {item.detail ? (
                    <div className="mt-1 text-muted-foreground">
                      {item.detail}
                    </div>
                  ) : null}
                  <div className="text-xs text-subtle-foreground">
                    {item.source} · {formatDate(item.timestamp)}
                  </div>
                </div>
              ))}
              {timeline.length === 0 ? (
                <EmptyState
                  title="No review timeline yet"
                  description="Timeline entries will appear when review, audit, or agent activity is recorded."
                  className="p-4"
                />
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
