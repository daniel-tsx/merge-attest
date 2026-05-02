import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { getBetterAuthSecret } from '@/lib/env'

type InstallationStatePayload = {
  organizationId: string
  nonce: string
  expiresAt: string
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function signPayload(payload: string) {
  return createHmac('sha256', getBetterAuthSecret())
    .update(payload)
    .digest('base64url')
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  )
}

export function createGitHubInstallationState(
  organizationId: string,
  now = new Date(),
) {
  const expiresAt = new Date(now.getTime() + 15 * 60_000).toISOString()
  const payload = base64UrlEncode(
    JSON.stringify({
      organizationId,
      nonce: randomUUID(),
      expiresAt,
    } satisfies InstallationStatePayload),
  )
  return `${payload}.${signPayload(payload)}`
}

export function verifyGitHubInstallationState(
  state: string | null | undefined,
  expectedOrganizationId: string,
  now = new Date(),
) {
  if (!state) return { ok: false as const, reason: 'missing_state' as const }

  const [payload, signature, extra] = state.split('.')
  if (!payload || !signature || extra) {
    return { ok: false as const, reason: 'invalid_state' as const }
  }

  if (!safeEqual(signPayload(payload), signature)) {
    return { ok: false as const, reason: 'invalid_state' as const }
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as InstallationStatePayload
    if (parsed.organizationId !== expectedOrganizationId) {
      return { ok: false as const, reason: 'organization_mismatch' as const }
    }

    if (new Date(parsed.expiresAt).getTime() <= now.getTime()) {
      return { ok: false as const, reason: 'expired_state' as const }
    }

    return { ok: true as const, organizationId: parsed.organizationId }
  } catch {
    return { ok: false as const, reason: 'invalid_state' as const }
  }
}
