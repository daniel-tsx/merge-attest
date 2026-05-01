import { describe, expect, it } from 'vitest'
import { mapPullRequest, mapRepository } from '../lib/data/app-data'

describe('Prisma data mappers', () => {
  it('maps database repositories to view repositories', () => {
    const date = new Date('2026-05-01T00:00:00.000Z')

    expect(
      mapRepository({
        id: 'repo-1',
        name: 'agent-gate',
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
      repository: { name: 'agent-gate' },
      number: 12,
      title: 'Add auth guard',
      author: 'cursor-agent',
      branch: 'agent/auth',
      baseBranch: 'main',
      status: 'open',
      aiAssisted: true,
      agentSource: 'cursor',
      riskScore: 65,
      riskLevel: 'high',
      testGapStatus: 'high',
      ciStatus: 'pending',
      approvalStatus: 'pending',
      filesChangedCount: 1,
      linesAdded: 20,
      linesDeleted: 4,
      createdAt: date,
      updatedAt: date,
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
    })

    expect(result.repositoryName).toBe('agent-gate')
    expect(result.riskSignals[0].filePaths).toEqual(['lib/auth.ts'])
    expect(result.testGapAnalysis.suggestedTestFiles).toEqual([
      'tests/auth.test.ts',
    ])
    expect(result.ruleViolations[0].ruleName).toBe('Sensitive change review')
    expect(result.approvals[0].reviewer).toBe('Maya Chen')
  })
})
