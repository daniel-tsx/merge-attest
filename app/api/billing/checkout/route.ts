import { NextResponse } from 'next/server'
import {
  createCheckoutSession,
  getBillingReturnUrl,
  getBillingMode,
  isPaidBillingEnabled,
  isPaidPlan,
} from '@/lib/billing'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import { canManageBilling } from '@/lib/collaboration'
import { logEvent } from '@/lib/observability'
import { getPrismaClient } from '@/lib/prisma'
import type { PlanKey } from '@/lib/types'

function isPlanKey(value: FormDataEntryValue | null): value is PlanKey {
  return value === 'starter' || value === 'team' || value === 'growth'
}

export async function POST(request: Request) {
  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()

  if (!organization || !prisma) {
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
      { error: 'Paid checkout is disabled during free early access.' },
      { status: 403 },
    )
  }

  if (getBillingMode() === 'unconfigured') {
    return NextResponse.json(
      {
        error: 'Lemon Squeezy must be configured before production checkout.',
      },
      { status: 503 },
    )
  }

  const formData = await request.formData()
  const planKey = formData.get('planKey')
  if (!isPlanKey(planKey) || !isPaidPlan(planKey)) {
    return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 })
  }

  if (planKey === organization.planKey) {
    return NextResponse.redirect(getBillingReturnUrl(), {
      status: 303,
    })
  }

  const checkoutUrl = await createCheckoutSession({
    organizationId: organization.id,
    planKey,
    customerEmail: organization.userEmail,
    customerName: organization.userName,
    returnUrl: getBillingReturnUrl(),
  })

  if (!checkoutUrl) {
    const url = new URL(getBillingReturnUrl())
    url.searchParams.set('billing', 'checkout_unavailable')
    return NextResponse.redirect(url, { status: 303 })
  }

  await prisma.auditEvent.create({
    data: {
      eventType: 'settings_changed',
      actor: organization.userName || organization.userEmail,
      summary: `Checkout started for ${planKey} plan`,
      metadata: {
        activationEvent: 'upgrade_checkout_started',
        fromPlan: organization.planKey,
        toPlan: planKey,
      },
      organizationId: organization.id,
    },
  })

  logEvent({
    area: 'billing',
    action: 'checkout_started',
    message: `Checkout started for ${planKey} plan.`,
    metadata: {
      organizationId: organization.id,
      fromPlan: organization.planKey,
      toPlan: planKey,
    },
  })

  return NextResponse.redirect(checkoutUrl, { status: 303 })
}
