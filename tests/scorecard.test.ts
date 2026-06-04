import { describe, expect, it } from 'vitest'
import { buildAgentScorecards } from '../lib/agents/scorecard'
import type { PullRequest } from '../lib/types'

function makePr(overrides: Partial<PullRequest>): PullRequest {
  return {
    id: overrides.id ?? `pr-${overrides.number ?? 1}`,
    repositoryId: 'repo-1',
    repositoryName: 'billing-api',
    number: overrides.number ?? 1,
    title: 'Change something',
    author: 'agent',
    branch: 'feature/x',
    baseBranch: 'main',
    status: 'open',
    aiAssisted: true,
    agentSource: 'cursor',
    attributionConfidence: 90,
    attributionEvidence: [],
    riskScore: 10,
    riskLevel: 'low',
    testGapStatus: 'none',
    ciStatus: 'unknown',
    approvalStatus: 'not_required',
    filesChangedCount: 1,
    linesAdded: 1,
    linesDeleted: 0,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T06:00:00.000Z',
    reviewSlaStatus: 'none',
    files: [],
    riskSignals: [],
    testGapAnalysis: {
      status: 'none',
      summary: '',
      affectedFiles: [],
      suggestedTestFiles: [],
      suggestedTestCases: [],
      confidence: 'low',
    },
    ruleViolations: [],
    approvals: [],
    comments: [],
    aiReviewJobs: [],
    ...overrides,
  }
}

describe('buildAgentScorecards', () => {
  it('gives a clean agent a perfect trust score with no deductions', () => {
    const cards = buildAgentScorecards([
      makePr({
        number: 1,
        agentSource: 'claude_code',
        status: 'merged',
        approvalStatus: 'approved',
      }),
    ])

    expect(cards).toHaveLength(1)
    expect(cards[0].agentSource).toBe('claude_code')
    expect(cards[0].trustScore).toBe(100)
    expect(cards[0].penalties).toHaveLength(0)
  })

  it('deducts for high risk, test gaps, and merging without sign-off', () => {
    const [card] = buildAgentScorecards([
      makePr({
        number: 2,
        agentSource: 'cursor',
        status: 'merged',
        approvalStatus: 'pending',
        riskLevel: 'critical',
        testGapStatus: 'high',
      }),
    ])

    expect(card.trustScore).toBeLessThan(100)
    expect(card.highRiskRate).toBe(1)
    expect(card.bypassedRate).toBe(1)
    const labels = card.penalties.map((penalty) => penalty.label)
    expect(labels).toContain('High-risk PRs')
    expect(labels).toContain('Test gaps')
    expect(labels).toContain('Merged without sign-off')
  })

  it('detects reverted pull requests via revert references', () => {
    const cards = buildAgentScorecards([
      makePr({
        number: 5,
        agentSource: 'devin',
        status: 'merged',
        approvalStatus: 'approved',
      }),
      makePr({
        id: 'pr-revert',
        number: 6,
        agentSource: 'manual',
        title: 'Revert "Risky change" (#5)',
        status: 'merged',
        approvalStatus: 'approved',
      }),
    ])

    const devin = cards.find((card) => card.agentSource === 'devin')!
    expect(devin.revertedRate).toBe(1)
    expect(devin.penalties.some((p) => p.label === 'Reverted')).toBe(true)
  })

  it('orders agents riskiest-first by trust score', () => {
    const cards = buildAgentScorecards([
      makePr({
        number: 10,
        agentSource: 'claude_code',
        status: 'merged',
        approvalStatus: 'approved',
      }),
      makePr({
        number: 11,
        agentSource: 'cursor',
        status: 'merged',
        approvalStatus: 'pending',
        riskLevel: 'critical',
        testGapStatus: 'high',
      }),
    ])

    expect(cards[0].agentSource).toBe('cursor')
    expect(cards[0].trustScore).toBeLessThan(cards[1].trustScore)
  })

  it('computes average approval latency from the first approval', () => {
    const [card] = buildAgentScorecards([
      makePr({
        number: 20,
        agentSource: 'copilot',
        status: 'merged',
        approvalStatus: 'approved',
        createdAt: '2026-05-01T00:00:00.000Z',
        approvals: [
          {
            id: 'a1',
            reviewer: 'Maya',
            decision: 'approved',
            note: '',
            createdAt: '2026-05-01T05:00:00.000Z',
          },
        ],
      }),
    ])

    expect(card.avgApprovalLatencyHours).toBe(5)
  })
})
