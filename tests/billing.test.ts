import { describe, expect, it, vi } from 'vitest'

describe('billing helpers', () => {
  it('builds Paddle customer portal URLs from configuration', async () => {
    vi.stubEnv(
      'PADDLE_CUSTOMER_PORTAL_URL',
      'https://billing.example.test/portal',
    )
    const { getPaddleCustomerPortalUrl } = await import('../lib/billing')

    expect(getPaddleCustomerPortalUrl('ctm_123')).toBe(
      'https://billing.example.test/portal?customer_id=ctm_123',
    )
    expect(getPaddleCustomerPortalUrl(null)).toBeNull()

    vi.unstubAllEnvs()
  })

  it('does not report mock billing mode in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('PADDLE_API_KEY', '')
    const { getBillingMode } = await import('../lib/billing')

    expect(getBillingMode()).toBe('unconfigured')

    vi.unstubAllEnvs()
  })

  it('describes billing lifecycle callouts', async () => {
    const { getBillingCallout } = await import('../lib/billing')

    expect(getBillingCallout({ status: 'past_due' })).toBe(
      'Payment needs attention',
    )
    expect(
      getBillingCallout({
        status: 'canceled',
        cancellationEffectiveAt: '2026-05-10T00:00:00.000Z',
      }),
    ).toContain('Cancels')
  })
})
