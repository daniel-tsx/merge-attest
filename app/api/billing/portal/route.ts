import { NextResponse } from 'next/server'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import { getPaddleCustomerPortalUrl } from '@/lib/billing'
import { canManageBilling } from '@/lib/collaboration'

export async function POST(request: Request) {
  const organization = await ensureCurrentUserOrganization()

  if (!organization) {
    return NextResponse.json(
      { error: 'Authentication and database access are required.' },
      { status: 401 },
    )
  }

  if (!canManageBilling(organization.role)) {
    return NextResponse.json(
      { error: 'Only workspace owners can manage billing.' },
      { status: 403 },
    )
  }

  const portalUrl = getPaddleCustomerPortalUrl(organization.paddleCustomerId)
  if (!portalUrl) {
    const url = new URL('/settings/billing', request.url)
    url.searchParams.set('billing', 'portal_unavailable')
    return NextResponse.redirect(url, { status: 303 })
  }

  return NextResponse.redirect(portalUrl, { status: 303 })
}
