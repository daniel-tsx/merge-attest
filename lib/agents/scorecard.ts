import type { AgentSource, PullRequest } from '@/lib/types'

/**
 * Per-agent trust scorecard — deterministic, explainable analytics built on the
 * attribution data. Answers "which AI agent produces the riskiest code in this
 * org, and how does its track record compare?"
 *
 * Every metric is derived from already-loaded pull requests (no extra query) and
 * the trust score is a transparent weighted penalty model, not a black box.
 */

export type ScorecardPenalty = {
  label: string
  points: number
}

export type AgentScorecardEntry = {
  agentSource: AgentSource
  total: number
  merged: number
  highRiskRate: number
  testGapRate: number
  ruleViolationRate: number
  revertedRate: number
  bypassedRate: number
  avgApprovalLatencyHours: number
  trustScore: number
  penalties: ScorecardPenalty[]
}

const REVERT_REFERENCE = /\brevert(?:s|ed)?\b[^#]*#(\d+)/i

function ratio(part: number, whole: number) {
  return whole > 0 ? part / whole : 0
}

function hoursBetween(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(0, ms / (60 * 60 * 1000))
}

/** Set of `repository#number` for PRs that a later revert PR references. */
function buildRevertedReferences(pullRequests: PullRequest[]): Set<string> {
  const reverted = new Set<string>()
  for (const pullRequest of pullRequests) {
    const match = pullRequest.title.match(REVERT_REFERENCE)
    if (match) {
      reverted.add(`${pullRequest.repositoryName}#${match[1]}`)
    }
  }
  return reverted
}

function isBypassed(pullRequest: PullRequest) {
  return (
    pullRequest.status === 'merged' &&
    pullRequest.approvalStatus !== 'approved' &&
    pullRequest.approvalStatus !== 'risk_accepted'
  )
}

function firstApprovalLatency(pullRequest: PullRequest): number | null {
  const approval = pullRequest.approvals.find(
    (item) => item.decision === 'approved' || item.decision === 'risk_accepted',
  )
  return approval
    ? hoursBetween(pullRequest.createdAt, approval.createdAt)
    : null
}

function scoreEntry(
  agentSource: AgentSource,
  pullRequests: PullRequest[],
  revertedReferences: Set<string>,
): AgentScorecardEntry {
  const total = pullRequests.length
  const merged = pullRequests.filter((pr) => pr.status === 'merged')

  const highRisk = pullRequests.filter(
    (pr) => pr.riskLevel === 'high' || pr.riskLevel === 'critical',
  ).length
  const testGaps = pullRequests.filter(
    (pr) => pr.testGapStatus !== 'none',
  ).length
  const withViolations = pullRequests.filter(
    (pr) => pr.ruleViolations.length > 0,
  ).length
  const revertedCount = merged.filter((pr) =>
    revertedReferences.has(`${pr.repositoryName}#${pr.number}`),
  ).length
  const bypassedCount = merged.filter(isBypassed).length

  const latencies = pullRequests
    .map(firstApprovalLatency)
    .filter((value): value is number => value !== null)

  const highRiskRate = ratio(highRisk, total)
  const testGapRate = ratio(testGaps, total)
  const ruleViolationRate = ratio(withViolations, total)
  const revertedRate = ratio(revertedCount, merged.length)
  const bypassedRate = ratio(bypassedCount, merged.length)

  const penalties: ScorecardPenalty[] = [
    { label: 'High-risk PRs', points: Math.round(highRiskRate * 30) },
    { label: 'Test gaps', points: Math.round(testGapRate * 20) },
    { label: 'Rule violations', points: Math.round(ruleViolationRate * 20) },
    { label: 'Reverted', points: Math.round(revertedRate * 20) },
    { label: 'Merged without sign-off', points: Math.round(bypassedRate * 10) },
  ]
  const trustScore = Math.max(
    0,
    100 - penalties.reduce((sum, penalty) => sum + penalty.points, 0),
  )

  return {
    agentSource,
    total,
    merged: merged.length,
    highRiskRate,
    testGapRate,
    ruleViolationRate,
    revertedRate,
    bypassedRate,
    avgApprovalLatencyHours: latencies.length
      ? Math.round(
          (latencies.reduce((sum, value) => sum + value, 0) /
            latencies.length) *
            10,
        ) / 10
      : 0,
    trustScore,
    penalties: penalties.filter((penalty) => penalty.points > 0),
  }
}

/**
 * One scorecard entry per agent source present in the data, riskiest first
 * (lowest trust score), then by volume.
 */
export function buildAgentScorecards(
  pullRequests: PullRequest[],
): AgentScorecardEntry[] {
  const revertedReferences = buildRevertedReferences(pullRequests)
  const byAgent = new Map<AgentSource, PullRequest[]>()
  for (const pullRequest of pullRequests) {
    const bucket = byAgent.get(pullRequest.agentSource) ?? []
    bucket.push(pullRequest)
    byAgent.set(pullRequest.agentSource, bucket)
  }

  return Array.from(byAgent.entries())
    .map(([agentSource, prs]) =>
      scoreEntry(agentSource, prs, revertedReferences),
    )
    .sort(
      (left, right) =>
        left.trustScore - right.trustScore || right.total - left.total,
    )
}
