'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import {
  canChangeMemberRole,
  canInviteRole,
  canManageTeam,
  canRemoveMember,
  createInviteToken,
  hashInviteToken,
  type OrganizationRole,
} from '@/lib/collaboration'
import { getPrismaClient } from '@/lib/prisma'

function teamUrl(status: string, invite?: { token: string; email: string }) {
  const params = new URLSearchParams({ team: status })
  if (invite) {
    params.set('inviteToken', invite.token)
    params.set('inviteEmail', invite.email)
  }
  return `/settings/team?${params.toString()}`
}

function inviteExpiry() {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)
  return expiresAt
}

export async function inviteMember(formData: FormData) {
  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()
  if (!organization || !prisma) redirect(teamUrl('auth_required'))
  if (!canManageTeam(organization.role)) redirect(teamUrl('forbidden'))

  const emailValue = formData.get('email')
  const email =
    typeof emailValue === 'string' ? emailValue.trim().toLowerCase() : ''
  const roleValue = String(formData.get('role') ?? 'member')

  if (!email || !email.includes('@')) redirect(teamUrl('invalid_email'))
  if (!canInviteRole(organization.role, roleValue)) {
    redirect(teamUrl('invalid_role'))
  }
  const role = roleValue as OrganizationRole

  const existingMember = await prisma.organizationMember.findFirst({
    where: { organizationId: organization.id, user: { email } },
  })
  if (existingMember) redirect(teamUrl('member_exists'))

  const existingInvite = await prisma.organizationInvite.findFirst({
    where: { organizationId: organization.id, email, status: 'pending' },
  })
  const inviteToken = createInviteToken()
  const tokenHash = hashInviteToken(inviteToken)

  const invite = existingInvite
    ? await prisma.organizationInvite.update({
        where: { id: existingInvite.id },
        data: {
          role,
          token: tokenHash,
          expiresAt: inviteExpiry(),
          invitedById: organization.userId,
        },
      })
    : await prisma.organizationInvite.create({
        data: {
          email,
          role,
          token: tokenHash,
          expiresAt: inviteExpiry(),
          invitedById: organization.userId,
          organizationId: organization.id,
        },
      })

  await prisma.auditEvent.create({
    data: {
      eventType: 'settings_changed',
      actor: organization.userName || organization.userEmail,
      summary: `Invited ${email} as ${role}`,
      metadata: { inviteId: invite.id, email, role },
      organizationId: organization.id,
    },
  })

  revalidatePath('/settings/team')
  redirect(
    teamUrl(existingInvite ? 'invite_refreshed' : 'invited', {
      token: inviteToken,
      email,
    }),
  )
}

export async function mutateInvite(inviteId: string, formData: FormData) {
  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()
  if (!organization || !prisma) redirect(teamUrl('auth_required'))
  if (!canManageTeam(organization.role)) redirect(teamUrl('forbidden'))

  const invite = await prisma.organizationInvite.findFirst({
    where: { id: inviteId, organizationId: organization.id },
  })
  if (!invite) redirect(teamUrl('invite_not_found'))

  const actionValue = formData.get('_action')
  const action = typeof actionValue === 'string' ? actionValue : 'refresh'
  let refreshedToken: string | null = null

  if (action === 'revoke') {
    await prisma.organizationInvite.update({
      where: { id: invite.id },
      data: { status: 'revoked', revokedAt: new Date() },
    })
  } else {
    refreshedToken = createInviteToken()
    await prisma.organizationInvite.update({
      where: { id: invite.id },
      data: {
        status: 'pending',
        token: hashInviteToken(refreshedToken),
        expiresAt: inviteExpiry(),
        revokedAt: null,
        invitedById: organization.userId,
      },
    })
  }

  await prisma.auditEvent.create({
    data: {
      eventType: 'settings_changed',
      actor: organization.userName || organization.userEmail,
      summary:
        action === 'revoke'
          ? `Revoked invite for ${invite.email}`
          : `Refreshed invite for ${invite.email}`,
      metadata: { inviteId: invite.id, action },
      organizationId: organization.id,
    },
  })

  revalidatePath('/settings/team')
  redirect(
    teamUrl(
      action === 'revoke' ? 'invite_revoked' : 'invite_refreshed',
      refreshedToken
        ? { token: refreshedToken, email: invite.email }
        : undefined,
    ),
  )
}

async function isLastOwner(
  memberId: string,
  organizationId: string,
  role: string,
) {
  if (role !== 'owner') return false
  const prisma = getPrismaClient()
  if (!prisma) return true
  const ownerCount = await prisma.organizationMember.count({
    where: { organizationId, role: 'owner' },
  })
  return ownerCount <= 1
}

export async function mutateMember(memberId: string, formData: FormData) {
  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()
  if (!organization || !prisma) redirect(teamUrl('auth_required'))
  if (!canManageTeam(organization.role)) redirect(teamUrl('forbidden'))

  const member = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId: organization.id },
    include: { user: true },
  })
  if (!member) redirect(teamUrl('member_not_found'))

  const actionValue = formData.get('_action')
  const action = typeof actionValue === 'string' ? actionValue : 'update_role'
  const nextRoleValue = formData.get('role')
  const nextRole =
    typeof nextRoleValue === 'string'
      ? (nextRoleValue as OrganizationRole)
      : member.role

  if (action === 'remove') {
    if (
      member.userId === organization.userId ||
      (await isLastOwner(member.id, organization.id, member.role)) ||
      !canRemoveMember(organization.role, member.role)
    ) {
      redirect(teamUrl('cannot_remove_member'))
    }
    await prisma.organizationMember.delete({ where: { id: member.id } })
  } else {
    if (
      (await isLastOwner(member.id, organization.id, member.role)) ||
      !canChangeMemberRole(organization.role, member.role, nextRole)
    ) {
      redirect(teamUrl('invalid_role_change'))
    }
    await prisma.organizationMember.update({
      where: { id: member.id },
      data: { role: nextRole },
    })
  }

  await prisma.auditEvent.create({
    data: {
      eventType: 'settings_changed',
      actor: organization.userName || organization.userEmail,
      summary:
        action === 'remove'
          ? `Removed ${member.user.email} from workspace`
          : `Updated ${member.user.email} role`,
      metadata: {
        memberId: member.id,
        email: member.user.email,
        action,
        role: nextRole,
      },
      organizationId: organization.id,
    },
  })

  revalidatePath('/settings/team')
  redirect(teamUrl(action === 'remove' ? 'member_removed' : 'role_updated'))
}
