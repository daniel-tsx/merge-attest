import {
  createSearchParamsCache,
  createSerializer,
  parseAsStringLiteral,
} from 'nuqs/server'

export const usageSearchParams = {
  period: parseAsStringLiteral([
    'all',
    'current',
    'history',
  ] as const).withDefault('all'),
}

export const usageSearchParamsCache = createSearchParamsCache(usageSearchParams)

export const serializeUsageSearchParams = createSerializer(usageSearchParams)
