import type { PullRequest, RepoRule, RuleViolation } from '@/lib/types'

export type RuleEvaluationContext = Pick<
  PullRequest,
  'aiAssisted' | 'riskLevel' | 'ciStatus' | 'testGapStatus' | 'riskSignals'
>

function matchesRule(rule: RepoRule, pr: RuleEvaluationContext) {
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
      resolved: false,
      createdAt: new Date().toISOString(),
    }))
}
