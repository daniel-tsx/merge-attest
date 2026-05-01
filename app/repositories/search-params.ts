import {
  createSearchParamsCache,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server'

export const repositorySearchParams = {
  query: parseAsString.withDefault(''),
  riskProfile: parseAsStringLiteral([
    'all',
    'high',
    'medium',
    'low',
  ] as const).withDefault('all'),
  visibility: parseAsStringLiteral([
    'all',
    'private',
    'public',
  ] as const).withDefault('all'),
}

export const repositorySearchParamsCache = createSearchParamsCache(
  repositorySearchParams,
)
