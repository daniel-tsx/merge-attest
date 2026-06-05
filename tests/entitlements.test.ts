import { describe, expect, it } from 'vitest'
import {
  canConsume,
  getPlanEntitlements,
  limitLabel,
  remainingLimit,
} from '../lib/entitlements'
import { getCurrentUsagePeriod } from '../lib/usage'

describe('plan entitlements', () => {
  it('exposes numeric limits for server-side enforcement', () => {
    expect(getPlanEntitlements('free').repositoryLimit).toBe(3)
    expect(getPlanEntitlements('team').prCheckLimit).toBe(2000)
    expect(getPlanEntitlements('enterprise').prCheckLimit).toBeNull()
  })

  it('checks limited and unlimited consumption', () => {
    expect(canConsume(10, 9, 1)).toBe(true)
    expect(canConsume(10, 10, 1)).toBe(false)
    expect(canConsume(null, 10_000, 500)).toBe(true)
  })

  it('formats remaining and unlimited limits', () => {
    expect(remainingLimit(50, 12)).toBe(38)
    expect(limitLabel(null, 'PR checks/month')).toBe(
      'Unlimited PR checks/month',
    )
  })

  it('uses UTC month boundaries for usage periods', () => {
    const period = getCurrentUsagePeriod(new Date('2026-05-15T12:00:00.000Z'))

    expect(period.periodStart.toISOString()).toBe('2026-05-01T00:00:00.000Z')
    expect(period.periodEnd.toISOString()).toBe('2026-06-01T00:00:00.000Z')
  })
})
