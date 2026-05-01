import { randomUUID } from 'node:crypto'
import type { PullRequest, RuleViolation } from '@/lib/types'

export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer'
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

const mutableRoles: OrganizationRole[] = ['admin', 'member', 'viewer']
const inviteRoles: OrganizationRole[] = ['admin', 'member', 'viewer']

export function canManageTeam(role: OrganizationRole) {
  return role === 'owner' || role === 'admin'
}

export function canManageSettings(role: OrganizationRole) {
  return role === 'owner' || role === 'admin'
}

export function canManageBilling(role: OrganizationRole) {
  return role === 'owner' || role === 'admin'
}

export function canSyncGitHub(role: OrganizationRole) {
  return role === 'owner' || role === 'admin'
}

export function canManageRules(role: OrganizationRole) {
  return role === 'owner' || role === 'admin'
}

export function canExportAudit(role: OrganizationRole) {
  return role === 'owner' || role === 'admin'
}

export function canRecordApproval(role: OrganizationRole) {
  return role === 'owner' || role === 'admin' || role === 'member'
}

export function canCommentOnPullRequest(role: OrganizationRole) {
  return canRecordApproval(role)
}

export function canInviteRole(actorRole: OrganizationRole, inviteRole: string) {
  if (!inviteRoles.includes(inviteRole as OrganizationRole)) return false
  if (actorRole === 'owner') return true
  return actorRole === 'admin' && inviteRole !== 'admin'
}

export function canChangeMemberRole(
  actorRole: OrganizationRole,
  targetRole: OrganizationRole,
  nextRole: string,
) {
  if (!mutableRoles.includes(nextRole as OrganizationRole)) return false
  if (actorRole === 'owner') return true
  return (
    actorRole === 'admin' &&
    targetRole !== 'owner' &&
    targetRole !== 'admin' &&
    nextRole !== 'admin'
  )
}

export function canRemoveMember(
  actorRole: OrganizationRole,
  targetRole: OrganizationRole,
) {
  if (actorRole === 'owner') return true
  return (
    actorRole === 'admin' && targetRole !== 'owner' && targetRole !== 'admin'
  )
}

export function normalizeInviteStatus(
  status: InviteStatus,
  expiresAt: Date,
  now = new Date(),
): InviteStatus {
  if (status === 'pending' && expiresAt.getTime() < now.getTime()) {
    return 'expired'
  }

  return status
}

export function createInviteToken() {
  return randomUUID().replaceAll('-', '')
}

export function getReviewSlaStatus(
  dueAt?: Date | string | null,
  now = new Date(),
): PullRequest['reviewSlaStatus'] {
  if (!dueAt) return 'none'

  const dueTime =
    typeof dueAt === 'string' ? new Date(dueAt).getTime() : dueAt.getTime()
  const remainingMs = dueTime - now.getTime()

  if (remainingMs < 0) return 'overdue'
  if (remainingMs <= 24 * 60 * 60 * 1000) return 'due_soon'
  return 'on_track'
}

export function defaultReviewDueAt(riskLevel: PullRequest['riskLevel']) {
  const days = riskLevel === 'critical' || riskLevel === 'high' ? 1 : 3
  const dueAt = new Date()
  dueAt.setDate(dueAt.getDate() + days)
  return dueAt
}

export function suggestReviewerFromViolations(violations: RuleViolation[]) {
  return violations.find((violation) => violation.codeOwnerHint)?.codeOwnerHint
}
