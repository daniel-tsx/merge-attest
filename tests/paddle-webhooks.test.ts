import { describe, expect, it, vi } from 'vitest'

describe('Paddle subscription helpers', () => {
  it('maps subscription custom data to plan keys', async () => {
    const { getPlanKeyFromSubscriptionData } =
      await import('../lib/paddle-webhooks')

    expect(
      getPlanKeyFromSubscriptionData({ customData: { planKey: 'team' } }),
    ).toBe('team')
  })

  it('maps configured Paddle price ids to plan keys', async () => {
    vi.stubEnv('PADDLE_GROWTH_PRICE_ID', 'pri_growth')
    const { getPlanKeyForPaddlePriceId } = await import('../lib/billing')

    expect(getPlanKeyForPaddlePriceId('pri_growth')).toBe('growth')
    expect(getPlanKeyForPaddlePriceId('pri_unknown')).toBeNull()

    vi.unstubAllEnvs()
  })

  it('returns null when paid plan price ids are not configured', async () => {
    const { getPaddlePriceId } = await import('../lib/billing')

    expect(getPaddlePriceId('starter')).toBeNull()
    expect(getPaddlePriceId('free')).toBeNull()
  })

  it('maps Paddle subscription states to billing lifecycle states', async () => {
    const { getBillingStatusForPaddleEvent } =
      await import('../lib/paddle-webhooks')

    expect(
      getBillingStatusForPaddleEvent('subscription.trialing', 'trialing'),
    ).toBe('trialing')
    expect(getBillingStatusForPaddleEvent('subscription.past_due')).toBe(
      'past_due',
    )
    expect(getBillingStatusForPaddleEvent('subscription.canceled')).toBe(
      'canceled',
    )
    expect(
      getBillingStatusForPaddleEvent('subscription.updated', 'active'),
    ).toBe('active')
  })
})
