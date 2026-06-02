import type { BillingStatus, PlanKey } from '@/lib/types'

/**
 * Monthly list price per plan, mirroring `lib/plans.ts`. Enterprise is custom
 * and treated as 0 for automatic MRR estimation.
 */
export const PLAN_MONTHLY_PRICE: Record<PlanKey, number> = {
  free: 0,
  starter: 19,
  team: 79,
  growth: 199,
  enterprise: 0,
}

const MRR_BILLING_STATUSES: ReadonlyArray<BillingStatus> = [
  'active',
  'trialing',
]

/**
 * Estimated monthly recurring revenue from plan list prices. Only active and
 * trialing organizations count. This is an estimate from plan price, not
 * actual Lemon Squeezy revenue.
 */
export function estimateMrr(
  orgs: ReadonlyArray<{ planKey: PlanKey; billingStatus: BillingStatus }>,
) {
  return orgs.reduce((total, org) => {
    if (!MRR_BILLING_STATUSES.includes(org.billingStatus)) return total
    return total + (PLAN_MONTHLY_PRICE[org.planKey] ?? 0)
  }, 0)
}

export function planDistribution(
  orgs: ReadonlyArray<{ planKey: PlanKey }>,
): Record<PlanKey, number> {
  const counts: Record<PlanKey, number> = {
    free: 0,
    starter: 0,
    team: 0,
    growth: 0,
    enterprise: 0,
  }
  for (const org of orgs) {
    counts[org.planKey] = (counts[org.planKey] ?? 0) + 1
  }
  return counts
}

export function billingStatusDistribution(
  orgs: ReadonlyArray<{ billingStatus: BillingStatus }>,
): Record<BillingStatus, number> {
  const counts: Record<BillingStatus, number> = {
    trialing: 0,
    active: 0,
    past_due: 0,
    paused: 0,
    canceled: 0,
  }
  for (const org of orgs) {
    counts[org.billingStatus] = (counts[org.billingStatus] ?? 0) + 1
  }
  return counts
}

export type WeekBucket = { weekStart: string; count: number }

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

/**
 * Bucket timestamps into `weeks` consecutive 7-day windows ending at the start
 * of the day after `now` (UTC). Dates outside the window are ignored. Returns
 * buckets in chronological order; bucketing is pure so it is unit-tested.
 */
export function bucketByWeek(
  dates: ReadonlyArray<Date | string>,
  weeks: number,
  now: Date = new Date(),
): WeekBucket[] {
  const end =
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) +
    24 * 60 * 60 * 1000
  const firstStart = end - weeks * MS_PER_WEEK

  const buckets: WeekBucket[] = Array.from({ length: weeks }, (_, index) => ({
    weekStart: new Date(firstStart + index * MS_PER_WEEK).toISOString(),
    count: 0,
  }))

  for (const value of dates) {
    const time = (value instanceof Date ? value : new Date(value)).getTime()
    if (Number.isNaN(time) || time < firstStart || time >= end) continue
    const index = Math.floor((time - firstStart) / MS_PER_WEEK)
    if (index >= 0 && index < buckets.length) buckets[index].count += 1
  }

  return buckets
}
