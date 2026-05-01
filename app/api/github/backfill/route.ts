import { NextRequest, NextResponse } from 'next/server'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import { backfillStaleGitHubRepositories } from '@/lib/github-sync'

export async function POST(request: NextRequest) {
  const organization = await ensureCurrentUserOrganization()

  if (!organization) {
    return NextResponse.json(
      { error: 'Authentication and database access are required.' },
      { status: 401 },
    )
  }

  const result = await backfillStaleGitHubRepositories({
    organizationId: organization.id,
  })

  const contentType = request.headers.get('content-type') ?? ''
  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const url = new URL('/settings/github', request.url)
    url.searchParams.set('backfill', result.mode)
    return NextResponse.redirect(url, { status: 303 })
  }

  return NextResponse.json(result)
}
