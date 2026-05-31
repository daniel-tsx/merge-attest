import { describe, expect, it } from 'vitest'
import { sortPullRequests } from '../app/pull-requests/sort'
import type { PullRequest } from '../lib/types'

// Minimal partials cast to PullRequest — sortPullRequests only reads the
// comparator fields set below.
const pr = (over: Partial<PullRequest>): PullRequest =>
  ({
    number: 0,
    repositoryName: 'repo',
    riskScore: 0,
    testGapStatus: 'none',
    ciStatus: 'passing',
    approvalStatus: 'not_required',
    linesAdded: 0,
    linesDeleted: 0,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  }) as unknown as PullRequest

describe('sortPullRequests', () => {
  it('sorts by risk score in both directions', () => {
    const list = [
      pr({ number: 1, riskScore: 20 }),
      pr({ number: 2, riskScore: 80 }),
      pr({ number: 3, riskScore: 50 }),
    ]
    expect(
      sortPullRequests(list, 'risk', 'desc').map((p) => p.number),
    ).toEqual([2, 3, 1])
    expect(sortPullRequests(list, 'risk', 'asc').map((p) => p.number)).toEqual([
      1, 3, 2,
    ])
  })

  it('sorts by updated date without mutating the input', () => {
    const list = [
      pr({ number: 1, updatedAt: '2026-05-01T00:00:00.000Z' }),
      pr({ number: 2, updatedAt: '2026-05-03T00:00:00.000Z' }),
    ]
    expect(
      sortPullRequests(list, 'updated', 'desc').map((p) => p.number),
    ).toEqual([2, 1])
    expect(list.map((p) => p.number)).toEqual([1, 2])
  })

  it('ranks test-gap severity (high > warning > none)', () => {
    const list = [
      pr({ number: 1, testGapStatus: 'none' }),
      pr({ number: 2, testGapStatus: 'high' }),
      pr({ number: 3, testGapStatus: 'warning' }),
    ]
    expect(
      sortPullRequests(list, 'tests', 'desc').map((p) => p.number),
    ).toEqual([2, 3, 1])
  })
})
