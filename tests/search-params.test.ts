import { describe, expect, it } from 'vitest'
import {
  pullRequestSearchParamsCache,
  serializePullRequestSearchParams,
} from '../app/pull-requests/search-params'
import {
  repositorySearchParamsCache,
  serializeRepositorySearchParams,
} from '../app/repositories/search-params'
import { serializeApprovalsSearchParams } from '../app/approvals/search-params'
import { serializeAuditLogSearchParams } from '../app/audit-log/search-params'

function readQueryString(url: string) {
  return new URLSearchParams(url.startsWith('?') ? url.slice(1) : url)
}

describe('search parameter parsers', () => {
  it('uses defaults for missing pull request filters', () => {
    expect(pullRequestSearchParamsCache.parse({})).toEqual({
      query: '',
      riskLevel: 'all',
      agentSource: 'all',
      approvalStatus: 'all',
    })
  })

  it('falls back to defaults for invalid filter values', () => {
    expect(
      pullRequestSearchParamsCache.parse({
        query: 'auth',
        riskLevel: 'urgent',
        agentSource: 'robot',
        approvalStatus: 'blocked',
      }),
    ).toEqual({
      query: 'auth',
      riskLevel: 'all',
      agentSource: 'all',
      approvalStatus: 'all',
    })
  })

  it('parses repository filters with valid enum values', () => {
    expect(
      repositorySearchParamsCache.parse({
        query: 'billing',
        riskProfile: 'high',
        visibility: 'private',
      }),
    ).toEqual({
      query: 'billing',
      riskProfile: 'high',
      visibility: 'private',
    })
  })
})

describe('search parameter serializers', () => {
  it('omits default pull request filters and keeps active filters', () => {
    const params = readQueryString(
      serializePullRequestSearchParams({
        query: 'checkout flow',
        riskLevel: 'high',
        agentSource: 'cursor',
        approvalStatus: 'all',
      }),
    )

    expect(params.get('query')).toBe('checkout flow')
    expect(params.get('riskLevel')).toBe('high')
    expect(params.get('agentSource')).toBe('cursor')
    expect(params.has('approvalStatus')).toBe(false)
  })

  it('serializes repository and approval filter combinations', () => {
    const repositoryParams = readQueryString(
      serializeRepositorySearchParams({
        query: 'api',
        riskProfile: 'medium',
        visibility: 'public',
      }),
    )
    const approvalParams = readQueryString(
      serializeApprovalsSearchParams({
        query: 'security',
        repositoryId: 'repo_123',
        approvalStatus: 'pending',
        riskLevel: 'critical',
        assigneeId: 'user_123',
        slaStatus: 'overdue',
      }),
    )

    expect(Object.fromEntries(repositoryParams)).toEqual({
      query: 'api',
      riskProfile: 'medium',
      visibility: 'public',
    })
    expect(Object.fromEntries(approvalParams)).toEqual({
      query: 'security',
      repositoryId: 'repo_123',
      approvalStatus: 'pending',
      riskLevel: 'critical',
      assigneeId: 'user_123',
      slaStatus: 'overdue',
    })
  })

  it('keeps audit log export URLs aligned with UI filters', () => {
    const params = readQueryString(
      serializeAuditLogSearchParams({
        query: 'policy',
        eventType: 'rule_triggered',
        actor: 'dana',
        repositoryId: 'repo_123',
        pullRequestNumber: '42',
        severity: 'high',
        from: '2026-05-01',
        to: '2026-05-02',
      }),
    )

    expect(Object.fromEntries(params)).toEqual({
      query: 'policy',
      eventType: 'rule_triggered',
      actor: 'dana',
      repositoryId: 'repo_123',
      pullRequestNumber: '42',
      severity: 'high',
      from: '2026-05-01',
      to: '2026-05-02',
    })
  })
})
