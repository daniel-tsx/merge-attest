import { describe, expect, it } from 'vitest'
import {
  buildPullRequestTimeline,
  buildReportingMetrics,
  buildSignalTrends,
  serializeIncidentReviewPacket,
} from '../lib/reporting'
import type { PullRequest } from '../lib/types'

const pullRequest: PullRequest = {
  id: 'pr-1',
  repositoryId: 'repo-1',
  repositoryName: 'billing-api',
  number: 42,
  title: 'Harden Lemon Squeezy webhook handling',
  author: 'cursor-agent',
  branch: 'agent/lemon-squeezy-webhook',
  baseBranch: 'main',
  status: 'merged',
  aiAssisted: true,
  agentSource: 'cursor',
  attributionConfidence: 95,
  attributionEvidence: [
    {
      signal: 'commit_trailer',
      agentSource: 'cursor',
      detail: 'Co-authored-by trailer on 2 commits',
      weight: 95,
    },
  ],
  riskScore: 82,
  riskLevel: 'critical',
  testGapStatus: 'high',
  ciStatus: 'passing',
  approvalStatus: 'approved',
  filesChangedCount: 2,
  linesAdded: 80,
  linesDeleted: 12,
  createdAt: '2026-05-01T08:00:00.000Z',
  updatedAt: '2026-05-01T12:00:00.000Z',
  assignedReviewer: {
    id: 'user-1',
    name: 'Maya Chen',
    email: 'maya@example.com',
  },
  reviewDueAt: '2026-05-02T08:00:00.000Z',
  reviewSlaStatus: 'on_track',
  reviewerSuggestion: 'Security team',
  files: [],
  riskSignals: [],
  testGapAnalysis: {
    status: 'high',
    summary: 'Payment webhook changed without enough tests.',
    affectedFiles: ['app/api/lemon-squeezy/webhook/route.ts'],
    suggestedTestFiles: ['tests/lemon-squeezy-webhooks.test.ts'],
    suggestedTestCases: ['Reject invalid signatures'],
    confidence: 'high',
  },
  ruleViolations: [
    {
      id: 'violation-1',
      ruleName: 'Billing security review',
      summary: 'Billing changes need approval',
      severity: 'critical',
      actionType: 'request_security_review',
      codeOwnerHint: 'Security team',
      resolved: false,
      createdAt: '2026-05-01T08:30:00.000Z',
    },
  ],
  approvals: [
    {
      id: 'approval-1',
      reviewer: 'Maya Chen',
      decision: 'approved',
      note: 'Tests added and verified.',
      createdAt: '2026-05-01T10:00:00.000Z',
    },
  ],
  comments: [
    {
      id: 'comment-1',
      author: 'Owen Reed',
      body: 'Confirm Lemon Squeezy signature fixture coverage.',
      createdAt: '2026-05-01T09:00:00.000Z',
    },
  ],
  aiReviewJobs: [
    {
      id: 'ai-review-1',
      status: 'completed',
      statusDetail: 'AI review completed.',
      model: 'openai/gpt-5.1',
      githubReviewId: 'review-1',
      githubManagedCommentId: 'comment-1',
      githubCheckRunId: 'check-1',
      commentsCount: 2,
      skippedCommentsCount: 1,
      createdAt: '2026-05-01T10:30:00.000Z',
      updatedAt: '2026-05-01T10:35:00.000Z',
      completedAt: '2026-05-01T10:35:00.000Z',
    },
  ],
}

describe('reporting metrics', () => {
  it('computes compliance volumes, latency, noisy rules, and repo risk', () => {
    const metrics = buildReportingMetrics([pullRequest])

    expect(metrics.riskyPullRequestVolume).toBe(1)
    expect(metrics.testGapVolume).toBe(1)
    expect(metrics.aiAssistedVolume).toBe(1)
    expect(metrics.averageApprovalLatencyHours).toBe(2)
    expect(metrics.noisyRules[0]).toEqual({
      ruleName: 'Billing security review',
      count: 1,
    })
    expect(metrics.repositoryRiskProfiles[0]).toMatchObject({
      repositoryName: 'billing-api',
      averageRiskScore: 82,
    })
    expect(metrics.aiReviews).toMatchObject({
      completed: 1,
      commentsPosted: 2,
      commentsFiltered: 1,
    })
  })
})

describe('signal trends', () => {
  const makePr = (overrides: Partial<PullRequest>): PullRequest => ({
    ...pullRequest,
    ...overrides,
  })

  it('buckets matching pull requests into a 7-day series with direction', () => {
    const trends = buildSignalTrends([
      makePr({
        id: 'a',
        updatedAt: '2026-05-07T12:00:00.000Z',
        riskLevel: 'critical',
        ciStatus: 'failing',
        testGapStatus: 'high',
        approvalStatus: 'pending',
      }),
      makePr({
        id: 'b',
        updatedAt: '2026-05-06T12:00:00.000Z',
        riskLevel: 'high',
        ciStatus: 'passing',
        testGapStatus: 'none',
        approvalStatus: 'approved',
      }),
      makePr({
        id: 'c',
        updatedAt: '2026-05-01T12:00:00.000Z',
        riskLevel: 'low',
        ciStatus: 'passing',
        testGapStatus: 'none',
        approvalStatus: 'approved',
      }),
      // Outside the trailing 7-day window — must be excluded.
      makePr({
        id: 'd',
        updatedAt: '2026-04-01T12:00:00.000Z',
        riskLevel: 'critical',
        ciStatus: 'failing',
        testGapStatus: 'high',
        approvalStatus: 'pending',
      }),
    ])

    const sum = (series: number[]) => series.reduce((total, n) => total + n, 0)

    expect(trends.highRiskPrs.series).toHaveLength(7)
    expect(sum(trends.highRiskPrs.series)).toBe(2)
    expect(trends.highRiskPrs.series.at(-1)).toBe(1)
    expect(trends.highRiskPrs.trend).toBe('up')

    expect(sum(trends.pendingApprovals.series)).toBe(1)
    expect(trends.failedCi.trend).toBe('up')
    expect(trends.testGaps.trend).toBe('up')
  })
})

describe('pull request review timeline', () => {
  it('combines audit, activity, approvals, comments, and merge state', () => {
    const timeline = buildPullRequestTimeline({
      pullRequest,
      auditEvents: [
        {
          id: 'audit-1',
          eventType: 'github_comment_posted',
          summary: 'Posted GitHub approval comment',
          actor: 'Auteur',
          repositoryName: 'billing-api',
          pullRequestNumber: 42,
          metadata: {},
          createdAt: '2026-05-01T11:00:00.000Z',
        },
      ],
      activityEvents: [
        {
          id: 'activity-1',
          timestamp: '2026-05-01T08:15:00.000Z',
          repositoryId: 'repo-1',
          repositoryName: 'billing-api',
          pullRequestId: 'pr-1',
          pullRequestNumber: 42,
          actor: 'cursor-agent',
          agentSource: 'cursor',
          eventType: 'files_changed',
          summary: 'Webhook files changed',
          riskLevel: 'critical',
          metadata: {},
        },
      ],
    })

    expect(timeline.map((item) => item.source)).toContain('approval')
    expect(timeline.map((item) => item.source)).toContain('comment')
    expect(timeline.map((item) => item.source)).toContain('ai_review')
    expect(timeline.map((item) => item.source)).toContain('audit')
    expect(timeline.at(-1)?.title).toBe('Pull request merged')

    const packet = serializeIncidentReviewPacket({ pullRequest, timeline })

    expect(packet).toContain('Auteur Review Packet')
    expect(packet).toContain('## AI Review')
    expect(packet).toContain('GitHub inline review: published')
    expect(packet).not.toContain('review-1')
    expect(packet).toContain('Billing security review')
    expect(packet).toContain('Payment webhook changed without enough tests.')
  })
})
