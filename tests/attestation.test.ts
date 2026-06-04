import { describe, expect, it } from 'vitest'
import {
  actionsRequireAttestation,
  buildAttestationStatement,
  isAccountabilityDecision,
  pullRequestRequiresAttestation,
  shouldBlockMissingAttestation,
} from '../lib/attestation'
import type { PullRequest, RuleViolation } from '../lib/types'

function violation(actionType: RuleViolation['actionType']): RuleViolation {
  return {
    id: `violation-${actionType}`,
    ruleName: 'rule',
    summary: 'summary',
    severity: 'high',
    actionType,
    resolved: false,
    createdAt: '2026-05-01T00:00:00.000Z',
  }
}

function pr(
  overrides: Pick<PullRequest, 'aiAssisted' | 'ruleViolations'>,
): Pick<PullRequest, 'aiAssisted' | 'ruleViolations'> {
  return overrides
}

describe('attestation helpers', () => {
  it('detects the attestation action among rule action types', () => {
    expect(
      actionsRequireAttestation(['warn', 'require_human_attestation']),
    ).toBe(true)
    expect(actionsRequireAttestation(['warn', 'require_approval'])).toBe(false)
  })

  it('requires attestation for AI PRs with a matching rule', () => {
    expect(
      pullRequestRequiresAttestation(
        pr({
          aiAssisted: true,
          ruleViolations: [violation('require_human_attestation')],
        }),
      ),
    ).toBe(true)
  })

  it('does not require attestation for manual PRs', () => {
    expect(
      pullRequestRequiresAttestation(
        pr({
          aiAssisted: false,
          ruleViolations: [violation('require_human_attestation')],
        }),
      ),
    ).toBe(false)
  })

  it('does not require attestation without a matching rule', () => {
    expect(
      pullRequestRequiresAttestation(
        pr({
          aiAssisted: true,
          ruleViolations: [violation('require_approval')],
        }),
      ),
    ).toBe(false)
  })

  it('builds a human-readable statement', () => {
    expect(buildAttestationStatement('Maya Chen', 'claude_code')).toBe(
      'Maya Chen takes responsibility for reviewing this claude code pull request.',
    )
  })

  it('only treats approving decisions as accountability decisions', () => {
    expect(isAccountabilityDecision('approved')).toBe(true)
    expect(isAccountabilityDecision('risk_accepted')).toBe(true)
    expect(isAccountabilityDecision('rejected')).toBe(false)
    expect(isAccountabilityDecision('requested_tests')).toBe(false)
  })

  it('blocks approving decisions when a required attestation is missing', () => {
    expect(
      shouldBlockMissingAttestation({
        decision: 'approved',
        hasCurrentAttestation: false,
        recordedAttestation: false,
        requiresAttestation: true,
      }),
    ).toBe(true)
  })

  it('allows non-approving decisions without attestation', () => {
    expect(
      shouldBlockMissingAttestation({
        decision: 'requested_tests',
        hasCurrentAttestation: false,
        recordedAttestation: false,
        requiresAttestation: true,
      }),
    ).toBe(false)
  })

  it('allows approving decisions with a current or newly recorded attestation', () => {
    expect(
      shouldBlockMissingAttestation({
        decision: 'risk_accepted',
        hasCurrentAttestation: true,
        recordedAttestation: false,
        requiresAttestation: true,
      }),
    ).toBe(false)
    expect(
      shouldBlockMissingAttestation({
        decision: 'risk_accepted',
        hasCurrentAttestation: false,
        recordedAttestation: true,
        requiresAttestation: true,
      }),
    ).toBe(false)
  })
})
