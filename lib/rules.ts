import type { PullRequest, RepoRule, RuleViolation } from '@/lib/types'

export type RuleEvaluationContext = Pick<
  PullRequest,
  'aiAssisted' | 'riskLevel' | 'ciStatus' | 'testGapStatus' | 'riskSignals'
> & {
  branch?: string
  agentSource?: PullRequest['agentSource']
  files?: PullRequest['files']
  labels?: string[]
}

const riskRank = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
} as const

function matchesPattern(value: string, pattern?: string) {
  if (!pattern) return true

  const normalizedPattern = pattern.trim().toLowerCase()
  if (!normalizedPattern) return true

  return normalizedPattern
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .some((item) => {
      if (item.includes('*')) {
        const escaped = item.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`^${escaped.replaceAll('*', '.*')}$`, 'i')
        return regex.test(value)
      }

      return value.toLowerCase().includes(item)
    })
}

function matchesScope(rule: RepoRule, pr: RuleEvaluationContext) {
  if (
    rule.branchPattern &&
    !matchesPattern(pr.branch ?? '', rule.branchPattern)
  ) {
    return false
  }

  if (
    rule.agentSource &&
    rule.agentSource !== 'unknown' &&
    pr.agentSource !== rule.agentSource
  ) {
    return false
  }

  if (
    rule.minimumRiskLevel &&
    riskRank[pr.riskLevel] < riskRank[rule.minimumRiskLevel]
  ) {
    return false
  }

  if (
    rule.pathPattern &&
    ![
      ...(pr.files?.map((file) => file.path) ?? []),
      ...pr.riskSignals.flatMap((signal) => signal.filePaths),
    ].some((path) => matchesPattern(path, rule.pathPattern))
  ) {
    return false
  }

  if (
    rule.labelPattern &&
    !(pr.labels ?? []).some((label) => matchesPattern(label, rule.labelPattern))
  ) {
    return false
  }

  return true
}

function matchesRule(rule: RepoRule, pr: RuleEvaluationContext) {
  if (!matchesScope(rule, pr)) return false

  switch (rule.triggerType) {
    case 'ai_assisted':
      return pr.aiAssisted === true
    case 'high_risk':
      return pr.riskLevel === 'high' || pr.riskLevel === 'critical'
    case 'auth_changed':
      return pr.riskSignals.some((signal) => signal.key === 'auth_changed')
    case 'billing_changed':
      return pr.riskSignals.some((signal) => signal.key === 'billing_changed')
    case 'database_migration':
      return pr.riskSignals.some((signal) => signal.key === 'db_migration')
    case 'dependency_changed':
      return pr.riskSignals.some(
        (signal) => signal.key === 'dependency_changed',
      )
    case 'high_test_gap':
      return pr.testGapStatus === 'high'
    case 'failing_ci':
      return pr.ciStatus === 'failing'
  }
}

export function evaluateRepoRules(
  rules: RepoRule[],
  pr: RuleEvaluationContext,
): RuleViolation[] {
  return rules
    .filter((rule) => rule.enabled && matchesRule(rule, pr))
    .map((rule) => ({
      id: `violation-${rule.id}`,
      ruleName: rule.name,
      summary: `${rule.name}: ${rule.description}`,
      severity: rule.severity,
      actionType: rule.actionType,
      codeOwnerHint: rule.codeOwnerHint,
      resolved: false,
      createdAt: new Date().toISOString(),
    }))
}
