import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import {
  Bot,
  Download,
  FileWarning,
  GitBranch,
  GitPullRequest,
  Info,
  ShieldCheck,
  TestTube2,
  UserCircle2,
} from 'lucide-react'
import { EmptyState } from '@/components/app/empty-state'
import { AttributionPanel } from '@/components/app/attribution-panel'
import { AccountabilityPanel } from '@/components/app/accountability-panel'
import { ApprovalActions } from '@/components/app/approval-actions'
import { MutationToasts } from '@/components/app/mutation-toasts'
import { addReviewNote, assignReviewer } from '@/app/pull-requests/actions'
import { PageHeader } from '@/components/app/page-header'
import { RiskScoreRing } from '@/components/app/risk-score'
import {
  AiReviewBadge,
  ApprovalBadge,
  CiBadge,
  RiskBadge,
  TestGapBadge,
} from '@/components/app/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  getCurrentOrganization,
  getPullRequest,
  listActivityEvents,
  listAttestations,
  listTeamMembers,
  listAuditEvents,
} from '@/lib/data/app-data'
import { pullRequestRequiresAttestation } from '@/lib/attestation'
import { getPlanEntitlements } from '@/lib/entitlements'
import {
  buildPullRequestTimeline,
  getAiReviewBlockedAction,
  getAiReviewStatusDetail,
  getLatestAiReviewJob,
} from '@/lib/reporting'
import { canRecordApproval } from '@/lib/collaboration'
import { isFeatureAvailable } from '@/lib/plans'
import { formatDate, formatNumber } from '@/lib/utils'

export default async function PullRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [{ id }, organization] = await Promise.all([
    params,
    getCurrentOrganization(),
  ])
  const [pr, teamMembers, attestations] = await Promise.all([
    getPullRequest(organization.id, id),
    listTeamMembers(organization.id),
    listAttestations(organization.id, id),
  ])
  if (!pr) notFound()
  const reviewers = teamMembers.filter((member) => member.role !== 'viewer')
  const attestable = pr.aiAssisted === true
  const requiresAttestation = pullRequestRequiresAttestation(pr)
  const approvalsAvailable = isFeatureAvailable(
    organization.planKey,
    'approvals',
  )
  const canRecord = approvalsAvailable && canRecordApproval(organization.role)
  const entitlements = getPlanEntitlements(organization.planKey)
  const latestAiReview = getLatestAiReviewJob(pr)
  const latestAiReviewDetail = getAiReviewStatusDetail(latestAiReview)
  const latestAiReviewAction = getAiReviewBlockedAction(latestAiReview)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <GitPullRequest className="size-3.5" aria-hidden="true" />
            {pr.repositoryName}
          </span>
        }
        title={`#${pr.number} ${pr.title}`}
        description={`${pr.author} authored · ${pr.branch} → ${pr.baseBranch}`}
        actions={
          entitlements.features.auditExport ? (
            <Button asChild variant="secondary">
              <a href={`/api/pull-requests/${pr.id}/review-packet`}>
                <Download aria-hidden="true" />
                Export review packet
              </a>
            </Button>
          ) : (
            <Button variant="secondary" disabled>
              <Download aria-hidden="true" />
              Review packet unavailable
            </Button>
          )
        }
      />
      <MutationToasts />

      {/* Decision hero — risk ring + key facts */}
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="flex items-center gap-5">
            <RiskScoreRing
              score={pr.riskScore}
              level={pr.riskLevel}
              size={104}
            />
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                Risk score
              </div>
              <div className="mt-1 text-sm text-foreground">
                <span className="font-semibold capitalize">{pr.riskLevel}</span>{' '}
                <span className="text-muted-foreground">
                  · {pr.riskSignals.length}{' '}
                  {pr.riskSignals.length === 1 ? 'signal' : 'signals'}
                </span>
              </div>
              <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserCircle2 className="size-3.5" aria-hidden="true" />
                {pr.aiAssisted === null
                  ? 'Authorship: unknown'
                  : pr.aiAssisted
                    ? `Agent: ${pr.agentSource.replace('_', ' ')}`
                    : 'Manual change'}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:border-l lg:border-divider lg:pl-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                Tests
              </div>
              <div className="mt-2">
                <TestGapBadge status={pr.testGapStatus} />
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                CI
              </div>
              <div className="mt-2">
                <CiBadge status={pr.ciStatus} />
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                Approval
              </div>
              <div className="mt-2">
                <ApprovalBadge status={pr.approvalStatus} />
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                Diff
              </div>
              <div className="mt-1.5 font-mono text-sm">
                <span className="font-semibold text-success-strong">
                  +{formatNumber(pr.linesAdded)}
                </span>
                <span className="text-subtle-foreground"> / </span>
                <span className="font-semibold text-danger">
                  -{formatNumber(pr.linesDeleted)}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-subtle-foreground">
                {pr.filesChangedCount}{' '}
                {pr.filesChangedCount === 1 ? 'file' : 'files'}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end lg:gap-1">
            <div className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface-subtle px-2.5 py-1 font-mono text-xs text-muted-foreground">
              <GitBranch className="size-3" aria-hidden="true" />
              {pr.branch}
              <span className="text-subtle-foreground">→</span>
              {pr.baseBranch}
            </div>
            <div className="text-xs text-subtle-foreground">
              Updated {formatDate(pr.updatedAt)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className={
          latestAiReview?.status === 'blocked' ||
          latestAiReview?.status === 'failed'
            ? 'border-attention-border bg-attention-soft/30'
            : undefined
        }
      >
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-control bg-surface text-accent ring-1 ring-border">
              <Bot className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-semibold text-foreground">AI review</div>
                <AiReviewBadge status={latestAiReview?.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {latestAiReviewDetail}
              </p>
              {latestAiReviewAction ? (
                <p className="mt-1 text-xs font-medium text-attention">
                  {latestAiReviewAction}
                </p>
              ) : null}
            </div>
          </div>
          {latestAiReview ? (
            <div className="grid min-w-52 grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                  Comments
                </div>
                <div className="mt-1 font-semibold tabular-nums text-foreground">
                  {latestAiReview.commentsCount}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                  Filtered
                </div>
                <div className="mt-1 font-semibold tabular-nums text-foreground">
                  {latestAiReview.skippedCommentsCount}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <AttributionPanel
            agentSource={pr.agentSource}
            aiAssisted={pr.aiAssisted}
            confidence={pr.attributionConfidence}
            evidence={pr.attributionEvidence}
          />

          <Card>
            <CardHeader>
              <CardTitle>Risk summary</CardTitle>
              <p className="text-xs text-muted-foreground">
                Deterministic signals contributing to the risk score.
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {pr.riskSignals.length ? (
                pr.riskSignals.map((signal) => (
                  <div
                    key={signal.key}
                    className="flex items-start justify-between gap-3 rounded-control border border-border bg-surface-muted/30 p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <RiskBadge level={signal.level} />
                        <span className="text-sm font-medium text-foreground">
                          {signal.label}
                        </span>
                      </div>
                      {signal.filePaths.length ? (
                        <div className="mt-1 truncate font-mono text-[11px] text-subtle-foreground">
                          {signal.filePaths.join(', ')}
                        </div>
                      ) : null}
                    </div>
                    <div className="shrink-0 rounded-pill bg-surface px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground ring-1 ring-border">
                      +{signal.score}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={ShieldCheck}
                  title="No risk signals"
                  description="Risk signals will appear when a pull request triggers scoring rules."
                  className="py-6"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changed files</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <caption className="sr-only">
                    Changed files with change type, additions, and deletions
                  </caption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Path</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">+</TableHead>
                      <TableHead className="text-right">-</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pr.files.map((file) => (
                      <TableRow key={file.path}>
                        <TableCell className="font-mono text-xs text-foreground">
                          {file.path}
                        </TableCell>
                        <TableCell className="capitalize">
                          {file.changeType}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-success-strong">
                          +{file.additions}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-danger">
                          -{file.deletions}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test gap analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                {pr.testGapAnalysis.summary}
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                    <TestTube2 className="size-3" aria-hidden="true" />
                    Suggested test files
                  </div>
                  <ul className="space-y-1">
                    {pr.testGapAnalysis.suggestedTestFiles.map((item) => (
                      <li
                        key={item}
                        className="rounded-control border border-border bg-surface-muted/30 px-2.5 py-1.5 font-mono text-[11px] text-foreground"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                    Suggested test cases
                  </div>
                  <ul className="space-y-1.5">
                    {pr.testGapAnalysis.suggestedTestCases.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-xs text-muted-foreground"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-1 size-1 shrink-0 rounded-full bg-subtle-foreground"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Approval workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!approvalsAvailable ? (
                <div className="flex items-start gap-2 rounded-control border border-info-border bg-info-soft p-3 text-xs text-info">
                  <Info
                    className="mt-0.5 size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  Approval decisions are not enabled for this workspace. Free
                  early access includes this workflow.
                </div>
              ) : null}
              <div className="rounded-control border border-border bg-surface-muted/30 p-3">
                <div className="text-sm font-medium text-foreground">
                  Reviewer assignment
                </div>
                <div className="mt-0.5 text-xs text-subtle-foreground">
                  Suggested:{' '}
                  <span className="font-medium text-muted-foreground">
                    {pr.reviewerSuggestion ?? 'No reviewer suggestion yet'}
                  </span>
                </div>
                <form
                  action={assignReviewer.bind(null, pr.id)}
                  className="mt-3 grid gap-2"
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
                      {reviewers.map((member) => (
                        <option key={member.userId} value={member.userId}>
                          {member.name}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="block text-[11px] font-medium uppercase tracking-wider text-subtle-foreground">
                      Review due date
                    </span>
                    <DatePicker
                      name="reviewDueAt"
                      defaultValue={pr.reviewDueAt?.slice(0, 10)}
                      disabled={!canRecord}
                    />
                  </label>
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={!canRecord}
                  >
                    Update assignment
                  </Button>
                </form>
                <div className="mt-3 border-t border-divider pt-2 text-xs text-subtle-foreground">
                  Current:{' '}
                  <span className="font-medium text-foreground">
                    {pr.assignedReviewer?.name ?? 'Unassigned'}
                  </span>
                  {pr.reviewDueAt
                    ? ` · ${pr.reviewSlaStatus.replaceAll('_', ' ')} by ${formatDate(pr.reviewDueAt)}`
                    : ' · No SLA'}
                </div>
              </div>
              <ApprovalActions
                prId={pr.id}
                canRecord={canRecord}
                attestable={attestable}
              />
            </CardContent>
          </Card>

          {attestable ? (
            <AccountabilityPanel
              agentSource={pr.agentSource}
              headSha={pr.headSha}
              requiresAttestation={requiresAttestation}
              attestations={attestations}
            />
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>AI review output</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pr.aiReviewJobs.length ? (
                pr.aiReviewJobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-control border border-border bg-surface-muted/30 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <AiReviewBadge status={job.status} />
                      <span className="text-xs text-subtle-foreground">
                        {formatDate(job.updatedAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-muted-foreground">
                      {getAiReviewStatusDetail(job)}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-subtle-foreground">
                      <span>{job.commentsCount} comments</span>
                      <span>{job.skippedCommentsCount} filtered</span>
                    </div>
                    {job.model ? (
                      <div className="mt-2 truncate font-mono text-[11px] text-subtle-foreground">
                        {job.model}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={Bot}
                  title="No AI review job"
                  description="AI review status will appear after this repository has AI reviews enabled and the PR is synced."
                  className="py-6"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rule violations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pr.ruleViolations.length ? (
                pr.ruleViolations.map((violation) => (
                  <div
                    key={violation.id}
                    className="rounded-control border border-border bg-surface-muted/30 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <RiskBadge level={violation.severity} />
                      <span className="text-[11px] uppercase tracking-wider text-subtle-foreground">
                        {violation.actionType.replaceAll('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-2 text-sm font-medium text-foreground">
                      {violation.ruleName}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={FileWarning}
                  title="No rule hits"
                  description="This pull request did not trigger any configured rules."
                  className="py-6"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Review notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <form
                action={addReviewNote.bind(null, pr.id)}
                className="space-y-2"
              >
                <label className="space-y-1.5">
                  <span className="block text-[11px] font-medium uppercase tracking-wider text-subtle-foreground">
                    Internal review note
                  </span>
                  <Textarea
                    name="body"
                    placeholder="Add an internal review note"
                    maxLength={2000}
                    disabled={!canRecord}
                  />
                </label>
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
                    className="rounded-control border border-border bg-surface-muted/30 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">
                        {comment.author}
                      </span>
                      <span className="text-xs text-subtle-foreground">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground">{comment.body}</p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No internal review notes"
                  description="Add a note to capture reviewer context for this pull request."
                  className="py-6"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pr.approvals.length ? (
                pr.approvals.map((approval) => (
                  <div
                    key={approval.id}
                    className="rounded-control border border-border bg-surface-muted/30 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">
                        {approval.reviewer}
                      </span>
                      <span className="text-xs capitalize text-muted-foreground">
                        {approval.decision.replaceAll('_', ' ')}
                      </span>
                    </div>
                    {approval.note ? (
                      <p className="mt-1 text-xs text-subtle-foreground">
                        {approval.note}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No approval decisions"
                  description="Approval decisions will appear after a reviewer records one."
                  className="py-6"
                />
              )}
            </CardContent>
          </Card>

          <Suspense fallback={<TimelineCardSkeleton />}>
            <ReviewTimeline organizationId={organization.id} pr={pr} />
          </Suspense>
        </div>
      </section>
    </div>
  )
}

type LoadedPullRequest = NonNullable<Awaited<ReturnType<typeof getPullRequest>>>

async function ReviewTimeline({
  organizationId,
  pr,
}: {
  organizationId: string
  pr: LoadedPullRequest
}) {
  const [auditEvents, activityEvents] = await Promise.all([
    listAuditEvents(organizationId, { pullRequestId: pr.id, take: 8 }),
    listActivityEvents(organizationId, { pullRequestId: pr.id, take: 8 }),
  ])
  const timeline = buildPullRequestTimeline({
    pullRequest: pr,
    auditEvents,
    activityEvents,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {timeline.length ? (
          <ol className="space-y-0.5">
            {timeline.map((item, index) => (
              <li
                key={`${item.source}-${item.id}`}
                className="relative flex gap-3 py-2"
              >
                <div className="relative flex flex-col items-center">
                  <span className="mt-1 size-1.5 rounded-full bg-accent ring-2 ring-accent-soft" />
                  {index < timeline.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="absolute top-3 h-full w-px bg-divider"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {item.title}
                  </div>
                  {item.detail ? (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {item.detail}
                    </div>
                  ) : null}
                  <div className="mt-1 text-[11px] uppercase tracking-wider text-subtle-foreground">
                    {item.source} · {formatDate(item.timestamp)}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            title="No review timeline yet"
            description="Timeline entries will appear when review, audit, or agent activity is recorded."
            className="py-6"
          />
        )}
      </CardContent>
    </Card>
  )
}

function TimelineCardSkeleton() {
  return (
    <Card role="status" aria-label="Loading review timeline">
      <CardHeader>
        <CardTitle>Review timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex gap-3">
            <Skeleton className="mt-1 size-1.5 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
