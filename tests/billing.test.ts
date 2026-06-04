import { describe, expect, it, vi } from 'vitest'

describe('billing helpers', () => {
  it('reports Lemon Squeezy customer portal access from billing ids', async () => {
    const { hasLemonSqueezyCustomerPortalAccess } =
      await import('../lib/billing')

    expect(hasLemonSqueezyCustomerPortalAccess({ customerId: '123' })).toBe(
      true,
    )
    expect(hasLemonSqueezyCustomerPortalAccess({})).toBe(false)
  })

  it('does not report mock billing mode in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('LEMON_SQUEEZY_API_KEY', '')
    vi.stubEnv('LEMON_SQUEEZY_STORE_ID', '')
    const { getBillingMode } = await import('../lib/billing')

    expect(getBillingMode()).toBe('unconfigured')

    vi.unstubAllEnvs()
  })

  it('builds billing return URLs from trusted app configuration', async () => {
    vi.stubEnv('BETTER_AUTH_URL', 'https://app.example.test')
    const { getBillingReturnUrl } = await import('../lib/billing')

    expect(getBillingReturnUrl()).toBe(
      'https://app.example.test/settings/billing',
    )

    vi.unstubAllEnvs()
  })

  it('creates Lemon Squeezy checkout sessions without trusting request hosts', async () => {
    vi.stubEnv('LEMON_SQUEEZY_API_KEY', 'api-key')
    vi.stubEnv('LEMON_SQUEEZY_STORE_ID', '111')
    vi.stubEnv('LEMON_SQUEEZY_TEAM_VARIANT_ID', '222')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { attributes: { url: 'https://checkout.example.test' } },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const { createCheckoutSession } = await import('../lib/billing')

    await expect(
      createCheckoutSession({
        organizationId: 'org_123',
        planKey: 'team',
        customerEmail: 'owner@example.test',
        customerName: 'Owner',
        returnUrl: 'https://app.example.test/settings/billing',
      }),
    ).resolves.toBe('https://checkout.example.test')

    const [, init] = fetchMock.mock.calls[0]
    const payload = JSON.parse(String(init.body))
    expect(payload.data.attributes.checkout_data.custom).toEqual({
      organizationId: 'org_123',
      planKey: 'team',
    })
    expect(payload.data.relationships.variant.data.id).toBe('222')

    vi.unstubAllGlobals()
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
