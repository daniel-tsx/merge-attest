import { getBetterAuthUrl, isProduction } from '@/lib/env'
import { plans } from '@/lib/plans'
import type { BillingStatus, PlanKey } from '@/lib/types'

const paidPlanPriceEnv: Partial<Record<PlanKey, string>> = {
  starter: 'LEMON_SQUEEZY_STARTER_VARIANT_ID',
  team: 'LEMON_SQUEEZY_TEAM_VARIANT_ID',
  growth: 'LEMON_SQUEEZY_GROWTH_VARIANT_ID',
}

const lemonSqueezyApiUrl = 'https://api.lemonsqueezy.com/v1'

function getEnv(name: string) {
  return process.env[name]?.trim() || null
}

function getLemonSqueezyApiKey() {
  return getEnv('LEMON_SQUEEZY_API_KEY')
}

function getLemonSqueezyStoreId() {
  return getEnv('LEMON_SQUEEZY_STORE_ID')
}

function isLemonSqueezyConfigured() {
  return Boolean(getLemonSqueezyApiKey() && getLemonSqueezyStoreId())
}

export function isPaidBillingEnabled() {
  return getEnv('ENABLE_PAID_BILLING') === 'true'
}

export function getBillingMode() {
  if (!isPaidBillingEnabled()) return 'disabled'
  if (isLemonSqueezyConfigured()) return 'live'
  return isProduction() ? 'unconfigured' : 'mock'
}

export function getLemonSqueezyWebhookSecret() {
  return getEnv('LEMON_SQUEEZY_WEBHOOK_SECRET')
}

export function isPaidPlan(planKey: PlanKey) {
  return planKey === 'starter' || planKey === 'team' || planKey === 'growth'
}

export function getLemonSqueezyVariantId(planKey: PlanKey) {
  const envKey = paidPlanPriceEnv[planKey]
  return envKey ? getEnv(envKey) : null
}

export function hasLemonSqueezyCustomerPortalAccess(input: {
  customerId?: string | null
  subscriptionId?: string | null
}) {
  return Boolean(input.subscriptionId || input.customerId)
}

async function lemonSqueezyRequest(path: string) {
  const apiKey = getLemonSqueezyApiKey()
  if (!apiKey) return null

  const response = await fetch(`${lemonSqueezyApiUrl}${path}`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(10_000),
  })

  return response.ok ? response.json() : null
}

export function getBillingReturnUrl(path = '/settings/billing') {
  return new URL(path, getBetterAuthUrl()).toString()
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

export function getPlanKeyForLemonSqueezyVariantId(
  variantId: string | null | undefined,
): PlanKey | null {
  if (!variantId) return null

  for (const [planKey, envKey] of Object.entries(paidPlanPriceEnv) as Array<
    [PlanKey, string]
  >) {
    if (getEnv(envKey) === variantId) return planKey
  }

  return null
}

export async function createCheckoutSession(input: {
  organizationId: string
  planKey: PlanKey
  customerEmail?: string | null
  customerName?: string | null
  returnUrl?: string
}) {
  const apiKey = getLemonSqueezyApiKey()
  const storeId = getLemonSqueezyStoreId()
  const variantId = getLemonSqueezyVariantId(input.planKey)

  if (!apiKey || !storeId || !variantId) return null

  const variantNumber = Number(variantId)
  if (!Number.isInteger(variantNumber) || variantNumber <= 0) return null

  const response = await fetch(`${lemonSqueezyApiUrl}/checkouts`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: input.customerEmail ?? undefined,
            name: input.customerName ?? undefined,
            custom: {
              organizationId: input.organizationId,
              planKey: input.planKey,
            },
          },
          product_options: {
            enabled_variants: [variantNumber],
            redirect_url: input.returnUrl,
          },
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: storeId,
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: variantId,
            },
          },
        },
      },
    }),
  })

  if (!response.ok) return null

  const body = (await response.json()) as {
    data?: { attributes?: { url?: string } }
  }
  return body.data?.attributes?.url ?? null
}

export async function getLemonSqueezyCustomerPortalUrl(input: {
  customerId?: string | null
  subscriptionId?: string | null
}) {
  if (input.subscriptionId) {
    const subscription = (await lemonSqueezyRequest(
      `/subscriptions/${input.subscriptionId}`,
    )) as { data?: { attributes?: { urls?: { customer_portal?: string } } } }

    const portalUrl = subscription?.data?.attributes?.urls?.customer_portal
    if (portalUrl) return portalUrl
  }

  if (input.customerId) {
    const customer = (await lemonSqueezyRequest(
      `/customers/${input.customerId}`,
    )) as { data?: { attributes?: { urls?: { customer_portal?: string } } } }

    const portalUrl = customer?.data?.attributes?.urls?.customer_portal
    if (portalUrl) return portalUrl
  }

  return null
}

export { plans }
