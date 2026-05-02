import {
  getPaddleClient,
  getPaddleWebhookSecret,
  getPlanKeyForPaddlePriceId,
} from '@/lib/billing'
import { getPrismaClient } from '@/lib/prisma'
import type { BillingStatus, PlanKey } from '@/lib/types'

type PaddleSubscriptionData = {
  id?: string
  status?: string
  customerId?: string
  customData?: Record<string, unknown> | null
  currentBillingPeriod?: { endsAt?: string | null } | null
  scheduledChange?: {
    action?: string | null
    effectiveAt?: string | null
  } | null
  items?: Array<{ price?: { id?: string } | null }>
}

type PaddleEvent = {
  eventType: string
  eventId?: string
  data: PaddleSubscriptionData
}

const subscriptionEvents = new Set([
  'subscription.created',
  'subscription.activated',
  'subscription.updated',
  'subscription.trialing',
  'subscription.resumed',
  'subscription.paused',
  'subscription.past_due',
  'subscription.canceled',
])

function asPaddleEvent(value: unknown): PaddleEvent {
  const event = value as {
    eventType?: unknown
    eventId?: unknown
    data?: unknown
  }
  const data = event.data as PaddleSubscriptionData | undefined

  if (
    typeof event.eventType !== 'string' ||
    !data ||
    typeof data !== 'object'
  ) {
    throw new Error('Unsupported Paddle webhook event payload.')
  }

  return {
    eventType: event.eventType,
    eventId: typeof event.eventId === 'string' ? event.eventId : undefined,
    data,
  }
}

export function getPlanKeyFromSubscriptionData(
  data: PaddleSubscriptionData,
): PlanKey | null {
  const customPlanKey = data.customData?.planKey
  if (
    customPlanKey === 'free' ||
    customPlanKey === 'starter' ||
    customPlanKey === 'team' ||
    customPlanKey === 'growth' ||
    customPlanKey === 'enterprise'
  ) {
    return customPlanKey
  }

  const priceId = data.items?.find((item) => item.price?.id)?.price?.id
  return getPlanKeyForPaddlePriceId(priceId)
}

function getOrganizationLookup(data: PaddleSubscriptionData) {
  const organizationId = data.customData?.organizationId

  if (typeof organizationId === 'string' && organizationId) {
    return { id: organizationId }
  }

  if (data.id) return { paddleSubscriptionId: data.id }
  if (data.customerId) return { paddleCustomerId: data.customerId }

  return null
}

function dateFromPaddle(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getBillingStatusForPaddleEvent(
  eventType: string,
  status?: string,
): BillingStatus {
  if (eventType === 'subscription.trialing' || status === 'trialing') {
    return 'trialing'
  }
  if (eventType === 'subscription.past_due' || status === 'past_due') {
    return 'past_due'
  }
  if (eventType === 'subscription.paused' || status === 'paused')
    return 'paused'
  if (eventType === 'subscription.canceled' || status === 'canceled') {
    return 'canceled'
  }
  return 'active'
}

export function isProcessedPaddleWebhookStatus(status?: string | null) {
  return status === 'processed'
}

export async function processPaddleSubscriptionEvent(event: PaddleEvent) {
  const prisma = getPrismaClient()
  if (!prisma || !subscriptionEvents.has(event.eventType)) {
    return { processed: false, message: 'Paddle event ignored.' }
  }

  const existingEvent = event.eventId
    ? await prisma.paddleWebhookEvent.findUnique({
        where: { eventId: event.eventId },
      })
    : null
  if (isProcessedPaddleWebhookStatus(existingEvent?.status)) {
    return {
      processed: false,
      duplicate: true,
      message: `Paddle ${event.eventType} already processed.`,
    }
  }

  const delivery = event.eventId
    ? existingEvent
      ? await prisma.paddleWebhookEvent.update({
          where: { id: existingEvent.id },
          data: {
            eventType: event.eventType,
            status: 'processing',
            message: null,
            processedAt: null,
          },
        })
      : await prisma.paddleWebhookEvent.create({
          data: {
            eventId: event.eventId,
            eventType: event.eventType,
            status: 'processing',
          },
        })
    : null

  const organizationLookup = getOrganizationLookup(event.data)
  if (!organizationLookup) {
    if (delivery) {
      await prisma.paddleWebhookEvent.update({
        where: { id: delivery.id },
        data: {
          status: 'ignored',
          message:
            'Paddle event did not include organization or subscription identifiers.',
          processedAt: new Date(),
        },
      })
    }
    return {
      processed: false,
      message:
        'Paddle event did not include organization or subscription identifiers.',
    }
  }

  const planKey = getPlanKeyFromSubscriptionData(event.data)
  const isCanceled = event.eventType === 'subscription.canceled'
  const billingStatus = getBillingStatusForPaddleEvent(
    event.eventType,
    event.data.status,
  )
  const organization = await prisma.organization.findFirst({
    where: organizationLookup,
  })

  if (!organization) {
    if (delivery) {
      await prisma.paddleWebhookEvent.update({
        where: { id: delivery.id },
        data: {
          status: 'ignored',
          message: 'No organization matched this Paddle subscription event.',
          processedAt: new Date(),
        },
      })
    }
    return {
      processed: false,
      message: 'No organization matched this Paddle subscription event.',
    }
  }

  const nextPlanKey = isCanceled ? 'free' : (planKey ?? organization.planKey)
  const isUpgrade =
    nextPlanKey !== organization.planKey && nextPlanKey !== 'free'

  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      planKey: nextPlanKey,
      billingStatus,
      paddleCustomerId: event.data.customerId ?? organization.paddleCustomerId,
      paddleSubscriptionId: event.data.id ?? organization.paddleSubscriptionId,
      paddleSubscriptionStatus: event.data.status ?? event.eventType,
      paddlePriceId:
        event.data.items?.find((item) => item.price?.id)?.price?.id ??
        organization.paddlePriceId,
      trialEndsAt:
        billingStatus === 'trialing'
          ? dateFromPaddle(event.data.currentBillingPeriod?.endsAt)
          : organization.trialEndsAt,
      cancellationEffectiveAt:
        isCanceled || event.data.scheduledChange?.action === 'cancel'
          ? (dateFromPaddle(event.data.scheduledChange?.effectiveAt) ??
            new Date())
          : null,
      failedPaymentAt: billingStatus === 'past_due' ? new Date() : null,
      lastUpgradeAt: isUpgrade ? new Date() : organization.lastUpgradeAt,
    },
  })

  await prisma.auditEvent.create({
    data: {
      eventType: 'settings_changed',
      actor: 'Paddle',
      summary: `Paddle ${event.eventType} processed`,
      metadata: {
        eventId: event.eventId,
        subscriptionId: event.data.id,
        customerId: event.data.customerId,
        planKey: nextPlanKey,
        previousPlan: organization.planKey,
        billingStatus,
        activationEvent: isUpgrade
          ? 'upgrade_completed'
          : isCanceled
            ? 'subscription_canceled'
            : billingStatus === 'past_due'
              ? 'payment_failed'
              : undefined,
      },
      organizationId: organization.id,
    },
  })

  if (delivery) {
    await prisma.paddleWebhookEvent.update({
      where: { id: delivery.id },
      data: {
        status: 'processed',
        message: `Paddle ${event.eventType} processed.`,
        organizationId: organization.id,
        processedAt: new Date(),
      },
    })
  }

  return { processed: true, message: `Paddle ${event.eventType} processed.` }
}

export async function unmarshalPaddleWebhook(
  rawBody: string,
  signature: string | null,
) {
  const paddle = getPaddleClient()
  const secret = getPaddleWebhookSecret()

  if (!paddle || !secret || !signature) {
    throw new Error('Paddle webhook credentials are not configured.')
  }

  return asPaddleEvent(
    await paddle.webhooks.unmarshal(rawBody, secret, signature),
  )
}
