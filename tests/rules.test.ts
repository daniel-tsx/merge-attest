import { describe, expect, it } from 'vitest'
import { getRuleTemplate, ruleTemplates } from '../lib/rule-templates'
import { evaluateRepoRules } from '../lib/rules'
import type { RepoRule } from '../lib/types'

const rules: RepoRule[] = [
  {
    id: 'rule-ai',
    repositoryId: 'repo',
    name: 'AI approval',
    description: 'AI-assisted PRs require human approval',
    enabled: true,
    triggerType: 'ai_assisted',
    actionType: 'require_approval',
    severity: 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule-ci',
    repositoryId: 'repo',
    name: 'Failing CI',
    description: 'Failing CI blocks approval',
    enabled: true,
    triggerType: 'failing_ci',
    actionType: 'block_merge',
    severity: 'high',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

describe('repo rule evaluation', () => {
  it('creates violations for matching enabled rules', () => {
    const violations = evaluateRepoRules(rules, {
      aiAssisted: true,
      riskLevel: 'medium',
      ciStatus: 'failing',
      testGapStatus: 'warning',
      riskSignals: [],
    })

    expect(violations).toHaveLength(2)
    expect(violations.map((violation) => violation.actionType)).toContain(
      'block_merge',
    )
  })

  it('ignores rules that do not match', () => {
    const violations = evaluateRepoRules(rules, {
      aiAssisted: false,
      riskLevel: 'low',
      ciStatus: 'passing',
      testGapStatus: 'none',
      riskSignals: [],
    })

    expect(violations).toHaveLength(0)
  })

  it('applies branch, path, agent, and minimum risk scopes', () => {
    const violations = evaluateRepoRules(
      [
        {
          id: 'rule-scoped',
          repositoryId: 'repo',
          name: 'Scoped sensitive change',
          description: 'Sensitive AI changes need security review',
          enabled: true,
          triggerType: 'high_risk',
          actionType: 'request_security_review',
          severity: 'critical',
          branchPattern: 'main,release/*',
          pathPattern: 'auth,prisma/migrations',
          agentSource: 'cursor',
          minimumRiskLevel: 'high',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      {
        aiAssisted: true,
        riskLevel: 'high',
        ciStatus: 'passing',
        testGapStatus: 'none',
        riskSignals: [
          {
            key: 'auth_changed',
            label: 'Auth changed',
            score: 30,
            level: 'high',
            filePaths: ['lib/auth/session.ts'],
          },
        ],
        branch: 'release/v1',
        agentSource: 'cursor',
        files: [],
      },
    )

    expect(violations).toHaveLength(1)
    expect(violations[0]?.actionType).toBe('request_security_review')
  })

  it('skips scoped rules when pull request context is outside scope', () => {
    const violations = evaluateRepoRules(
      [
        {
          id: 'rule-scoped',
          repositoryId: 'repo',
          name: 'Scoped sensitive change',
          description: 'Sensitive AI changes need security review',
          enabled: true,
          triggerType: 'high_risk',
          actionType: 'request_security_review',
          severity: 'critical',
          branchPattern: 'main',
          pathPattern: 'auth',
          agentSource: 'cursor',
          minimumRiskLevel: 'high',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      {
        aiAssisted: true,
        riskLevel: 'high',
        ciStatus: 'passing',
        testGapStatus: 'none',
        riskSignals: [
          {
            key: 'auth_changed',
            label: 'Auth changed',
            score: 30,
            level: 'high',
            filePaths: ['lib/auth/session.ts'],
          },
        ],
        branch: 'feature/agent-update',
        agentSource: 'cursor',
        files: [],
      },
    )

    expect(violations).toHaveLength(0)
  })
})

describe('rule templates', () => {
  it('includes sensitive-file defaults for common high-risk areas', () => {
    const template = getRuleTemplate('sensitive-auth-billing')

    expect(template?.actionType).toBe('request_security_review')
    expect(template?.pathPattern).toContain('auth')
    expect(template?.pathPattern).toContain('billing')
    expect(template?.pathPattern).toContain('prisma/migrations')
  })

  it('keeps template keys unique', () => {
    const keys = new Set(ruleTemplates.map((template) => template.key))

    expect(keys.size).toBe(ruleTemplates.length)
  })
})
