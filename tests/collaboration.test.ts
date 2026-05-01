import { describe, expect, it } from 'vitest'
import {
  canChangeMemberRole,
  canInviteRole,
  canManageBilling,
  canRecordApproval,
  canRemoveMember,
  getReviewSlaStatus,
  normalizeInviteStatus,
} from '../lib/collaboration'

describe('collaboration role checks', () => {
  it('keeps viewers read-only for billing and approvals', () => {
    expect(canManageBilling('viewer')).toBe(false)
    expect(canRecordApproval('viewer')).toBe(false)
  })

  it('allows members to record approval decisions', () => {
    expect(canRecordApproval('member')).toBe(true)
    expect(canManageBilling('member')).toBe(false)
  })

  it('limits admins from creating or promoting admins', () => {
    expect(canInviteRole('admin', 'member')).toBe(true)
    expect(canInviteRole('admin', 'admin')).toBe(false)
    expect(canChangeMemberRole('admin', 'member', 'viewer')).toBe(true)
    expect(canChangeMemberRole('admin', 'member', 'admin')).toBe(false)
  })

  it('protects owner and admin removals from admins', () => {
    expect(canRemoveMember('admin', 'member')).toBe(true)
    expect(canRemoveMember('admin', 'admin')).toBe(false)
    expect(canRemoveMember('admin', 'owner')).toBe(false)
  })
})

describe('collaboration lifecycle helpers', () => {
  it('marks pending invites as expired after their expiration date', () => {
    expect(
      normalizeInviteStatus(
        'pending',
        new Date('2026-05-01T00:00:00.000Z'),
        new Date('2026-05-02T00:00:00.000Z'),
      ),
    ).toBe('expired')
  })

  it('classifies review due dates by SLA window', () => {
    const now = new Date('2026-05-02T12:00:00.000Z')

    expect(getReviewSlaStatus(null, now)).toBe('none')
    expect(getReviewSlaStatus('2026-05-02T11:00:00.000Z', now)).toBe('overdue')
    expect(getReviewSlaStatus('2026-05-03T11:00:00.000Z', now)).toBe('due_soon')
    expect(getReviewSlaStatus('2026-05-04T12:00:00.000Z', now)).toBe('on_track')
  })
})
