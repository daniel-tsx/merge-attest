import type {
  ActivityEvent,
  AgentSource,
  AiReviewJobSummary,
  AuditEvent,
  PullRequest,
} from '@/lib/types'

export type ReportingMetrics = {
  riskyPullRequestVolume: number
  testGapVolume: number
  aiAssistedVolume: number
  averageApprovalLatencyHours: number
  noisyRules: Array<{ ruleName: string; count: number }>
  repositoryRiskProfiles: Array<{
    repositoryName: string
    averageRiskScore: number
    riskyPullRequests: number
  }>
  aiReviews: {
    queued: number
    inProgress: number
    blocked: number
    skipped: number
    completed: number
    failed: number
    commentsPosted: number
    commentsFiltered: number
  }
}

export type ReviewTimelineItem = {
  id: string
  timestamp: string
  source:
    | 'pull_request'
    | 'audit'
    | 'activity'
    | 'approval'
    | 'comment'
    | 'ai_review'
  title: string
  detail?: string
}

export type SignalKey =
  | 'pendingApprovals'
  | 'highRiskPrs'
  | 'failedCi'
  | 'testGaps'

export type SignalTrend = {
  /** Daily count of matching pull requests over the trailing window. */
  series: number[]
  /** Direction of the series (later half vs earlier half) — describes `series`. */
  trend: 'up' | 'down' | 'flat'
}

const signalPredicates: Record<SignalKey, (pr: PullRequest) => boolean> = {
  pendingApprovals: (pr) => pr.approvalStatus === 'pending',
  highRiskPrs: (pr) => pr.riskLevel === 'high' || pr.riskLevel === 'critical',
  failedCi: (pr) => pr.ciStatus === 'failing',
  testGaps: (pr) => pr.testGapStatus !== 'none',
}

/**
 * Per-signal daily counts over the trailing `days` (bucketed by `updatedAt`,
 * anchored to the latest PR like `buildTrendData`). Derived entirely from the
 * already-loaded pull request list — no extra query.
 */
export function buildSignalTrends(
  pullRequests: PullRequest[],
  days = 7,
): Record<SignalKey, SignalTrend> {
  const latest = pullRequests.reduce((max, pr) => {
    const time = new Date(pr.updatedAt).getTime()
    return Number.isFinite(time) ? Math.max(max, time) : max
  }, 0)
  const end = latest ? new Date(latest) : new Date()
  const dayKeys: string[] = []
  for (let index = 0; index < days; index += 1) {
    const day = new Date(
      Date.UTC(
        end.getUTCFullYear(),
        end.getUTCMonth(),
        end.getUTCDate() - (days - 1 - index),
      ),
    )
    dayKeys.push(day.toISOString().slice(0, 10))
  }
  const dayIndex = new Map(dayKeys.map((key, index) => [key, index]))

  const keys = Object.keys(signalPredicates) as SignalKey[]
  const counts = Object.fromEntries(
    keys.map((key) => [key, new Array<number>(days).fill(0)]),
  ) as Record<SignalKey, number[]>

  for (const pullRequest of pullRequests) {
    const index = dayIndex.get(
      new Date(pullRequest.updatedAt).toISOString().slice(0, 10),
    )
    if (index === undefined) continue
    for (const key of keys) {
      if (signalPredicates[key](pullRequest)) counts[key][index] += 1
    }
  }

  const half = Math.floor(days / 2)
  return Object.fromEntries(
    keys.map((key) => {
      const series = counts[key]
      const earlier = series.slice(0, half).reduce((a, b) => a + b, 0)
      const later = series
        .slice(series.length - half)
        .reduce((a, b) => a + b, 0)
      const trend = later > earlier ? 'up' : later < earlier ? 'down' : 'flat'
      return [key, { series, trend }]
    }),
  ) as Record<SignalKey, SignalTrend>
}

export function getLatestAiReviewJob(pullRequest: PullRequest) {
  return pullRequest.aiReviewJobs[0]
}

export function getAiReviewStatusDetail(job?: AiReviewJobSummary) {
  if (!job) return 'AI review has not been queued for this pull request.'
  return job.statusDetail ?? job.errorMessage ?? `AI review ${job.status}.`
}

export function getAiReviewBlockedAction(job?: AiReviewJobSummary) {
  const detail = getAiReviewStatusDetail(job).toLowerCase()

  if (detail.includes('openrouter') || detail.includes('credential')) {
    return 'Connect or verify an OpenRouter key under AI settings.'
  }
  if (detail.includes('billing') || detail.includes('entitled')) {
    return 'Check billing status or plan entitlement before retrying.'
  }
  if (detail.includes('limit') || detail.includes('usage')) {
    return 'Review usage limits before running more AI reviews.'
  }
  if (detail.includes('disabled')) {
    return 'Enable AI reviews in this repository settings page.'
  }
  if (detail.includes('no reviewable diff') || detail.includes('empty')) {
    return 'No action is needed unless ignored path settings are too broad.'
  }

  return undefined
}

function hoursBetween(start: string, end: string) {
  return Math.max(
    0,
    Math.round(
      ((new Date(end).getTime() - new Date(start).getTime()) /
        (60 * 60 * 1000)) *
        10,
    ) / 10,
  )
}

export function buildReportingMetrics(
  pullRequests: PullRequest[],
): ReportingMetrics {
  const approvalLatencies = pullRequests.flatMap((pullRequest) =>
    pullRequest.approvals.map((approval) =>
      hoursBetween(pullRequest.createdAt, approval.createdAt),
    ),
  )
  const ruleCounts = new Map<string, number>()
  const repositoryBuckets = new Map<
    string,
    { riskTotal: number; pullRequestCount: number; riskyPullRequests: number }
  >()

  for (const pullRequest of pullRequests) {
    for (const violation of pullRequest.ruleViolations) {
      ruleCounts.set(
        violation.ruleName,
        (ruleCounts.get(violation.ruleName) ?? 0) + 1,
      )
    }

    const bucket = repositoryBuckets.get(pullRequest.repositoryName) ?? {
      riskTotal: 0,
      pullRequestCount: 0,
      riskyPullRequests: 0,
    }
    bucket.riskTotal += pullRequest.riskScore
    bucket.pullRequestCount += 1
    if (
      pullRequest.riskLevel === 'high' ||
      pullRequest.riskLevel === 'critical'
    ) {
      bucket.riskyPullRequests += 1
    }
    repositoryBuckets.set(pullRequest.repositoryName, bucket)
  }

  return {
    riskyPullRequestVolume: pullRequests.filter(
      (item) => item.riskLevel === 'high' || item.riskLevel === 'critical',
    ).length,
    testGapVolume: pullRequests.filter((item) => item.testGapStatus !== 'none')
      .length,
    aiAssistedVolume: pullRequests.filter((item) => item.aiAssisted).length,
    averageApprovalLatencyHours: approvalLatencies.length
      ? Math.round(
          (approvalLatencies.reduce((total, item) => total + item, 0) /
            approvalLatencies.length) *
            10,
        ) / 10
      : 0,
    noisyRules: Array.from(ruleCounts.entries())
      .map(([ruleName, count]) => ({ ruleName, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5),
    repositoryRiskProfiles: Array.from(repositoryBuckets.entries())
      .map(([repositoryName, bucket]) => ({
        repositoryName,
        averageRiskScore: bucket.pullRequestCount
          ? Math.round(bucket.riskTotal / bucket.pullRequestCount)
          : 0,
        riskyPullRequests: bucket.riskyPullRequests,
      }))
      .sort((left, right) => right.averageRiskScore - left.averageRiskScore),
    aiReviews: buildAiReviewMetrics(pullRequests),
  }
}

export function buildAiReviewMetrics(pullRequests: PullRequest[]) {
  const metrics = {
    queued: 0,
    inProgress: 0,
    blocked: 0,
    skipped: 0,
    completed: 0,
    failed: 0,
    commentsPosted: 0,
    commentsFiltered: 0,
  }

  for (const pullRequest of pullRequests) {
    for (const job of pullRequest.aiReviewJobs) {
      if (job.status === 'queued') metrics.queued += 1
      if (job.status === 'in_progress') metrics.inProgress += 1
      if (job.status === 'blocked') metrics.blocked += 1
      if (job.status === 'skipped') metrics.skipped += 1
      if (job.status === 'completed') metrics.completed += 1
      if (job.status === 'failed') metrics.failed += 1
      metrics.commentsPosted += job.commentsCount
      metrics.commentsFiltered += job.skippedCommentsCount
    }
  }

  return metrics
}

export type AuthorshipLedger = {
  totals: {
    total: number
    aiAuthored: number
    aiAuthoredPct: number
    humanAuthored: number
    aiLinesAdded: number
    totalLinesAdded: number
    aiLinePct: number
  }
  reviewCoverage: {
    aiMerged: number
    aiMergedReviewed: number
    aiMergedBypassed: number
    reviewedPct: number
  }
  byAgent: Array<{
    agentSource: AgentSource
    count: number
    pct: number
    linesAdded: number
    reviewedCount: number
    bypassedCount: number
    avgRiskScore: number
  }>
  trend: Array<{
    date: string
    aiAuthoredPct: number
    aiCount: number
    total: number
  }>
}

function authorshipPercent(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0
}

function isAiAuthored(pullRequest: PullRequest) {
  return pullRequest.aiAssisted === true
}

function isHumanReviewed(pullRequest: PullRequest) {
  return (
    pullRequest.approvalStatus === 'approved' ||
    pullRequest.approvalStatus === 'risk_accepted'
  )
}

/**
 * AI authorship ledger — what share of pull requests (and added lines) AI agents
 * authored, how that splits by agent, and how much AI-authored merged work
 * carried a human sign-off. Counts are PR- and line-volume based (not intra-file
 * blame), so framing in the UI/export stays honest.
 */
export function buildAuthorshipLedger(
  pullRequests: PullRequest[],
  days = 14,
): AuthorshipLedger {
  const total = pullRequests.length
  const aiPullRequests = pullRequests.filter(isAiAuthored)
  const aiAuthored = aiPullRequests.length
  const totalLinesAdded = pullRequests.reduce(
    (sum, pr) => sum + pr.linesAdded,
    0,
  )
  const aiLinesAdded = aiPullRequests.reduce(
    (sum, pr) => sum + pr.linesAdded,
    0,
  )

  const aiMergedPullRequests = aiPullRequests.filter(
    (pr) => pr.status === 'merged',
  )
  const aiMergedReviewed = aiMergedPullRequests.filter(isHumanReviewed).length
  const aiMerged = aiMergedPullRequests.length

  const agentBuckets = new Map<
    AgentSource,
    {
      count: number
      linesAdded: number
      reviewedCount: number
      bypassedCount: number
      riskTotal: number
    }
  >()
  for (const pullRequest of pullRequests) {
    const bucket = agentBuckets.get(pullRequest.agentSource) ?? {
      count: 0,
      linesAdded: 0,
      reviewedCount: 0,
      bypassedCount: 0,
      riskTotal: 0,
    }
    bucket.count += 1
    bucket.linesAdded += pullRequest.linesAdded
    bucket.riskTotal += pullRequest.riskScore
    if (pullRequest.status === 'merged') {
      if (isHumanReviewed(pullRequest)) bucket.reviewedCount += 1
      else bucket.bypassedCount += 1
    }
    agentBuckets.set(pullRequest.agentSource, bucket)
  }

  const byAgent = Array.from(agentBuckets.entries())
    .map(([agentSource, bucket]) => ({
      agentSource,
      count: bucket.count,
      pct: authorshipPercent(bucket.count, total),
      linesAdded: bucket.linesAdded,
      reviewedCount: bucket.reviewedCount,
      bypassedCount: bucket.bypassedCount,
      avgRiskScore: bucket.count
        ? Math.round(bucket.riskTotal / bucket.count)
        : 0,
    }))
    .sort((left, right) => right.count - left.count)

  return {
    totals: {
      total,
      aiAuthored,
      aiAuthoredPct: authorshipPercent(aiAuthored, total),
      humanAuthored: total - aiAuthored,
      aiLinesAdded,
      totalLinesAdded,
      aiLinePct: authorshipPercent(aiLinesAdded, totalLinesAdded),
    },
    reviewCoverage: {
      aiMerged,
      aiMergedReviewed,
      aiMergedBypassed: aiMerged - aiMergedReviewed,
      reviewedPct: authorshipPercent(aiMergedReviewed, aiMerged),
    },
    byAgent,
    trend: buildAuthorshipTrend(pullRequests, days),
  }
}

function buildAuthorshipTrend(pullRequests: PullRequest[], days: number) {
  const latest = pullRequests.reduce((max, pr) => {
    const time = new Date(pr.updatedAt).getTime()
    return Number.isFinite(time) ? Math.max(max, time) : max
  }, 0)
  const end = latest ? new Date(latest) : new Date()
  const buckets = new Map<string, { total: number; aiCount: number }>()
  for (let index = 0; index < days; index += 1) {
    const day = new Date(
      Date.UTC(
        end.getUTCFullYear(),
        end.getUTCMonth(),
        end.getUTCDate() - (days - 1 - index),
      ),
    )
    buckets.set(day.toISOString().slice(0, 10), { total: 0, aiCount: 0 })
  }

  for (const pullRequest of pullRequests) {
    const key = new Date(pullRequest.updatedAt).toISOString().slice(0, 10)
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.total += 1
    if (isAiAuthored(pullRequest)) bucket.aiCount += 1
  }

  return Array.from(buckets.entries()).map(([date, bucket]) => ({
    date,
    total: bucket.total,
    aiCount: bucket.aiCount,
    aiAuthoredPct: authorshipPercent(bucket.aiCount, bucket.total),
  }))
}

export function buildPullRequestTimeline(input: {
  pullRequest: PullRequest
  auditEvents: AuditEvent[]
  activityEvents: ActivityEvent[]
}): ReviewTimelineItem[] {
  const { pullRequest, auditEvents, activityEvents } = input
  const items: ReviewTimelineItem[] = [
    {
      id: `${pullRequest.id}-opened`,
      timestamp: pullRequest.createdAt,
      source: 'pull_request',
      title: `Pull request #${pullRequest.number} opened`,
      detail: `${pullRequest.author} opened ${pullRequest.branch} into ${pullRequest.baseBranch}.`,
    },
    {
      id: `${pullRequest.id}-risk`,
      timestamp: pullRequest.updatedAt,
      source: 'pull_request',
      title: `Risk scored ${pullRequest.riskScore} (${pullRequest.riskLevel})`,
      detail: `${pullRequest.filesChangedCount} files changed with ${pullRequest.ruleViolations.length} rule violations.`,
    },
  ]

  for (const approval of pullRequest.approvals) {
    items.push({
      id: approval.id,
      timestamp: approval.createdAt,
      source: 'approval',
      title: `${approval.reviewer} ${approval.decision.replaceAll('_', ' ')}`,
      detail: approval.note || undefined,
    })
  }

  for (const comment of pullRequest.comments) {
    items.push({
      id: comment.id,
      timestamp: comment.createdAt,
      source: 'comment',
      title: `${comment.author} added an internal review note`,
      detail: comment.body,
    })
  }

  for (const job of pullRequest.aiReviewJobs) {
    items.push({
      id: job.id,
      timestamp: job.completedAt ?? job.startedAt ?? job.createdAt,
      source: 'ai_review',
      title: `AI review ${job.status.replaceAll('_', ' ')}`,
      detail: [
        job.statusDetail ?? job.errorMessage,
        job.commentsCount
          ? `${job.commentsCount} comments prepared`
          : undefined,
        job.skippedCommentsCount
          ? `${job.skippedCommentsCount} comments filtered`
          : undefined,
      ]
        .filter(Boolean)
        .join(' · '),
    })
  }

  for (const event of auditEvents) {
    items.push({
      id: event.id,
      timestamp: event.createdAt,
      source: 'audit',
      title: event.summary,
      detail: event.eventType.replaceAll('_', ' '),
    })
  }

  for (const event of activityEvents) {
    items.push({
      id: event.id,
      timestamp: event.timestamp,
      source: 'activity',
      title: event.summary,
      detail: `${event.repositoryName} by ${event.actor}`,
    })
  }

  if (pullRequest.status === 'merged' || pullRequest.status === 'closed') {
    items.push({
      id: `${pullRequest.id}-${pullRequest.status}`,
      timestamp: pullRequest.updatedAt,
      source: 'pull_request',
      title: `Pull request ${pullRequest.status}`,
    })
  }

  return items.sort(
    (left, right) =>
      new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
  )
}

export function serializeIncidentReviewPacket(input: {
  pullRequest: PullRequest
  timeline: ReviewTimelineItem[]
}) {
  const { pullRequest, timeline } = input
  const lines = [
    `# Auteur Review Packet: ${pullRequest.repositoryName} #${pullRequest.number}`,
    '',
    `Title: ${pullRequest.title}`,
    `Status: ${pullRequest.status}`,
    `Author: ${pullRequest.author}`,
    `Branch: ${pullRequest.branch} -> ${pullRequest.baseBranch}`,
    `Risk: ${pullRequest.riskScore} (${pullRequest.riskLevel})`,
    `Approval: ${pullRequest.approvalStatus.replaceAll('_', ' ')}`,
    `Assigned reviewer: ${pullRequest.assignedReviewer?.name ?? 'Unassigned'}`,
    '',
    '## AI Review',
    ...(pullRequest.aiReviewJobs.length
      ? pullRequest.aiReviewJobs.map((job) =>
          [
            `- Status: ${job.status.replaceAll('_', ' ')}`,
            job.statusDetail ? `  Detail: ${job.statusDetail}` : undefined,
            job.model ? `  Model: ${job.model}` : undefined,
            `  Comments posted: ${job.commentsCount}`,
            `  Comments filtered: ${job.skippedCommentsCount}`,
            `  GitHub inline review: ${job.githubReviewId ? 'published' : 'not published'}`,
            `  GitHub summary comment: ${job.githubManagedCommentId ? 'published' : 'not published'}`,
            `  GitHub check run: ${job.githubCheckRunId ? 'published' : 'not published'}`,
          ]
            .filter(Boolean)
            .join('\n'),
        )
      : ['- No AI review job recorded']),
    '',
    '## Rule Violations',
    ...(pullRequest.ruleViolations.length
      ? pullRequest.ruleViolations.map(
          (violation) =>
            `- ${violation.ruleName}: ${violation.actionType.replaceAll('_', ' ')} (${violation.severity})`,
        )
      : ['- None']),
    '',
    '## Test Gap Analysis',
    pullRequest.testGapAnalysis.summary,
    '',
    '## Timeline',
    ...timeline.map(
      (item) =>
        `- ${item.timestamp} [${item.source}] ${item.title}${
          item.detail ? ` - ${item.detail}` : ''
        }`,
    ),
  ]

  return lines.join('\n')
}
