import { NextRequest, NextResponse } from 'next/server'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import {
  canManageTeam,
  createInviteToken,
  hashInviteToken,
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> },
) {
  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()
  const { inviteId } = await params

  if (!organization || !prisma) return redirectToTeam(request, 'auth_required')
  if (!canManageTeam(organization.role)) {
    return redirectToTeam(request, 'forbidden')
  }

  const invite = await prisma.organizationInvite.findFirst({
    where: { id: inviteId, organizationId: organization.id },
  })

  if (!invite) return redirectToTeam(request, 'invite_not_found')

  const formData = await request.formData()
  const actionValue = formData.get('_action')
  const action = typeof actionValue === 'string' ? actionValue : 'refresh'

  let refreshedToken: string | null = null

  if (action === 'revoke') {
    await prisma.organizationInvite.update({
      where: { id: invite.id },
      data: { status: 'revoked', revokedAt: new Date() },
    })
  } else {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    refreshedToken = createInviteToken()

    await prisma.organizationInvite.update({
      where: { id: invite.id },
      data: {
        status: 'pending',
        token: hashInviteToken(refreshedToken),
        expiresAt,
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

  return redirectToTeam(
    request,
    action === 'revoke' ? 'invite_revoked' : 'invite_refreshed',
    refreshedToken ? { token: refreshedToken, email: invite.email } : undefined,
  )
}
