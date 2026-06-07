import { describe, expect, it } from 'vitest'
import {
  mapGitHubWebhookDiagnostic,
  mapPullRequest,
  mapRepository,
} from '../lib/data/app-data'

describe('Prisma data mappers', () => {
  it('maps database repositories to view repositories', () => {
    const date = new Date('2026-05-01T00:00:00.000Z')

    expect(
      mapRepository({
        id: 'repo-1',
        name: 'mergeattest',
        provider: 'github',
        owner: 'northstar',
        defaultBranch: 'main',
        visibility: 'private',
        connectedStatus: 'connected',
        lastSyncedAt: date,
        activeRulesCount: 3,
        monthlyPrCheckUsage: 42,
        riskProfile: 'high',
        createdAt: date,
        updatedAt: date,
      }),
    ).toMatchObject({
      id: 'repo-1',
      provider: 'GitHub',
      visibility: 'private',
      connectedStatus: 'connected',
      riskProfile: 'high',
    })
  })

  it('maps pull request relations into the existing UI type', () => {
    const date = new Date('2026-05-01T00:00:00.000Z')
    const result = mapPullRequest({
      id: 'pr-1',
      repositoryId: 'repo-1',
      repository: { name: 'mergeattest' },
      number: 12,
      title: 'Add auth guard',
      author: 'cursor-agent',
      headSha: 'abc123',
      branch: 'agent/auth',
      baseBranch: 'main',
      status: 'open',
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
      riskScore: 65,
      riskLevel: 'high',
      testGapStatus: 'high',
      ciStatus: 'pending',
      approvalStatus: 'pending',
      filesChangedCount: 1,
      linesAdded: 20,
      linesDeleted: 4,
      assignedReviewerId: 'user-1',
      reviewDueAt: date,
      createdAt: date,
      updatedAt: date,
      assignedReviewer: {
        id: 'user-1',
        name: 'Maya Chen',
        email: 'maya@example.com',
      },
      files: [
        {
          path: 'lib/auth.ts',
          additions: 20,
          deletions: 4,
          changeType: 'modified',
        },
      ],
      riskSignals: [
        {
          key: 'auth_changed',
          label: 'Auth changed',
          score: 25,
          level: 'medium',
          filePaths: ['lib/auth.ts'],
        },
      ],
      testGapAnalysis: {
        status: 'high',
        summary: 'High-impact source files changed without accompanying tests.',
        affectedFiles: ['lib/auth.ts'],
        confidence: 'high',
        suggestions: [
          { testFile: 'tests/auth.test.ts', testCase: 'Covers auth guard.' },
        ],
      },
      ruleViolations: [
        {
          id: 'violation-1',
          summary: 'Security review required',
          resolved: false,
          createdAt: date,
          rule: {
            name: 'Sensitive change review',
            severity: 'critical',
            actionType: 'require_approval',
            codeOwnerHint: 'Security team',
          },
        },
      ],
      approvals: [
        {
          id: 'approval-1',
          decision: 'requested_tests',
          note: null,
          createdAt: date,
          reviewer: { name: 'Maya Chen', email: 'maya@example.com' },
        },
      ],
      comments: [
        {
          id: 'comment-1',
          body: 'Waiting on tests.',
          createdAt: date,
          author: { name: 'Owen Reed', email: 'owen@example.com' },
        },
      ],
      aiReviewJobs: [
        {
          id: 'ai-review-1',
          status: 'blocked',
          statusDetail: 'OpenRouter credentials are not configured yet.',
          model: null,
          githubReviewId: null,
          githubManagedCommentId: null,
          githubCheckRunId: null,
          commentsCount: 0,
          skippedCommentsCount: 0,
          errorMessage: null,
          startedAt: date,
          completedAt: date,
          createdAt: date,
          updatedAt: date,
        },
      ],
    })

    expect(result.repositoryName).toBe('mergeattest')
    expect(result.headSha).toBe('abc123')
    expect(result.riskSignals[0].filePaths).toEqual(['lib/auth.ts'])
    expect(result.testGapAnalysis.suggestedTestFiles).toEqual([
      'tests/auth.test.ts',
    ])
    expect(result.ruleViolations[0].ruleName).toBe('Sensitive change review')
    expect(result.reviewerSuggestion).toBe('Security team')
    expect(result.assignedReviewer?.name).toBe('Maya Chen')
    expect(result.approvals[0].reviewer).toBe('Maya Chen')
    expect(result.comments[0].author).toBe('Owen Reed')
    expect(result.aiReviewJobs[0].status).toBe('blocked')
  })

  it('maps webhook delivery diagnostics for GitHub settings', () => {
    const date = new Date('2026-05-01T00:00:00.000Z')
    const result = mapGitHubWebhookDiagnostic({
      id: 'delivery-1',
      deliveryId: 'github-delivery-1',
      event: 'check_run',
      action: 'completed',
      status: 'failed',
      message: 'GitHub API failed',
      attemptCount: 2,
      lastAttemptAt: date,
      nextRetryAt: date,
      lastError: 'GitHub API failed',
      createdAt: date,
      processedAt: null,
    })

    expect(result).toMatchObject({
      deliveryId: 'github-delivery-1',
      event: 'check_run',
      action: 'completed',
      status: 'failed',
      attemptCount: 2,
      lastError: 'GitHub API failed',
    })
  })
})
