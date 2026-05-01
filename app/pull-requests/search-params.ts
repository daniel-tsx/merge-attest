import {
  createSearchParamsCache,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server'

export const pullRequestSearchParams = {
  query: parseAsString.withDefault(''),
  riskLevel: parseAsStringLiteral([
    'all',
    'critical',
    'high',
    'medium',
    'low',
  ] as const).withDefault('all'),
  agentSource: parseAsStringLiteral([
    'all',
    'cursor',
    'codex',
    'claude_code',
    'copilot',
    'devin',
    'manual',
  ] as const).withDefault('all'),
  approvalStatus: parseAsStringLiteral([
    'all',
    'pending',
    'approved',
    'rejected',
    'risk_accepted',
    'not_required',
  ] as const).withDefault('all'),
}

export const pullRequestSearchParamsCache = createSearchParamsCache(
  pullRequestSearchParams,
)
