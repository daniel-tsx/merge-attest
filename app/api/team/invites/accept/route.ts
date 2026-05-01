import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/session'
import { normalizeInviteStatus } from '@/lib/collaboration'
import { getPrismaClient } from '@/lib/prisma'

function redirectToTeam(request: NextRequest, status: string) {
  const url = new URL('/settings/team', request.url)
  url.searchParams.set('team', status)
  return NextResponse.redirect(url, { status: 303 })
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const session = await getServerSession()
  const prisma = getPrismaClient()

  if (!session || !prisma) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set(
      'callbackUrl',
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    )
    return NextResponse.redirect(signInUrl)
  }

  if (!token) return redirectToTeam(request, 'invite_not_found')

  const invite = await prisma.organizationInvite.findUnique({
    where: { token },
    include: { organization: true },
  })

  if (!invite) return redirectToTeam(request, 'invite_not_found')

  const status = normalizeInviteStatus(invite.status, invite.expiresAt)
  if (status !== 'pending') return redirectToTeam(request, `invite_${status}`)

  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: invite.organizationId,
      },
    },
    create: {
      userId: session.user.id,
      organizationId: invite.organizationId,
      role: invite.role,
    },
    update: { role: invite.role },
  })

  await prisma.organizationInvite.update({
    where: { id: invite.id },
    data: {
      status: 'accepted',
      acceptedAt: new Date(),
      acceptedById: session.user.id,
    },
  })

  await prisma.auditEvent.create({
    data: {
      eventType: 'settings_changed',
      actor: session.user.name || session.user.email,
      summary: `${session.user.email} accepted team invite`,
      metadata: { inviteId: invite.id, email: invite.email, role: invite.role },
      organizationId: invite.organizationId,
    },
  })

  return redirectToTeam(request, 'invite_accepted')
}
