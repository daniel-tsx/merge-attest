import { describe, expect, it } from 'vitest'
import {
  getAuditRetentionStart,
  serializeAuditEventsToCsv,
} from '../lib/audit-export'

describe('audit export', () => {
  it('serializes audit events as escaped CSV', () => {
    const csv = serializeAuditEventsToCsv([
      {
        id: 'audit-1',
        eventType: 'settings_changed',
        actor: 'Dana "Ops"',
        repositoryName: 'billing-api',
        pullRequestNumber: 42,
        summary: 'Changed export settings',
        metadata: { planKey: 'growth' },
        createdAt: '2026-05-01T00:00:00.000Z',
      },
    ])

    expect(csv).toContain(
      'created_at,event_type,summary,actor,repository,pull_request,metadata',
    )
    expect(csv).toContain('"Dana ""Ops"""')
    expect(csv).toContain('"#42"')
    expect(csv).toContain('"{""planKey"":""growth""}"')
  })

  it('escapes spreadsheet formula prefixes in exported values', () => {
    const csv = serializeAuditEventsToCsv([
      {
        id: 'audit-1',
        eventType: 'settings_changed',
        actor: '=cmd',
        summary: '+SUM(1,1)',
        metadata: {},
        createdAt: '2026-05-01T00:00:00.000Z',
      },
    ])

    expect(csv).toContain('"\'=cmd"')
    expect(csv).toContain('"\'+SUM(1,1)"')
  })

  it('uses plan retention for export windows', () => {
    const now = new Date('2026-05-01T00:00:00.000Z')

    expect(getAuditRetentionStart('growth', now)?.toISOString()).toBe(
      '2025-05-01T00:00:00.000Z',
    )
    expect(getAuditRetentionStart('enterprise', now)).toBeUndefined()
  })
})
