import { Environment, Paddle } from '@paddle/paddle-node-sdk'
import { isProduction } from '@/lib/env'
import { plans } from '@/lib/plans'
import type { BillingStatus, PlanKey } from '@/lib/types'

const paidPlanPriceEnv: Partial<Record<PlanKey, string>> = {
  starter: 'PADDLE_STARTER_PRICE_ID',
  team: 'PADDLE_TEAM_PRICE_ID',
  growth: 'PADDLE_GROWTH_PRICE_ID',
}

export function getPaddleClient() {
  if (!process.env.PADDLE_API_KEY) return null

  return new Paddle(process.env.PADDLE_API_KEY, {
    environment:
      process.env.PADDLE_ENVIRONMENT === 'production'
        ? Environment.production
        : Environment.sandbox,
  })
}

export function getBillingMode() {
  if (getPaddleClient()) return 'live'
  return isProduction() ? 'unconfigured' : 'mock'
}

export function getPaddleWebhookSecret() {
  return process.env.PADDLE_WEBHOOK_SECRET?.trim() || null
}

export function isPaidPlan(planKey: PlanKey) {
  return planKey === 'starter' || planKey === 'team' || planKey === 'growth'
}

export function getPaddlePriceId(planKey: PlanKey) {
  const envKey = paidPlanPriceEnv[planKey]
  return envKey ? process.env[envKey]?.trim() || null : null
}

export function getPaddleCustomerPortalUrl(customerId?: string | null) {
  const baseUrl = process.env.PADDLE_CUSTOMER_PORTAL_URL?.trim()
  if (!baseUrl || !customerId) return null

  const url = new URL(baseUrl)
  url.searchParams.set('customer_id', customerId)
  return url.toString()
}

export function getBillingStatusLabel(status: BillingStatus) {
  const labels: Record<BillingStatus, string> = {
    trialing: 'Trialing',
    active: 'Active',
    past_due: 'Past due',
    paused: 'Paused',
    canceled: 'Canceled',
  }
  return labels[status]
}

export function getBillingCallout(input: {
  status: BillingStatus
  trialEndsAt?: string
  cancellationEffectiveAt?: string
  failedPaymentAt?: string
}) {
  if (input.status === 'trialing') {
    return input.trialEndsAt
      ? `Trial ends ${new Date(input.trialEndsAt).toLocaleDateString()}`
      : 'Trial is active'
  }

  if (input.status === 'past_due') {
    return input.failedPaymentAt
      ? `Payment failed ${new Date(input.failedPaymentAt).toLocaleDateString()}`
      : 'Payment needs attention'
  }

  if (input.status === 'canceled') {
    return input.cancellationEffectiveAt
      ? `Cancels ${new Date(input.cancellationEffectiveAt).toLocaleDateString()}`
      : 'Subscription canceled'
  }

  if (input.status === 'paused') return 'Subscription paused'
  return 'Subscription active'
}

export function getPlanKeyForPaddlePriceId(
  priceId: string | null | undefined,
): PlanKey | null {
  if (!priceId) return null

  for (const [planKey, envKey] of Object.entries(paidPlanPriceEnv) as Array<
    [PlanKey, string]
  >) {
    if (process.env[envKey]?.trim() === priceId) return planKey
  }

  return null
}

export async function createCheckoutTransaction(input: {
  organizationId: string
  planKey: PlanKey
  customerId?: string | null
}) {
  const paddle = getPaddleClient()
  const priceId = getPaddlePriceId(input.planKey)

  if (!paddle || !priceId) return null

  return paddle.transactions.create({
    items: [{ priceId, quantity: 1 }],
    customerId: input.customerId ?? undefined,
    customData: {
      organizationId: input.organizationId,
      planKey: input.planKey,
    },
  })
}

export { plans }
