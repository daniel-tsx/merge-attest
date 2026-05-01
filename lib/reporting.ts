import type { ActivityEvent, AuditEvent, PullRequest } from '@/lib/types'

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
}

export type ReviewTimelineItem = {
  id: string
  timestamp: string
  source: 'pull_request' | 'audit' | 'activity' | 'approval' | 'comment'
  title: string
  detail?: string
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
  }
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
    `# AgentGate Review Packet: ${pullRequest.repositoryName} #${pullRequest.number}`,
    '',
    `Title: ${pullRequest.title}`,
    `Status: ${pullRequest.status}`,
    `Author: ${pullRequest.author}`,
    `Branch: ${pullRequest.branch} -> ${pullRequest.baseBranch}`,
    `Risk: ${pullRequest.riskScore} (${pullRequest.riskLevel})`,
    `Approval: ${pullRequest.approvalStatus.replaceAll('_', ' ')}`,
    `Assigned reviewer: ${pullRequest.assignedReviewer?.name ?? 'Unassigned'}`,
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
