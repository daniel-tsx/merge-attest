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
        GITHUB_WEBHOOK_SECRET: 'webhook',
        JOB_RUNNER_SECRET: 'job',
      }),
    ).not.toThrow()
  })

  it('reports missing production secrets together', () => {
    expect(() => validateProductionEnv({ NODE_ENV: 'production' })).toThrow(
      'DATABASE_URL, BETTER_AUTH_SECRET, GITHUB_WEBHOOK_SECRET, JOB_RUNNER_SECRET',
    )
  })
})
