import { NextResponse } from 'next/server'
import { createCheckoutTransaction, isPaidPlan } from '@/lib/billing'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import { canManageBilling } from '@/lib/collaboration'
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
      { error: 'Only owners and admins can manage billing.' },
      { status: 403 },
    )
  }

  const formData = await request.formData()
  const planKey = formData.get('planKey')
  if (!isPlanKey(planKey) || !isPaidPlan(planKey)) {
    return NextResponse.json({ error: 'Invalid paid plan.' }, { status: 400 })
  }

  if (planKey === organization.planKey) {
    return NextResponse.redirect(new URL('/settings/billing', request.url), {
      status: 303,
    })
  }

  const existingOrganization = await prisma.organization.findUnique({
    where: { id: organization.id },
    select: { paddleCustomerId: true },
  })
  const transaction = await createCheckoutTransaction({
    organizationId: organization.id,
    planKey,
    customerId: existingOrganization?.paddleCustomerId,
  })

  if (!transaction?.checkout?.url) {
    const url = new URL('/settings/billing', request.url)
    url.searchParams.set('billing', 'checkout_unavailable')
    return NextResponse.redirect(url, { status: 303 })
  }

  return NextResponse.redirect(transaction.checkout.url, { status: 303 })
}
