import {
  createSearchParamsCache,
  createSerializer,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server'

export const adminSubscriptionSearchParams = {
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

export const adminSubscriptionSearchParamsCache = createSearchParamsCache(
  adminSubscriptionSearchParams,
)

export const serializeAdminSubscriptionSearchParams = createSerializer(
  adminSubscriptionSearchParams,
)
