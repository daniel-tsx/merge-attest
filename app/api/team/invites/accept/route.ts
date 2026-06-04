import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/session'
import { hashInviteToken, normalizeInviteStatus } from '@/lib/collaboration'
import { getPrismaClient } from '@/lib/prisma'
import { safeRelativeRedirect } from '@/lib/redirects'

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
      safeRelativeRedirect(
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
      ),
    )
    return NextResponse.redirect(signInUrl)
  }

  if (!token) return redirectToTeam(request, 'invite_not_found')

  const invite = await prisma.organizationInvite.findUnique({
    where: { token: hashInviteToken(token) },
    include: { organization: true },
  })

  if (!invite) return redirectToTeam(request, 'invite_not_found')

  const status = normalizeInviteStatus(invite.status, invite.expiresAt)
  if (status !== 'pending') return redirectToTeam(request, `invite_${status}`)

  if (session.user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return redirectToTeam(request, 'invite_email_mismatch')
  }

  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Accept AgentGate Invite</title>
  </head>
  <body style="font-family: system-ui, sans-serif; max-width: 32rem; margin: 4rem auto; padding: 0 1rem;">
    <h1>Accept invite to ${escapeHtml(invite.organization.name)}</h1>
    <p>You are signed in as ${escapeHtml(session.user.email)}.</p>
    <form method="post" action="/api/team/invites/accept">
      <input type="hidden" name="token" value="${escapeHtml(token)}" />
      <button type="submit">Accept invite</button>
    </form>
  </body>
</html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const tokenValue = formData.get('token')
  const token = typeof tokenValue === 'string' ? tokenValue : null
  const session = await getServerSession()
  const prisma = getPrismaClient()

  if (!session || !prisma) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('callbackUrl', '/settings/team')
    return NextResponse.redirect(signInUrl)
  }

  if (!token) return redirectToTeam(request, 'invite_not_found')

  const invite = await prisma.organizationInvite.findUnique({
    where: { token: hashInviteToken(token) },
    include: { organization: true },
  })

  if (!invite) return redirectToTeam(request, 'invite_not_found')

  const status = normalizeInviteStatus(invite.status, invite.expiresAt)
  if (status !== 'pending') return redirectToTeam(request, `invite_${status}`)

  if (session.user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return redirectToTeam(request, 'invite_email_mismatch')
  }

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
