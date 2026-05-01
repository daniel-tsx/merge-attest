import { notFound } from 'next/navigation'
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

export default async function PullRequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const assignmentStatus =
    typeof resolvedSearchParams?.assignment === 'string'
      ? resolvedSearchParams.assignment
      : undefined
  const commentStatus =
    typeof resolvedSearchParams?.comment === 'string'
      ? resolvedSearchParams.comment
      : undefined
  const organization = await getCurrentOrganization()
  const pr = await getPullRequest(organization.id, id)
  if (!pr) notFound()
  const [auditEvents, activityEvents, teamMembers] = await Promise.all([
    listAuditEvents(organization.id, {
      pullRequestId: pr.id,
      take: 8,
    }),
    listActivityEvents(organization.id, {
      pullRequestId: pr.id,
      take: 8,
    }),
    listTeamMembers(organization.id),
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
      {assignmentStatus || commentStatus ? (
        <Card>
          <CardContent className="p-4 text-sm text-slate-700">
            {assignmentStatus === 'assigned'
              ? 'Reviewer assignment updated.'
              : assignmentStatus === 'unassigned'
                ? 'Reviewer assignment cleared.'
                : assignmentStatus === 'forbidden'
                  ? 'You do not have permission to assign reviewers.'
                  : null}
            {commentStatus === 'added'
              ? 'Internal review note added.'
              : commentStatus === 'forbidden'
                ? 'You do not have permission to add review notes.'
                : commentStatus === 'empty'
                  ? 'Write a note before submitting.'
                  : null}
          </CardContent>
        </Card>
      ) : null}
      <section className="grid gap-3 md:grid-cols-5">
        <Card>
          <CardContent>
            <div className="text-xs uppercase text-slate-500">Risk score</div>
            <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
              {pr.riskScore}
              <RiskBadge level={pr.riskLevel} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs uppercase text-slate-500">Test gap</div>
            <div className="mt-2">
              <TestGapBadge status={pr.testGapStatus} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs uppercase text-slate-500">CI</div>
            <div className="mt-2">
              <CiBadge status={pr.ciStatus} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs uppercase text-slate-500">Approval</div>
            <div className="mt-2">
              <ApprovalBadge status={pr.approvalStatus} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs uppercase text-slate-500">Diff</div>
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
                  className="rounded-md border border-slate-200 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-950">
                      {signal.label}
                    </div>
                    <div className="text-sm font-semibold">+{signal.score}</div>
                  </div>
                  {signal.filePaths.length ? (
                    <div className="mt-1 text-xs text-slate-500">
                      {signal.filePaths.join(', ')}
                    </div>
                  ) : null}
                </div>
              ))}
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
                <ul className="mt-1 list-inside list-disc text-slate-600">
                  {pr.testGapAnalysis.suggestedTestFiles.map((item) => (
                    <li key={item} className="font-mono text-xs">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-medium">Suggested test cases</div>
                <ul className="mt-1 list-inside list-disc text-slate-600">
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
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  Approval decisions require the Team plan or higher. Upgrade in
                  billing to enable this workflow.
                </div>
              ) : null}
              <div className="rounded-md border border-slate-200 p-3">
                <div className="text-sm font-medium text-slate-950">
                  Reviewer assignment
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Suggested reviewer:{' '}
                  {pr.reviewerSuggestion ?? 'No reviewer suggestion yet'}
                </div>
                <form
                  action={`/api/pull-requests/${pr.id}/assignment`}
                  method="post"
                  className="mt-3 grid gap-2"
                >
                  <select
                    name="assigneeId"
                    defaultValue={pr.assignedReviewer?.id ?? ''}
                    disabled={!canRecord}
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {reviewers.map((member) => (
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
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={!canRecord}
                  >
                    Update assignment
                  </Button>
                </form>
                <div className="mt-2 text-xs text-slate-500">
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
                  className="rounded-md border border-slate-200 p-3"
                >
                  <RiskBadge level={violation.severity} />
                  <div className="mt-2 text-sm font-medium">
                    {violation.ruleName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {violation.actionType.replaceAll('_', ' ')}
                  </div>
                </div>
              ))}
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
                <textarea
                  name="body"
                  placeholder="Add an internal review note"
                  maxLength={2000}
                  disabled={!canRecord}
                  className="min-h-20 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
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
                    className="rounded-md border border-slate-200 p-3 text-sm"
                  >
                    <div className="font-medium">{comment.author}</div>
                    <div className="mt-1 text-slate-600">{comment.body}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {formatDate(comment.createdAt)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No internal review notes yet.
                </p>
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
                    className="rounded-md border border-slate-200 p-3 text-sm"
                  >
                    <div className="font-medium">{approval.reviewer}</div>
                    <div className="text-slate-600">
                      {approval.decision.replaceAll('_', ' ')}
                    </div>
                    <div className="text-xs text-slate-500">
                      {approval.note}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No approval decisions recorded yet.
                </p>
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
                  className="rounded-md border border-slate-200 p-3 text-sm"
                >
                  <div className="font-medium">{item.title}</div>
                  {item.detail ? (
                    <div className="mt-1 text-slate-600">{item.detail}</div>
                  ) : null}
                  <div className="text-xs text-slate-500">
                    {item.source} · {formatDate(item.timestamp)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
