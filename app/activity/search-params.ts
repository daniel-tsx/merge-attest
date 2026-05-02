import {
  createSearchParamsCache,
  createSerializer,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server'

export const activitySearchParams = {
  query: parseAsString.withDefault(''),
  repositoryId: parseAsString.withDefault('all'),
  agentSource: parseAsStringLiteral([
    'all',
    'cursor',
    'codex',
    'claude_code',
    'copilot',
    'devin',
    'manual',
  ] as const).withDefault('all'),
  eventType: parseAsStringLiteral([
    'all',
    'pr_opened',
    'files_changed',
    'rule_triggered',
    'ci_failed',
    'ci_passed',
    'approved',
    'rejected',
    'merged',
  ] as const).withDefault('all'),
}

export const activitySearchParamsCache =
  createSearchParamsCache(activitySearchParams)

export const serializeActivitySearchParams =
  createSerializer(activitySearchParams)
