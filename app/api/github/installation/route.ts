import { NextRequest, NextResponse } from 'next/server'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import { canSyncGitHub } from '@/lib/collaboration'
import { getGitHubInstallationMetadata } from '@/lib/github'
import { verifyGitHubInstallationState } from '@/lib/github-installation-state'
import { getPrismaClient } from '@/lib/prisma'
import { safeRelativeRedirect } from '@/lib/redirects'

function redirectToSignIn(request: NextRequest) {
  const signInUrl = new URL('/sign-in', request.url)
  signInUrl.searchParams.set(
    'callbackUrl',
    safeRelativeRedirect(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    ),
  )
  return NextResponse.redirect(signInUrl)
}

export async function GET(request: NextRequest) {
  const installationId = request.nextUrl.searchParams.get('installation_id')
  const state = request.nextUrl.searchParams.get('state')
  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()

  if (!organization || !prisma) return redirectToSignIn(request)

  if (!canSyncGitHub(organization.role)) {
    const settingsUrl = new URL('/settings/github', request.url)
    settingsUrl.searchParams.set('error', 'forbidden')
    return NextResponse.redirect(settingsUrl)
  }

  const stateVerification = verifyGitHubInstallationState(
    state,
    organization.id,
  )
  if (!stateVerification.ok) {
    const settingsUrl = new URL('/settings/github', request.url)
    settingsUrl.searchParams.set('error', stateVerification.reason)
    return NextResponse.redirect(settingsUrl)
  }

  if (!installationId || !/^\d+$/.test(installationId)) {
    const settingsUrl = new URL('/settings/github', request.url)
    settingsUrl.searchParams.set('error', 'missing_installation_id')
    return NextResponse.redirect(settingsUrl)
  }

  const installation = await getGitHubInstallationMetadata(installationId)
  if (!installation) {
    const settingsUrl = new URL('/settings/github', request.url)
    settingsUrl.searchParams.set('error', 'installation_verification_failed')
    return NextResponse.redirect(settingsUrl)
  }

  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      githubInstallationId: installationId,
      githubAccountId: installation.accountId,
      githubAccountLogin: installation.accountLogin,
    },
  })

  await prisma.auditEvent.create({
    data: {
      eventType: 'settings_changed',
      actor: 'Auteur',
      summary: 'GitHub App installation connected',
      metadata: {
        installationId,
        githubAccountId: installation.accountId,
        githubAccountLogin: installation.accountLogin,
      },
      organizationId: organization.id,
    },
  })

  const settingsUrl = new URL('/settings/github', request.url)
  settingsUrl.searchParams.set('connected', 'true')
  return NextResponse.redirect(settingsUrl)
}
