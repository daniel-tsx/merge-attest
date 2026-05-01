import { NextRequest, NextResponse } from 'next/server'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import { canSyncGitHub } from '@/lib/collaboration'
import { processQueuedGitHubWebhookDeliveries } from '@/lib/github-webhooks'

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
      { error: 'Only owners and admins can retry GitHub webhooks.' },
      { status: 403 },
    )
  }

  const result = await processQueuedGitHubWebhookDeliveries({
    organizationId: organization.id,
    limit: 25,
  })

  const contentType = request.headers.get('content-type') ?? ''
  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const url = new URL('/settings/github', request.url)
    url.searchParams.set('retry', String(result.processed))
    return NextResponse.redirect(url, { status: 303 })
  }

  return NextResponse.json(result)
}
