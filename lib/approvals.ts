import type { Approval, ApprovalStatus, AuditEvent } from '@/lib/types'

export type ApprovalDecision = Exclude<Approval['decision'], 'not_required'>

const approvalDecisions: ApprovalDecision[] = [
  'approved',
  'rejected',
  'requested_tests',
  'risk_accepted',
]

export function isApprovalDecision(value: unknown): value is ApprovalDecision {
  return (
    typeof value === 'string' &&
    approvalDecisions.includes(value as ApprovalDecision)
  )
}

export function approvalStatusForDecision(
  decision: ApprovalDecision,
): ApprovalStatus {
  if (decision === 'approved') return 'approved'
  if (decision === 'rejected') return 'rejected'
  if (decision === 'risk_accepted') return 'risk_accepted'
  return 'pending'
}

export function auditEventTypeForDecision(
  decision: ApprovalDecision,
): AuditEvent['eventType'] {
  if (decision === 'approved') return 'pr_approved'
  if (decision === 'rejected') return 'pr_rejected'
  if (decision === 'risk_accepted') return 'risk_accepted'
  return 'approval_requested'
}

export function approvalSummary(
  decision: ApprovalDecision,
  pullRequestNumber: number,
) {
  const label = decision.replaceAll('_', ' ')
  return `Pull request #${pullRequestNumber} ${label}`
}
