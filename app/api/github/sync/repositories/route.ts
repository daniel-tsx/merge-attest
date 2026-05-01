import { NextRequest, NextResponse } from 'next/server'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import { canSyncGitHub } from '@/lib/collaboration'
import { syncGitHubInstallation } from '@/lib/github-sync'

async function redirectOrJson(
  request: NextRequest,
  result: Awaited<ReturnType<typeof syncGitHubInstallation>>,
) {
  const contentType = request.headers.get('content-type') ?? ''
  if (
    !contentType.includes('application/x-www-form-urlencoded') &&
    !contentType.includes('multipart/form-data')
  ) {
    return NextResponse.json(result)
  }

  const formData = await request.formData()
  const redirectTo = String(formData.get('redirectTo') ?? '/repositories')
  const url = new URL(
    redirectTo.startsWith('/') ? redirectTo : '/repositories',
    request.url,
  )
  url.searchParams.set('sync', result.mode)
  return NextResponse.redirect(url, { status: 303 })
}

export async function POST(request: NextRequest) {
  const organization = await ensureCurrentUserOrganization()

  if (!organization) {
    return NextResponse.json(
      { error: 'Authentication and database access are required.' },
      { status: 401 },
    )
  }

  if (!canSyncGitHub(organization.role)) {
    return NextResponse.json(
      { error: 'Only owners and admins can sync GitHub repositories.' },
      { status: 403 },
    )
  }

  const result = await syncGitHubInstallation(organization.id)
  return redirectOrJson(request, result)
}
