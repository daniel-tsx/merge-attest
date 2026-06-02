import type { BillingStatus, PlanKey } from '@/lib/types'

type BadgeTone = 'slate' | 'green' | 'yellow' | 'orange' | 'red' | 'blue'

export const PLAN_KEYS: PlanKey[] = [
  'free',
  'starter',
  'team',
  'growth',
  'enterprise',
]

export const BILLING_STATUSES: BillingStatus[] = [
  'trialing',
  'active',
  'past_due',
  'paused',
  'canceled',
]

export const PLAN_LABELS: Record<PlanKey, string> = {
  free: 'Free',
  starter: 'Starter',
  team: 'Team',
  growth: 'Growth',
  enterprise: 'Enterprise',
}

export const BILLING_LABELS: Record<BillingStatus, string> = {
  trialing: 'Trialing',
  active: 'Active',
  past_due: 'Past due',
  paused: 'Paused',
  canceled: 'Canceled',
}

export const PLAN_FILTER_OPTIONS = [
  { value: 'all', label: 'All plans' },
  ...PLAN_KEYS.map((key) => ({ value: key, label: PLAN_LABELS[key] })),
]

export const BILLING_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...BILLING_STATUSES.map((status) => ({
    value: status,
    label: BILLING_LABELS[status],
  })),
]

export function billingTone(status: BillingStatus): BadgeTone {
  if (status === 'active') return 'green'
  if (status === 'trialing') return 'blue'
  if (status === 'paused') return 'yellow'
  if (status === 'past_due' || status === 'canceled') return 'red'
  return 'slate'
}
