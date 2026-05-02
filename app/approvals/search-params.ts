import {
  createSearchParamsCache,
  createSerializer,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server'

export const approvalsSearchParams = {
  query: parseAsString.withDefault(''),
  repositoryId: parseAsString.withDefault('all'),
  approvalStatus: parseAsStringLiteral([
    'all',
    'pending',
    'approved',
    'rejected',
    'risk_accepted',
  ] as const).withDefault('all'),
  riskLevel: parseAsStringLiteral([
    'all',
    'low',
    'medium',
    'high',
    'critical',
  ] as const).withDefault('all'),
  assigneeId: parseAsString.withDefault('all'),
  slaStatus: parseAsStringLiteral([
    'all',
    'overdue',
    'due_soon',
    'on_track',
    'none',
  ] as const).withDefault('all'),
}

export const approvalsSearchParamsCache = createSearchParamsCache(
  approvalsSearchParams,
)

export const serializeApprovalsSearchParams = createSerializer(
  approvalsSearchParams,
)
