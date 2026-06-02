import {
  createSearchParamsCache,
  createSerializer,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server'

export const adminUserSearchParams = {
  q: parseAsString.withDefault(''),
  verified: parseAsStringLiteral(['all', 'yes', 'no'] as const).withDefault(
    'all',
  ),
  after: parseAsString.withDefault(''),
  before: parseAsString.withDefault(''),
}

export const adminUserSearchParamsCache = createSearchParamsCache(
  adminUserSearchParams,
)

export const serializeAdminUserSearchParams = createSerializer(
  adminUserSearchParams,
)
