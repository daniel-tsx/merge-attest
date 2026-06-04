import { describe, expect, it } from 'vitest'
import { buildAuthorshipLedger } from '../lib/reporting'
import {
  buildAuthorshipEvidenceBundle,
  serializeAuthorshipLedgerCsv,
} from '../lib/compliance-export'
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
    attributionEvidence: [
      {
        signal: 'commit_trailer',
        agentSource: 'cursor',
        detail: 'Co-authored-by trailer on 1 commit',
        weight: 95,
      },
    ],
    riskScore: 40,
    riskLevel: 'medium',
    testGapStatus: 'none',
    ciStatus: 'unknown',
    approvalStatus: 'not_required',
    filesChangedCount: 1,
    linesAdded: 100,
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

describe('buildAuthorshipLedger', () => {
  const pullRequests = [
    makePr({ number: 1, agentSource: 'cursor', linesAdded: 100 }),
    makePr({
      number: 2,
      agentSource: 'claude_code',
      status: 'merged',
      approvalStatus: 'approved',
      linesAdded: 100,
    }),
    makePr({
      number: 3,
      agentSource: 'manual',
      aiAssisted: false,
      attributionEvidence: [],
      linesAdded: 200,
    }),
  ]

  it('computes AI authorship share by count and line volume', () => {
    const ledger = buildAuthorshipLedger(pullRequests)
    expect(ledger.totals.total).toBe(3)
    expect(ledger.totals.aiAuthored).toBe(2)
    expect(ledger.totals.aiAuthoredPct).toBeCloseTo(66.7, 1)
    expect(ledger.totals.humanAuthored).toBe(1)
    // AI lines 200 of 400 total
    expect(ledger.totals.aiLinePct).toBe(50)
  })

  it('tracks reviewed vs bypassed coverage for merged AI work', () => {
    const ledger = buildAuthorshipLedger([
      makePr({ number: 10, status: 'merged', approvalStatus: 'approved' }),
      makePr({ number: 11, status: 'merged', approvalStatus: 'pending' }),
    ])
    expect(ledger.reviewCoverage.aiMerged).toBe(2)
    expect(ledger.reviewCoverage.aiMergedReviewed).toBe(1)
    expect(ledger.reviewCoverage.aiMergedBypassed).toBe(1)
    expect(ledger.reviewCoverage.reviewedPct).toBe(50)
  })

  it('breaks authorship down by agent sorted by volume', () => {
    const ledger = buildAuthorshipLedger(pullRequests)
    expect(ledger.byAgent[0].count).toBeGreaterThanOrEqual(
      ledger.byAgent[ledger.byAgent.length - 1].count,
    )
    const cursor = ledger.byAgent.find((a) => a.agentSource === 'cursor')!
    expect(cursor.count).toBe(1)
  })

  it('produces a trend series of the requested length', () => {
    const ledger = buildAuthorshipLedger(pullRequests, 7)
    expect(ledger.trend).toHaveLength(7)
    expect(ledger.trend.every((point) => 'aiAuthoredPct' in point)).toBe(true)
  })
})

describe('compliance export', () => {
  const pullRequests = [
    makePr({
      number: 1,
      agentSource: 'claude_code',
      status: 'merged',
      approvalStatus: 'approved',
      approvals: [
        {
          id: 'a1',
          reviewer: 'Maya Chen',
          decision: 'approved',
          note: '',
          createdAt: '2026-05-01T05:00:00.000Z',
        },
      ],
    }),
  ]

  it('serializes the ledger to CSV with a header row', () => {
    const ledger = buildAuthorshipLedger(pullRequests)
    const csv = serializeAuthorshipLedgerCsv(ledger)
    const [header] = csv.split('\n')
    expect(header).toContain('agent')
    expect(header).toContain('merged_reviewed')
    expect(csv).toContain('claude_code')
  })

  it('builds an evidence bundle with notice, summary, and per-PR rows', () => {
    const bundle = buildAuthorshipEvidenceBundle({
      organization: { id: 'org-1', name: 'Northstar', planKey: 'growth' },
      pullRequests,
      generatedAt: '2026-06-04T00:00:00.000Z',
    })

    expect(bundle.notice).toMatch(/EU AI Act/i)
    expect(bundle.notice).toMatch(/not a certification/i)
    expect(bundle.summary.aiAuthored).toBe(1)
    expect(bundle.retention.auditRetentionDays).toBe(365)
    expect(bundle.pullRequests[0].reviewer).toBe('Maya Chen')
    expect(bundle.pullRequests[0].attributionEvidence[0]).toContain(
      'commit_trailer',
    )
  })
})
