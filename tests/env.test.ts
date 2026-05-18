import { describe, expect, it } from 'vitest'
import { getBetterAuthSecret, validateProductionEnv } from '../lib/env'

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
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/agentgate',
        BETTER_AUTH_SECRET: 'secret',
        BETTER_AUTH_URL: 'https://app.example.test',
        BETTER_AUTH_API_KEY: 'better-auth-infra',
        GITHUB_APP_ID: '12345',
        GITHUB_APP_SLUG: 'agentgate',
        GITHUB_APP_PRIVATE_KEY: 'private-key',
        GITHUB_WEBHOOK_SECRET: 'webhook',
        PADDLE_API_KEY: 'paddle',
        PADDLE_WEBHOOK_SECRET: 'paddle-webhook',
        PADDLE_STARTER_PRICE_ID: 'pri_starter',
        PADDLE_TEAM_PRICE_ID: 'pri_team',
        PADDLE_GROWTH_PRICE_ID: 'pri_growth',
        PADDLE_CUSTOMER_PORTAL_URL: 'https://billing.example.test',
        JOB_RUNNER_SECRET: 'job',
        EMAIL_FROM: 'AgentGate <noreply@example.com>',
        RESEND_API_KEY: 'resend',
        SUPPORT_EMAIL: 'support@example.com',
      }),
    ).not.toThrow()
  })

  it('reports missing production secrets together', () => {
    expect(() => validateProductionEnv({ NODE_ENV: 'production' })).toThrow(
      'DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, BETTER_AUTH_API_KEY, GITHUB_APP_ID, GITHUB_APP_SLUG, GITHUB_APP_PRIVATE_KEY, GITHUB_WEBHOOK_SECRET, PADDLE_API_KEY, PADDLE_WEBHOOK_SECRET, PADDLE_STARTER_PRICE_ID, PADDLE_TEAM_PRICE_ID, PADDLE_GROWTH_PRICE_ID, PADDLE_CUSTOMER_PORTAL_URL, JOB_RUNNER_SECRET, EMAIL_FROM, RESEND_API_KEY, SUPPORT_EMAIL',
    )
  })
})
