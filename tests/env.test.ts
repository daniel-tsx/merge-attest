import { describe, expect, it } from 'vitest'
import {
  getBetterAuthSecret,
  getSiteUrl,
  validateProductionEnv,
} from '../lib/env'

describe('environment safety', () => {
  it('uses a local auth secret only outside production', () => {
    expect(getBetterAuthSecret({ NODE_ENV: 'development' })).toContain(
      'local-development-secret',
    )
  })

  it('requires the auth secret in production', () => {
    expect(() => getBetterAuthSecret({ NODE_ENV: 'production' })).toThrow(
      'BETTER_AUTH_SECRET',
    )
  })

  it('validates required production secrets', () => {
    expect(() =>
      validateProductionEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/mergeattest',
        BETTER_AUTH_SECRET: 'secret',
        BETTER_AUTH_URL: 'https://app.example.test',
        BETTER_AUTH_API_KEY: 'better-auth-infra',
        GITHUB_APP_ID: '12345',
        GITHUB_APP_SLUG: 'mergeattest',
        GITHUB_APP_PRIVATE_KEY: 'private-key',
        GITHUB_WEBHOOK_SECRET: 'webhook',
      }),
    ).not.toThrow()
  })

  it('reports missing production secrets together', () => {
    expect(() => validateProductionEnv({ NODE_ENV: 'production' })).toThrow(
      'DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, BETTER_AUTH_API_KEY, GITHUB_APP_ID, GITHUB_APP_SLUG, GITHUB_APP_PRIVATE_KEY, GITHUB_WEBHOOK_SECRET',
    )
  })

  it('prefers NEXT_PUBLIC_SITE_URL for the canonical site URL', () => {
    expect(
      getSiteUrl({
        NEXT_PUBLIC_SITE_URL: 'https://www.mergeattest.com/',
        BETTER_AUTH_URL: 'https://legacy.example.test',
      }),
    ).toBe('https://www.mergeattest.com')
  })
})
