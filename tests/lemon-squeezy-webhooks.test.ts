import crypto from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function subscriptionEvent() {
  return {
    deliveryId: 'delivery_1',
    eventName: 'subscription_created',
    meta: { custom_data: { organizationId: 'org_1', planKey: 'team' } },
    data: {
      id: 'sub_1',
      attributes: {
        customer_id: 'cus_1',
        first_subscription_item: { price_id: 'price_1' },
        status: 'active',
        variant_id: 'variant_1',
      },
    },
  }
}

function organization() {
  return {
    billingStatus: 'active',
    id: 'org_1',
    planKey: 'free',
    lemonSqueezyCustomerId: null,
    lemonSqueezySubscriptionId: null,
    lemonSqueezyVariantId: null,
    lemonSqueezyPriceId: null,
    trialEndsAt: null,
    lastUpgradeAt: null,
  }
}

function prismaMock() {
  return {
    $transaction: vi.fn(() => {
      throw new Error('Transactions are not supported by this driver.')
    }),
    auditEvent: {
      create: vi.fn().mockResolvedValue({ id: 'audit_1' }),
    },
    billingWebhookEvent: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({
        id: 'billing_event_1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        status: 'processing',
      }),
      update: vi.fn().mockResolvedValue({ id: 'billing_event_1' }),
    },
    organization: {
      findFirst: vi.fn().mockResolvedValue(organization()),
      update: vi.fn().mockResolvedValue(organization()),
    },
  }
}

async function importWebhookHelpersWithPrisma(
  prisma: ReturnType<typeof prismaMock>,
  reportError = vi.fn(),
) {
  vi.doMock('@/lib/prisma', () => ({
    getPrismaClient: () => prisma,
  }))
  vi.doMock('@/lib/observability', () => ({
    logEvent: vi.fn(),
    reportError,
  }))

  return import('../lib/lemon-squeezy-webhooks')
}

describe('Lemon Squeezy subscription helpers', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('maps subscription custom data to plan keys', async () => {
    const { getPlanKeyFromLemonSqueezyEvent } = await import(
      '../lib/lemon-squeezy-webhooks'
    )

    expect(
      getPlanKeyFromLemonSqueezyEvent({
        deliveryId: 'delivery',
        eventName: 'subscription_created',
        meta: { custom_data: { planKey: 'team' } },
        data: { id: '1', attributes: {} },
      }),
    ).toBe('team')
  })

  it('maps configured Lemon Squeezy variant ids to plan keys', async () => {
    vi.stubEnv('LEMON_SQUEEZY_GROWTH_VARIANT_ID', '123')
    const { getPlanKeyForLemonSqueezyVariantId } = await import(
      '../lib/billing'
    )

    expect(getPlanKeyForLemonSqueezyVariantId('123')).toBe('growth')
    expect(getPlanKeyForLemonSqueezyVariantId('999')).toBeNull()
  })

  it('returns null when paid plan variant ids are not configured', async () => {
    const { getLemonSqueezyVariantId } = await import('../lib/billing')

    expect(getLemonSqueezyVariantId('starter')).toBeNull()
    expect(getLemonSqueezyVariantId('free')).toBeNull()
  })

  it('maps Lemon Squeezy subscription states to billing lifecycle states', async () => {
    const { getBillingStatusForLemonSqueezySubscription } = await import(
      '../lib/lemon-squeezy-webhooks'
    )

    expect(
      getBillingStatusForLemonSqueezySubscription(
        'subscription_created',
        'on_trial',
      ),
    ).toBe('trialing')
    expect(
      getBillingStatusForLemonSqueezySubscription(
        'subscription_updated',
        'past_due',
      ),
    ).toBe('past_due')
    expect(
      getBillingStatusForLemonSqueezySubscription(
        'subscription_cancelled',
        'cancelled',
      ),
    ).toBe('canceled')
    expect(
      getBillingStatusForLemonSqueezySubscription(
        'subscription_updated',
        'active',
      ),
    ).toBe('active')
  })

  it('identifies processed webhook deliveries as duplicates', async () => {
    const { isProcessedBillingWebhookStatus } = await import(
      '../lib/lemon-squeezy-webhooks'
    )

    expect(isProcessedBillingWebhookStatus('processed')).toBe(true)
    expect(isProcessedBillingWebhookStatus('processing')).toBe(false)
    expect(isProcessedBillingWebhookStatus(null)).toBe(false)
  })

  it('verifies Lemon Squeezy webhook signatures', async () => {
    const { verifyLemonSqueezyWebhookSignature } = await import(
      '../lib/lemon-squeezy-webhooks'
    )
    const rawBody = JSON.stringify({
      meta: { event_name: 'subscription_created' },
      data: { type: 'subscriptions', id: '1', attributes: {} },
    })
    const signature = crypto
      .createHmac('sha256', 'secret')
      .update(rawBody)
      .digest('hex')

    expect(
      verifyLemonSqueezyWebhookSignature(rawBody, signature, 'secret'),
    ).toBe(true)
    expect(
      verifyLemonSqueezyWebhookSignature(
        rawBody,
        signature.toUpperCase(),
        'secret',
      ),
    ).toBe(true)
    expect(
      verifyLemonSqueezyWebhookSignature(rawBody, 'bad', 'secret'),
    ).toBe(false)
  })

  it('processes subscription events without requiring database transactions', async () => {
    const prisma = prismaMock()
    const { processLemonSqueezySubscriptionEvent } =
      await importWebhookHelpersWithPrisma(prisma)

    await expect(
      processLemonSqueezySubscriptionEvent(subscriptionEvent()),
    ).resolves.toMatchObject({ processed: true })

    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(prisma.organization.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'org_1' },
        data: expect.objectContaining({
          billingStatus: 'active',
          lemonSqueezySubscriptionId: 'sub_1',
          planKey: 'team',
        }),
      }),
    )
    expect(prisma.billingWebhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'processed' }),
      }),
    )
  })

  it('does not fail successful business handling when audit logging fails', async () => {
    const prisma = prismaMock()
    const reportError = vi.fn()
    prisma.auditEvent.create.mockRejectedValue(new Error('audit unavailable'))
    const { processLemonSqueezySubscriptionEvent } =
      await importWebhookHelpersWithPrisma(prisma, reportError)

    await expect(
      processLemonSqueezySubscriptionEvent(subscriptionEvent()),
    ).resolves.toMatchObject({ processed: true })

    expect(reportError).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'lemon_squeezy_audit_event_failed',
        area: 'billing',
      }),
    )
    expect(prisma.billingWebhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'processed' }),
      }),
    )
  })

  it('records unsupported order and refund deliveries as idempotently ignored', async () => {
    const prisma = prismaMock()
    const { processLemonSqueezySubscriptionEvent } =
      await importWebhookHelpersWithPrisma(prisma)

    await expect(
      processLemonSqueezySubscriptionEvent({
        deliveryId: 'delivery_order_1',
        eventName: 'order_created',
        meta: { custom_data: { organizationId: 'org_1' } },
        data: { id: 'order_1', attributes: {} },
      }),
    ).resolves.toMatchObject({ ignored: true, processed: false })
    expect(prisma.billingWebhookEvent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          deliveryId: 'delivery_order_1',
          eventName: 'order_created',
          status: 'ignored',
        }),
      }),
    )
    expect(prisma.organization.update).not.toHaveBeenCalled()

    vi.clearAllMocks()
    prisma.billingWebhookEvent.findUnique.mockResolvedValue({
      id: 'billing_event_1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      status: 'ignored',
    })

    await expect(
      processLemonSqueezySubscriptionEvent({
        deliveryId: 'delivery_refund_1',
        eventName: 'order_refunded',
        meta: { custom_data: { organizationId: 'org_1' } },
        data: { id: 'order_1', attributes: {} },
      }),
    ).resolves.toMatchObject({
      duplicate: true,
      ignored: true,
      processed: false,
    })
    expect(prisma.billingWebhookEvent.upsert).not.toHaveBeenCalled()
    expect(prisma.organization.update).not.toHaveBeenCalled()
  })

  it('marks subscription deliveries ignored when no organization is mapped', async () => {
    const prisma = prismaMock()
    prisma.organization.findFirst.mockResolvedValue(null)
    const { processLemonSqueezySubscriptionEvent } =
      await importWebhookHelpersWithPrisma(prisma)

    await expect(
      processLemonSqueezySubscriptionEvent(subscriptionEvent()),
    ).resolves.toMatchObject({
      processed: false,
      message: 'No organization matched this Lemon Squeezy subscription event.',
    })

    expect(prisma.organization.update).not.toHaveBeenCalled()
    expect(prisma.auditEvent.create).not.toHaveBeenCalled()
    expect(prisma.billingWebhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          message:
            'No organization matched this Lemon Squeezy subscription event.',
          status: 'ignored',
        }),
      }),
    )
  })

  it('does not restore paid access from stale active updates after expiration', async () => {
    const prisma = prismaMock()
    prisma.organization.findFirst.mockResolvedValue({
      ...organization(),
      billingStatus: 'canceled',
      planKey: 'free',
    })
    const { processLemonSqueezySubscriptionEvent } =
      await importWebhookHelpersWithPrisma(prisma)

    await expect(
      processLemonSqueezySubscriptionEvent({
        ...subscriptionEvent(),
        eventName: 'subscription_updated',
      }),
    ).resolves.toMatchObject({
      ignored: true,
      processed: false,
      message:
        'Ignored stale active subscription update after cancellation or expiration.',
    })

    expect(prisma.organization.update).not.toHaveBeenCalled()
    expect(prisma.auditEvent.create).not.toHaveBeenCalled()
    expect(prisma.billingWebhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'ignored',
          organizationId: 'org_1',
        }),
      }),
    )
  })

  it('returns 2xx when route logging fails after webhook business handling', async () => {
    const event = subscriptionEvent()
    const reportError = vi.fn()
    vi.doMock('@/lib/lemon-squeezy-webhooks', () => ({
      processLemonSqueezySubscriptionEvent: vi.fn().mockResolvedValue({
        processed: true,
        message: 'Lemon Squeezy subscription_created processed.',
      }),
      unmarshalLemonSqueezyWebhook: vi.fn(() => event),
    }))
    vi.doMock('@/lib/observability', () => ({
      logEvent: vi.fn(() => {
        throw new Error('log unavailable')
      }),
      reportError,
    }))
    const { POST } = await import('../app/api/lemon-squeezy/webhook/route')

    const response = await POST(
      new Request('https://example.test/api/lemon-squeezy/webhook', {
        body: '{}',
        headers: { 'x-signature': 'signature' },
        method: 'POST',
      }),
    )

    await expect(response.json()).resolves.toMatchObject({
      event: 'subscription_created',
      received: true,
    })
    expect(response.status).toBe(200)
    expect(reportError).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'lemon_squeezy_webhook_log_failed',
        area: 'billing',
      }),
    )
  })
})
