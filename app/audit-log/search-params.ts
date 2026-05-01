import {
  createSearchParamsCache,
  createSerializer,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server'

export const auditLogSearchParams = {
  query: parseAsString.withDefault(''),
  eventType: parseAsStringLiteral([
    'all',
    'repository_connected',
    'pr_synced',
    'risk_score_calculated',
    'test_gap_detected',
    'rule_triggered',
    'approval_requested',
    'pr_approved',
    'pr_rejected',
    'risk_accepted',
    'github_comment_posted',
    'settings_changed',
  ] as const).withDefault('all'),
  actor: parseAsString.withDefault(''),
  repositoryId: parseAsString.withDefault('all'),
  pullRequestNumber: parseAsString.withDefault(''),
  severity: parseAsStringLiteral([
    'all',
    'low',
    'medium',
    'high',
    'critical',
  ] as const).withDefault('all'),
  from: parseAsString.withDefault(''),
  to: parseAsString.withDefault(''),
}

export const auditLogSearchParamsCache =
  createSearchParamsCache(auditLogSearchParams)

export const serializeAuditLogSearchParams =
  createSerializer(auditLogSearchParams)
