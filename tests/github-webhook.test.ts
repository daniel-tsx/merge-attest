import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyGitHubWebhook } from '../lib/github'
import {
  getWebhookInstallationId,
  mapGitHubCiStatus,
  parseGitHubWebhookPayload,
  shouldSyncPullRequestAction,
} from '../lib/github-webhooks'
import {
  createGitHubInstallationState,
  verifyGitHubInstallationState,
} from '../lib/github-installation-state'

function signatureFor(body: string, secret: string) {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`
}

describe('GitHub webhook verification', () => {
  it('allows unsigned demo webhooks outside production', () => {
    const result = verifyGitHubWebhook('{}', null, { NODE_ENV: 'development' })

    expect(result).toEqual({ ok: true, mode: 'demo' })
  })

  it('fails closed when the webhook secret is missing in production', () => {
    const result = verifyGitHubWebhook('{}', null, { NODE_ENV: 'production' })

    expect(result).toEqual({
      ok: false,
      mode: 'live',
      reason: 'missing_secret',
    })
  })

  it('accepts a valid live signature', () => {
    const body = JSON.stringify({ action: 'opened' })
    const secret = 'webhook-secret'
    const result = verifyGitHubWebhook(body, signatureFor(body, secret), {
      NODE_ENV: 'production',
      GITHUB_WEBHOOK_SECRET: secret,
    })

    expect(result).toEqual({ ok: true, mode: 'live' })
  })

  it('rejects an invalid live signature', () => {
    const result = verifyGitHubWebhook('{}', 'sha256=invalid', {
      NODE_ENV: 'production',
      GITHUB_WEBHOOK_SECRET: 'webhook-secret',
    })

    expect(result).toEqual({
      ok: false,
      mode: 'live',
      reason: 'invalid_signature',
    })
  })
})

describe('GitHub webhook dispatch helpers', () => {
  it('parses webhook payloads and extracts installation ids', () => {
    const payload = parseGitHubWebhookPayload(
      JSON.stringify({ installation: { id: 123 }, action: 'opened' }),
    )

    expect(getWebhookInstallationId(payload)).toBe('123')
  })

  it('selects pull request actions that should trigger a sync', () => {
    expect(shouldSyncPullRequestAction('opened')).toBe(true)
    expect(shouldSyncPullRequestAction('synchronize')).toBe(true)
    expect(shouldSyncPullRequestAction('labeled')).toBe(false)
  })

  it('maps GitHub check states to internal CI status', () => {
    expect(mapGitHubCiStatus({ status: 'in_progress' })).toBe('pending')
    expect(
      mapGitHubCiStatus({ status: 'completed', conclusion: 'success' }),
    ).toBe('passing')
    expect(
      mapGitHubCiStatus({ status: 'completed', conclusion: 'failure' }),
    ).toBe('failing')
    expect(mapGitHubCiStatus({ status: 'completed' })).toBe('unknown')
  })

  it('rejects non-object webhook payloads', () => {
    expect(() => parseGitHubWebhookPayload('[]')).toThrow(
      'payload must be an object',
    )
  })
})

describe('GitHub installation state', () => {
  it('verifies signed state for the expected organization', () => {
    const now = new Date('2026-05-02T00:00:00.000Z')
    const state = createGitHubInstallationState('org_123', now)

    expect(
      verifyGitHubInstallationState(
        state,
        'org_123',
        new Date('2026-05-02T00:05:00.000Z'),
      ),
    ).toEqual({ ok: true, organizationId: 'org_123' })
  })

  it('rejects missing, mismatched, and expired state', () => {
    const now = new Date('2026-05-02T00:00:00.000Z')
    const state = createGitHubInstallationState('org_123', now)

    expect(verifyGitHubInstallationState(null, 'org_123').reason).toBe(
      'missing_state',
    )
    expect(verifyGitHubInstallationState(state, 'org_other', now).reason).toBe(
      'organization_mismatch',
    )
    expect(
      verifyGitHubInstallationState(
        state,
        'org_123',
        new Date('2026-05-02T00:16:00.000Z'),
      ).reason,
    ).toBe('expired_state')
  })
})
