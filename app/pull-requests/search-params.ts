import {
  createSearchParamsCache,
  createSerializer,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server'

export const pullRequestSortKeys = [
  'pr',
  'repository',
  'risk',
  'tests',
  'ci',
  'approval',
  'diff',
  'updated',
] as const

export type PullRequestSortKey = (typeof pullRequestSortKeys)[number]

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
  sort: parseAsStringLiteral(pullRequestSortKeys).withDefault('updated'),
  dir: parseAsStringLiteral(['asc', 'desc'] as const).withDefault('desc'),
}

export const pullRequestSearchParamsCache = createSearchParamsCache(
  pullRequestSearchParams,
)

export const serializePullRequestSearchParams = createSerializer(
  pullRequestSearchParams,
)
