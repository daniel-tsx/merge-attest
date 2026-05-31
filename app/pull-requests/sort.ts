import type { PullRequest } from '@/lib/types'
import type { PullRequestSortKey } from './search-params'

const testGapRank: Record<PullRequest['testGapStatus'], number> = {
  none: 0,
  warning: 1,
  high: 2,
}

const ciRank: Record<PullRequest['ciStatus'], number> = {
  passing: 0,
  pending: 1,
  unknown: 2,
  failing: 3,
}

const approvalRank: Record<PullRequest['approvalStatus'], number> = {
  not_required: 0,
  approved: 1,
  risk_accepted: 2,
  rejected: 3,
  pending: 4,
}

// Returns the comparable value for a sort key (numbers compare numerically,
// strings lexically). Higher generally means "needs more attention" so that a
// descending sort surfaces the most important rows first.
function sortValue(pr: PullRequest, key: PullRequestSortKey): number | string {
  switch (key) {
    case 'pr':
      return pr.number
    case 'repository':
      return pr.repositoryName.toLowerCase()
    case 'risk':
      return pr.riskScore
    case 'tests':
      return testGapRank[pr.testGapStatus]
    case 'ci':
      return ciRank[pr.ciStatus]
    case 'approval':
      return approvalRank[pr.approvalStatus]
    case 'diff':
      return pr.linesAdded + pr.linesDeleted
    case 'updated':
      return new Date(pr.updatedAt).getTime()
  }
}

export function sortPullRequests(
  pullRequests: PullRequest[],
  sort: PullRequestSortKey,
  dir: 'asc' | 'desc',
): PullRequest[] {
  const factor = dir === 'asc' ? 1 : -1
  return [...pullRequests].sort((a, b) => {
    const aValue = sortValue(a, sort)
    const bValue = sortValue(b, sort)
    if (aValue < bValue) return -1 * factor
    if (aValue > bValue) return 1 * factor
    // Stable tiebreaker so equal rows keep a deterministic order.
    return b.number - a.number
  })
}
