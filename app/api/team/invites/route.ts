import { NextRequest, NextResponse } from 'next/server'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import {
  canInviteRole,
  canManageTeam,
  createInviteToken,
  hashInviteToken,
  type OrganizationRole,
} from '@/lib/collaboration'
import { getPrismaClient } from '@/lib/prisma'

function redirectToTeam(
  request: NextRequest,
  status: string,
  invite?: { token: string; email: string },
) {
  const url = new URL('/settings/team', request.url)
  url.searchParams.set('team', status)
  if (invite) {
    url.searchParams.set('inviteToken', invite.token)
    url.searchParams.set('inviteEmail', invite.email)
  }
  return NextResponse.redirect(url, { status: 303 })
}

function readEmail(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export async function POST(request: NextRequest) {
  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()

  if (!organization || !prisma) return redirectToTeam(request, 'auth_required')
  if (!canManageTeam(organization.role)) {
    return redirectToTeam(request, 'forbidden')
  }

  const formData = await request.formData()
  const email = readEmail(formData.get('email'))
  const roleValue = String(formData.get('role') ?? 'member')

  if (!email || !email.includes('@')) {
    return redirectToTeam(request, 'invalid_email')
  }

  if (!canInviteRole(organization.role, roleValue)) {
    return redirectToTeam(request, 'invalid_role')
  }
  const role = roleValue as OrganizationRole

  const existingMember = await prisma.organizationMember.findFirst({
    where: {
      organizationId: organization.id,
      user: { email },
    },
  })

  if (existingMember) return redirectToTeam(request, 'member_exists')

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const existingInvite = await prisma.organizationInvite.findFirst({
    where: {
      organizationId: organization.id,
      email,
      status: 'pending',
    },
  })
  const inviteToken = createInviteToken()
  const tokenHash = hashInviteToken(inviteToken)

  const invite = existingInvite
    ? await prisma.organizationInvite.update({
        where: { id: existingInvite.id },
        data: {
          role,
          token: tokenHash,
          expiresAt,
          invitedById: organization.userId,
        },
      })
    : await prisma.organizationInvite.create({
        data: {
          email,
          role,
          token: tokenHash,
          expiresAt,
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

  return redirectToTeam(
    request,
    existingInvite ? 'invite_refreshed' : 'invited',
    { token: inviteToken, email },
  )
}
