import {
  createSearchParamsCache,
  createSerializer,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server'

export const adminOrganizationSearchParams = {
  q: parseAsString.withDefault(''),
  plan: parseAsStringLiteral([
    'all',
    'free',
    'starter',
    'team',
    'growth',
    'enterprise',
  ] as const).withDefault('all'),
  status: parseAsStringLiteral([
    'all',
    'trialing',
    'active',
    'past_due',
    'paused',
    'canceled',
  ] as const).withDefault('all'),
  after: parseAsString.withDefault(''),
  before: parseAsString.withDefault(''),
}

export const adminOrganizationSearchParamsCache = createSearchParamsCache(
  adminOrganizationSearchParams,
)

export const serializeAdminOrganizationSearchParams = createSerializer(
  adminOrganizationSearchParams,
)
