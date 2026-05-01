import { createSearchParamsCache, parseAsStringLiteral } from 'nuqs/server'

export const usageSearchParams = {
  period: parseAsStringLiteral([
    'all',
    'current',
    'history',
  ] as const).withDefault('all'),
}

export const usageSearchParamsCache = createSearchParamsCache(usageSearchParams)
