import crypto from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'

describe('Lemon Squeezy subscription helpers', () => {
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

    vi.unstubAllEnvs()
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
})
