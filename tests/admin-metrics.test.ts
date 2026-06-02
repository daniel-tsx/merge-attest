import { describe, expect, it } from 'vitest'
import {
  bucketByWeek,
  billingStatusDistribution,
  estimateMrr,
  planDistribution,
} from '../lib/admin/metrics'

describe('admin metrics', () => {
  it('estimates MRR from active and trialing plans only', () => {
    const mrr = estimateMrr([
      { planKey: 'team', billingStatus: 'active' }, // 79
      { planKey: 'starter', billingStatus: 'trialing' }, // 19
      { planKey: 'growth', billingStatus: 'canceled' }, // excluded
      { planKey: 'free', billingStatus: 'active' }, // 0
      { planKey: 'enterprise', billingStatus: 'active' }, // custom -> 0
    ])
    expect(mrr).toBe(98)
  })

  it('counts plan distribution including zero buckets', () => {
    expect(
      planDistribution([
        { planKey: 'free' },
        { planKey: 'free' },
        { planKey: 'team' },
      ]),
    ).toEqual({ free: 2, starter: 0, team: 1, growth: 0, enterprise: 0 })
  })

  it('counts billing-status distribution including zero buckets', () => {
    expect(
      billingStatusDistribution([
        { billingStatus: 'active' },
        { billingStatus: 'past_due' },
        { billingStatus: 'active' },
      ]),
    ).toEqual({ trialing: 0, active: 2, past_due: 1, paused: 0, canceled: 0 })
  })

  it('buckets timestamps into chronological weekly windows', () => {
    const now = new Date('2026-06-02T12:00:00Z')
    const buckets = bucketByWeek(
      [
        new Date('2026-06-01T00:00:00Z'), // newest week (bucket 3)
        new Date('2026-05-20T00:00:00Z'), // bucket 2
        new Date('2026-04-01T00:00:00Z'), // outside the 4-week window
      ],
      4,
      now,
    )

    expect(buckets).toHaveLength(4)
    expect(buckets.map((bucket) => bucket.count)).toEqual([0, 0, 1, 1])
    // ascending order
    const starts = buckets.map((bucket) => bucket.weekStart)
    expect([...starts].sort()).toEqual(starts)
  })
})
