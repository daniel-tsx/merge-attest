import type { PullRequest } from '@/lib/types'

/**
 * Human-accountability gate. When a `require_human_attestation` rule fires on an
 * AI-authored pull request, a named human must record an attestation — an
 * immutable statement that they take responsibility for reviewing the change.
 */

export const HUMAN_ATTESTATION_ACTION = 'require_human_attestation'

export function actionsRequireAttestation(
  actionTypes: Array<string | null | undefined>,
): boolean {
  return actionTypes.includes(HUMAN_ATTESTATION_ACTION)
}

export function pullRequestRequiresAttestation(
  pullRequest: Pick<PullRequest, 'aiAssisted' | 'ruleViolations'>,
): boolean {
  return (
    pullRequest.aiAssisted === true &&
    actionsRequireAttestation(
      pullRequest.ruleViolations.map((violation) => violation.actionType),
    )
  )
}

export function isAccountabilityDecision(decision: string): boolean {
  return decision === 'approved' || decision === 'risk_accepted'
}

export function shouldBlockMissingAttestation(input: {
  decision: string
  hasCurrentAttestation: boolean
  recordedAttestation: boolean
  requiresAttestation: boolean
}): boolean {
  return (
    input.requiresAttestation &&
    isAccountabilityDecision(input.decision) &&
    !input.recordedAttestation &&
    !input.hasCurrentAttestation
  )
}

export function buildAttestationStatement(
  reviewerName: string,
  agentSource: string,
): string {
  return `${reviewerName} takes responsibility for reviewing this ${agentSource.replaceAll(
    '_',
    ' ',
  )} pull request.`
}
