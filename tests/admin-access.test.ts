import { describe, expect, it } from 'vitest'
import { getAdminEmails } from '../lib/env'
import { isPlatformAdminEmail } from '../lib/admin/access'

describe('admin access', () => {
  it('parses a comma-separated, case-insensitive allowlist', () => {
    expect(
      getAdminEmails({ ADMIN_EMAILS: ' Owner@Example.com , ops@example.com ' }),
    ).toEqual(['owner@example.com', 'ops@example.com'])
  })

  it('returns an empty allowlist when unset or blank', () => {
    expect(getAdminEmails({})).toEqual([])
    expect(getAdminEmails({ ADMIN_EMAILS: '   ' })).toEqual([])
  })

  it('matches allowlisted emails regardless of case or surrounding space', () => {
    const env = { ADMIN_EMAILS: 'owner@example.com' }
    expect(isPlatformAdminEmail(' Owner@Example.com ', env)).toBe(true)
    expect(isPlatformAdminEmail('member@example.com', env)).toBe(false)
  })

  it('rejects empty input and an empty allowlist', () => {
    expect(
      isPlatformAdminEmail(null, { ADMIN_EMAILS: 'owner@example.com' }),
    ).toBe(false)
    expect(isPlatformAdminEmail('owner@example.com', {})).toBe(false)
  })
})
