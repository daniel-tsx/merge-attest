import { NextResponse } from 'next/server'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import {
  getBillingReturnUrl,
  getLemonSqueezyCustomerPortalUrl,
  isPaidBillingEnabled,
} from '@/lib/billing'
import { canManageBilling } from '@/lib/collaboration'

export async function POST() {
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

  if (!isPaidBillingEnabled()) {
    return NextResponse.json(
      { error: 'Billing portal is disabled during free early access.' },
      { status: 403 },
    )
  }

  const portalUrl = await getLemonSqueezyCustomerPortalUrl({
    customerId: organization.lemonSqueezyCustomerId,
    subscriptionId: organization.lemonSqueezySubscriptionId,
  })
  if (!portalUrl) {
    const url = new URL(getBillingReturnUrl())
    url.searchParams.set('billing', 'portal_unavailable')
    return NextResponse.redirect(url, { status: 303 })
  }

  return NextResponse.redirect(portalUrl, { status: 303 })
}
