import crypto from 'node:crypto'
import {
  getLemonSqueezyWebhookSecret,
  getPlanKeyForLemonSqueezyVariantId,
} from '@/lib/billing'
import { reportError } from '@/lib/observability'
import { getPrismaClient } from '@/lib/prisma'
import type { BillingStatus, PlanKey } from '@/lib/types'

type LemonSqueezySubscriptionAttributes = {
  customer_id?: number | string | null
  variant_id?: number | string | null
  status?: string | null
  trial_ends_at?: string | null
  renews_at?: string | null
  ends_at?: string | null
  first_subscription_item?: {
    price_id?: number | string | null
  } | null
}

type LemonSqueezyEventData = {
  type?: string
  id?: string
  attributes?: LemonSqueezySubscriptionAttributes
}

type LemonSqueezyEventMeta = {
  event_name?: string
  custom_data?: Record<string, unknown> | null
}

export type LemonSqueezyEvent = {
  eventName: string
  deliveryId: string
  meta: LemonSqueezyEventMeta
  data: LemonSqueezyEventData
}

const subscriptionEvents = new Set([
  'subscription_created',
  'subscription_updated',
  'subscription_cancelled',
  'subscription_resumed',
  'subscription_expired',
  'subscription_paused',
  'subscription_unpaused',
])

const processingRetryDelayMs = 5 * 60 * 1000

type PrismaClient = NonNullable<ReturnType<typeof getPrismaClient>>

function stringFromValue(value: unknown) {
  if (typeof value === 'string' && value) return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

function asLemonSqueezyEvent(value: unknown, deliveryId: string) {
  const event = value as {
    meta?: LemonSqueezyEventMeta
    data?: LemonSqueezyEventData
  }
  const eventName = event.meta?.event_name

  if (
    typeof eventName !== 'string' ||
    !event.data ||
    typeof event.data !== 'object'
  ) {
    throw new Error('Unsupported Lemon Squeezy webhook event payload.')
  }

  return {
    eventName,
    deliveryId,
    meta: event.meta ?? {},
    data: event.data,
  }
}

function dateFromLemonSqueezy(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function isPlanKey(value: unknown): value is PlanKey {
  return (
    value === 'free' ||
    value === 'starter' ||
    value === 'team' ||
    value === 'growth' ||
    value === 'enterprise'
  )
}

export function getPlanKeyFromLemonSqueezyEvent(
  event: LemonSqueezyEvent,
): PlanKey | null {
  const customPlanKey = event.meta.custom_data?.planKey
  if (isPlanKey(customPlanKey)) return customPlanKey

  return getPlanKeyForLemonSqueezyVariantId(
    stringFromValue(event.data.attributes?.variant_id),
  )
}

function getOrganizationLookup(event: LemonSqueezyEvent) {
  const organizationId = event.meta.custom_data?.organizationId
  if (typeof organizationId === 'string' && organizationId) {
    return { id: organizationId }
  }

  if (event.data.id) return { lemonSqueezySubscriptionId: event.data.id }

  const customerId = stringFromValue(event.data.attributes?.customer_id)
  if (customerId) return { lemonSqueezyCustomerId: customerId }

  return null
}

export function getBillingStatusForLemonSqueezySubscription(
  eventName: string,
  status?: string | null,
): BillingStatus {
  if (status === 'on_trial') return 'trialing'
  if (status === 'past_due' || status === 'unpaid') return 'past_due'
  if (eventName === 'subscription_paused' || status === 'paused') {
    return 'paused'
  }
  if (
    eventName === 'subscription_cancelled' ||
    eventName === 'subscription_expired' ||
    status === 'cancelled' ||
    status === 'expired'
  ) {
    return 'canceled'
  }
  return 'active'
}

export function isProcessedBillingWebhookStatus(status?: string | null) {
  return status === 'processed'
}

function isFinalBillingWebhookStatus(status?: string | null) {
  return status === 'processed' || status === 'ignored'
}

export function verifyLemonSqueezyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret = getLemonSqueezyWebhookSecret(),
) {
  if (!secret || !signature) return false
  const normalizedSignature = signature.trim()
  if (!/^[a-f0-9]{64}$/i.test(normalizedSignature)) return false

  const digest = Buffer.from(
    crypto.createHmac('sha256', secret).update(rawBody).digest('hex'),
    'utf8',
  )
  const signatureBuffer = Buffer.from(normalizedSignature.toLowerCase(), 'utf8')

  return (
    digest.length === signatureBuffer.length &&
    crypto.timingSafeEqual(digest, signatureBuffer)
  )
}

export function unmarshalLemonSqueezyWebhook(
  rawBody: string,
  signature: string | null,
) {
  if (!verifyLemonSqueezyWebhookSignature(rawBody, signature)) {
    throw new Error('Invalid Lemon Squeezy webhook signature.')
  }

  return asLemonSqueezyEvent(
    JSON.parse(rawBody),
    crypto.createHash('sha256').update(rawBody).digest('hex'),
  )
}

async function recordIgnoredLemonSqueezyEvent(
  prisma: PrismaClient,
  event: LemonSqueezyEvent,
  message: string,
) {
  const existingEvent = await prisma.billingWebhookEvent.findUnique({
    where: { deliveryId: event.deliveryId },
  })
  if (isFinalBillingWebhookStatus(existingEvent?.status)) {
    return {
      processed: false,
      duplicate: true,
      ignored: true,
      message: `Lemon Squeezy ${event.eventName} already ignored.`,
    }
  }
  if (
    existingEvent?.status === 'processing' &&
    existingEvent.createdAt.getTime() > Date.now() - processingRetryDelayMs
  ) {
    return {
      processed: false,
      duplicate: true,
      ignored: true,
      message: `Lemon Squeezy ${event.eventName} is already processing.`,
    }
  }

  await prisma.billingWebhookEvent.upsert({
    where: { deliveryId: event.deliveryId },
    update: {
      eventName: event.eventName,
      status: 'ignored',
      message,
      processedAt: new Date(),
    },
    create: {
      deliveryId: event.deliveryId,
      eventName: event.eventName,
      status: 'ignored',
      message,
      processedAt: new Date(),
    },
  })

  return { processed: false, ignored: true, message }
}

async function createBillingAuditEvent(
  prisma: PrismaClient,
  input: {
    deliveryId: string
    eventName: string
    subscriptionId?: string
    customerId: string | null
    organizationId: string
    planKey: string
    previousPlan: string
    billingStatus: BillingStatus
    activationEvent?: string
  },
) {
  try {
    await prisma.auditEvent.create({
      data: {
        eventType: 'settings_changed',
        actor: 'Lemon Squeezy',
        summary: `Lemon Squeezy ${input.eventName} processed`,
        metadata: {
          deliveryId: input.deliveryId,
          subscriptionId: input.subscriptionId,
          customerId: input.customerId,
          planKey: input.planKey,
          previousPlan: input.previousPlan,
          billingStatus: input.billingStatus,
          activationEvent: input.activationEvent,
        },
        organizationId: input.organizationId,
      },
    })
  } catch (error) {
    reportError({
      area: 'billing',
      action: 'lemon_squeezy_audit_event_failed',
      error,
      metadata: {
        deliveryId: input.deliveryId,
        eventName: input.eventName,
        organizationId: input.organizationId,
      },
    })
  }
}

export async function processLemonSqueezySubscriptionEvent(
  event: LemonSqueezyEvent,
) {
  const prisma = getPrismaClient()
  if (!prisma) {
    return { processed: false, message: 'Lemon Squeezy event ignored.' }
  }
  if (!subscriptionEvents.has(event.eventName)) {
    return recordIgnoredLemonSqueezyEvent(
      prisma,
      event,
      'Lemon Squeezy event ignored.',
    )
  }

  const existingEvent = await prisma.billingWebhookEvent.findUnique({
    where: { deliveryId: event.deliveryId },
  })
  if (isFinalBillingWebhookStatus(existingEvent?.status)) {
    return {
      processed: false,
      duplicate: true,
      message: `Lemon Squeezy ${event.eventName} already handled.`,
    }
  }
  if (
    existingEvent?.status === 'processing' &&
    existingEvent.createdAt.getTime() > Date.now() - processingRetryDelayMs
  ) {
    return {
      processed: false,
      duplicate: true,
      message: `Lemon Squeezy ${event.eventName} is already processing.`,
    }
  }

  const delivery = await prisma.billingWebhookEvent.upsert({
    where: { deliveryId: event.deliveryId },
    update: {
      eventName: event.eventName,
      status: 'processing',
      message: null,
      processedAt: null,
    },
    create: {
      deliveryId: event.deliveryId,
      eventName: event.eventName,
      status: 'processing',
    },
  })

  const organizationLookup = getOrganizationLookup(event)
  if (!organizationLookup) {
    await prisma.billingWebhookEvent.update({
      where: { id: delivery.id },
      data: {
        status: 'ignored',
        message:
          'Lemon Squeezy event did not include organization or subscription identifiers.',
        processedAt: new Date(),
      },
    })
    return {
      processed: false,
      message:
        'Lemon Squeezy event did not include organization or subscription identifiers.',
    }
  }

  const organization = await prisma.organization.findFirst({
    where: organizationLookup,
  })
  if (!organization) {
    await prisma.billingWebhookEvent.update({
      where: { id: delivery.id },
      data: {
        status: 'ignored',
        message:
          'No organization matched this Lemon Squeezy subscription event.',
        processedAt: new Date(),
      },
    })
    return {
      processed: false,
      message: 'No organization matched this Lemon Squeezy subscription event.',
    }
  }

  const attributes = event.data.attributes ?? {}
  const billingStatus = getBillingStatusForLemonSqueezySubscription(
    event.eventName,
    attributes.status,
  )
  if (
    event.eventName === 'subscription_updated' &&
    billingStatus === 'active' &&
    organization.billingStatus === 'canceled' &&
    organization.planKey === 'free'
  ) {
    const message =
      'Ignored stale active subscription update after cancellation or expiration.'
    await prisma.billingWebhookEvent.update({
      where: { id: delivery.id },
      data: {
        status: 'ignored',
        message,
        organizationId: organization.id,
        processedAt: new Date(),
      },
    })
    return { processed: false, ignored: true, message }
  }

  const planKey = getPlanKeyFromLemonSqueezyEvent(event)
  const isExpired =
    event.eventName === 'subscription_expired' ||
    attributes.status === 'expired'
  const nextPlanKey = isExpired ? 'free' : (planKey ?? organization.planKey)
  const isUpgrade =
    nextPlanKey !== organization.planKey && nextPlanKey !== 'free'
  const customerId = stringFromValue(attributes.customer_id)
  const variantId = stringFromValue(attributes.variant_id)
  const priceId = stringFromValue(attributes.first_subscription_item?.price_id)

  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      planKey: nextPlanKey,
      billingStatus,
      lemonSqueezyCustomerId: customerId ?? organization.lemonSqueezyCustomerId,
      lemonSqueezySubscriptionId:
        event.data.id ?? organization.lemonSqueezySubscriptionId,
      lemonSqueezySubscriptionStatus: attributes.status ?? event.eventName,
      lemonSqueezyVariantId: variantId ?? organization.lemonSqueezyVariantId,
      lemonSqueezyPriceId: priceId ?? organization.lemonSqueezyPriceId,
      trialEndsAt:
        billingStatus === 'trialing'
          ? dateFromLemonSqueezy(attributes.trial_ends_at)
          : organization.trialEndsAt,
      cancellationEffectiveAt:
        billingStatus === 'canceled'
          ? (dateFromLemonSqueezy(attributes.ends_at) ?? new Date())
          : null,
      failedPaymentAt: billingStatus === 'past_due' ? new Date() : null,
      lastUpgradeAt: isUpgrade ? new Date() : organization.lastUpgradeAt,
    },
  })

  await createBillingAuditEvent(prisma, {
    deliveryId: event.deliveryId,
    eventName: event.eventName,
    subscriptionId: event.data.id,
    customerId,
    organizationId: organization.id,
    planKey: nextPlanKey,
    previousPlan: organization.planKey,
    billingStatus,
    activationEvent: isUpgrade
      ? 'upgrade_completed'
      : isExpired
        ? 'subscription_expired'
        : billingStatus === 'past_due'
          ? 'payment_failed'
          : undefined,
  })

  await prisma.billingWebhookEvent.update({
    where: { id: delivery.id },
    data: {
      status: 'processed',
      message: `Lemon Squeezy ${event.eventName} processed.`,
      organizationId: organization.id,
      processedAt: new Date(),
    },
  })

  return {
    processed: true,
    message: `Lemon Squeezy ${event.eventName} processed.`,
  }
}
