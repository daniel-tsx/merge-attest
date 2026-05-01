import { NextRequest, NextResponse } from 'next/server'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import {
  canChangeMemberRole,
  canManageTeam,
  canRemoveMember,
  type OrganizationRole,
} from '@/lib/collaboration'
import { getPrismaClient } from '@/lib/prisma'

function redirectToTeam(request: NextRequest, status: string) {
  const url = new URL('/settings/team', request.url)
  url.searchParams.set('team', status)
  return NextResponse.redirect(url, { status: 303 })
}

async function isLastOwner(memberId: string, organizationId: string) {
  const prisma = getPrismaClient()
  if (!prisma) return true

  const member = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId },
  })
  if (member?.role !== 'owner') return false

  const ownerCount = await prisma.organizationMember.count({
    where: { organizationId, role: 'owner' },
  })
  return ownerCount <= 1
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()
  const { memberId } = await params

  if (!organization || !prisma) return redirectToTeam(request, 'auth_required')
  if (!canManageTeam(organization.role)) {
    return redirectToTeam(request, 'forbidden')
  }

  const member = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId: organization.id },
    include: { user: true },
  })

  if (!member) return redirectToTeam(request, 'member_not_found')

  const formData = await request.formData()
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
      (await isLastOwner(member.id, organization.id)) ||
      !canRemoveMember(organization.role, member.role)
    ) {
      return redirectToTeam(request, 'cannot_remove_member')
    }

    await prisma.organizationMember.delete({ where: { id: member.id } })
  } else {
    if (
      (await isLastOwner(member.id, organization.id)) ||
      !canChangeMemberRole(organization.role, member.role, nextRole)
    ) {
      return redirectToTeam(request, 'invalid_role_change')
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

  return redirectToTeam(
    request,
    action === 'remove' ? 'member_removed' : 'role_updated',
  )
}
