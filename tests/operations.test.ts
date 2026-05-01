import { describe, expect, it } from 'vitest'
import { summarizeDiagnostics } from '../lib/diagnostics'
import {
  checkRateLimit,
  clearRateLimitBuckets,
  getRateLimitRule,
  rateLimitKey,
  rateLimitRules,
} from '../lib/rate-limit'
import { applySecurityHeaders } from '../lib/security'

describe('rate limits', () => {
  it('classifies auth, webhook, mutation, and public routes', () => {
    expect(getRateLimitRule('/api/auth/sign-in', 'POST')).toBe(
      rateLimitRules.auth,
    )
    expect(getRateLimitRule('/api/github/webhook', 'POST')).toBe(
      rateLimitRules.webhook,
    )
    expect(getRateLimitRule('/api/team/invites', 'POST')).toBe(
      rateLimitRules.mutation,
    )
    expect(getRateLimitRule('/api/health', 'GET')).toBe(rateLimitRules.public)
  })

  it('blocks requests after the configured limit until reset', () => {
    clearRateLimitBuckets()
    const key = rateLimitKey({
      ip: '127.0.0.1',
      pathname: '/api/test',
      method: 'POST',
    })
    const rule = { limit: 2, windowMs: 1_000 }

    expect(checkRateLimit(key, rule, 0).allowed).toBe(true)
    expect(checkRateLimit(key, rule, 100).allowed).toBe(true)
    expect(checkRateLimit(key, rule, 200).allowed).toBe(false)
    expect(checkRateLimit(key, rule, 1_001).allowed).toBe(true)
  })
})

describe('security headers', () => {
  it('applies baseline browser hardening headers', () => {
    const headers = applySecurityHeaders(new Headers())

    expect(headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(headers.get('X-Frame-Options')).toBe('DENY')
    expect(headers.get('Referrer-Policy')).toBe(
      'strict-origin-when-cross-origin',
    )
  })
})

describe('diagnostics', () => {
  it('summarizes diagnostic severity', () => {
    expect(
      summarizeDiagnostics([{ name: 'database', status: 'ok', message: 'ok' }]),
    ).toBe('ok')
    expect(
      summarizeDiagnostics([
        { name: 'database', status: 'ok', message: 'ok' },
        { name: 'paddle', status: 'warning', message: 'not configured' },
      ]),
    ).toBe('warning')
    expect(
      summarizeDiagnostics([
        { name: 'database', status: 'error', message: 'failed' },
      ]),
    ).toBe('error')
  })
})
