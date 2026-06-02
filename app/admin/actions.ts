'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getPlatformAdminContext } from '@/lib/admin/access'
import { BILLING_STATUSES, PLAN_KEYS } from '@/lib/admin/labels'
import { getLemonSqueezyCustomerPortalUrl } from '@/lib/billing'
import { getAdminEmails } from '@/lib/env'
import { logEvent } from '@/lib/observability'
import { getPrismaClient } from '@/lib/prisma'
import type { BillingStatus, PlanKey } from '@/lib/types'

function statusUrl(path: string, status: string) {
  const params = new URLSearchParams({ admin: status })
  return `${path}?${params.toString()}`
}

function safeReturnTo(value: FormDataEntryValue | null, fallback: string) {
  const path = typeof value === 'string' ? value : ''
  return path.startsWith('/admin') ? path : fallback
}

export async function updateOrgBilling(orgId: string, formData: FormData) {
  const context = await getPlatformAdminContext()
  const prisma = getPrismaClient()
  const returnTo = safeReturnTo(
    formData.get('returnTo'),
    '/admin/subscriptions',
  )

  if (!context?.isAdmin || !prisma) redirect(statusUrl(returnTo, 'forbidden'))

  const planKey = String(formData.get('planKey') ?? '')
  const billingStatus = String(formData.get('billingStatus') ?? '')
  if (
    !PLAN_KEYS.includes(planKey as PlanKey) ||
    !BILLING_STATUSES.includes(billingStatus as BillingStatus)
  ) {
    redirect(statusUrl(returnTo, 'invalid'))
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, planKey: true, billingStatus: true },
  })
  if (!org) redirect(statusUrl(returnTo, 'not_found'))

  await prisma.organization.update({
    where: { id: orgId },
    data: { planKey, billingStatus: billingStatus as BillingStatus },
  })

  await prisma.auditEvent.create({
    data: {
      eventType: 'settings_changed',
      // Generic label in the tenant-visible audit log; the operator identity
      // is recorded only in server logs below.
      actor: 'Platform admin',
      summary: `Platform admin set ${org.name} to ${planKey} / ${billingStatus}`,
      metadata: {
        adminAction: 'update_org_billing',
        fromPlan: org.planKey,
        toPlan: planKey,
        fromStatus: org.billingStatus,
        toStatus: billingStatus,
      },
      organizationId: orgId,
    },
  })

  logEvent({
    level: 'info',
    area: 'security',
    action: 'admin_update_org_billing',
    message: `Platform admin updated billing for ${org.name}`,
    metadata: { actor: context.email, orgId, planKey, billingStatus },
  })

  revalidatePath('/admin/subscriptions')
  revalidatePath('/admin/organizations')
  revalidatePath(`/admin/organizations/${orgId}`)
  redirect(statusUrl(returnTo, 'org_updated'))
}

export async function openCustomerPortal(orgId: string, formData: FormData) {
  const context = await getPlatformAdminContext()
  const prisma = getPrismaClient()
  const returnTo = safeReturnTo(
    formData.get('returnTo'),
    '/admin/subscriptions',
  )

  if (!context?.isAdmin || !prisma) redirect(statusUrl(returnTo, 'forbidden'))

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      lemonSqueezyCustomerId: true,
      lemonSqueezySubscriptionId: true,
    },
  })
  if (!org) redirect(statusUrl(returnTo, 'not_found'))

  const portalUrl = await getLemonSqueezyCustomerPortalUrl({
    customerId: org.lemonSqueezyCustomerId,
    subscriptionId: org.lemonSqueezySubscriptionId,
  })
  if (!portalUrl) redirect(statusUrl(returnTo, 'no_portal'))

  redirect(portalUrl)
}

export async function deleteUser(userId: string, formData: FormData) {
  const context = await getPlatformAdminContext()
  const prisma = getPrismaClient()
  const returnTo = safeReturnTo(formData.get('returnTo'), '/admin/users')

  if (!context?.isAdmin || !prisma) redirect(statusUrl(returnTo, 'forbidden'))

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      memberships: { select: { organizationId: true, role: true } },
    },
  })
  if (!user) redirect(statusUrl(returnTo, 'not_found'))

  const targetEmail = user.email.toLowerCase()
  if (
    targetEmail === context.email.toLowerCase() ||
    getAdminEmails().includes(targetEmail)
  ) {
    redirect(statusUrl(returnTo, 'cannot_delete_admin'))
  }

  // Block deletes that would orphan an organization (leave it with no owner).
  const ownedOrgIds = user.memberships
    .filter((member) => member.role === 'owner')
    .map((member) => member.organizationId)
  if (ownedOrgIds.length) {
    const owners = await prisma.organizationMember.groupBy({
      by: ['organizationId'],
      where: { organizationId: { in: ownedOrgIds }, role: 'owner' },
      _count: true,
    })
    if (owners.some((group) => group._count <= 1)) {
      redirect(statusUrl(returnTo, 'sole_owner'))
    }
  }

  if (user.memberships.length) {
    await prisma.auditEvent.createMany({
      data: user.memberships.map((member) => ({
        eventType: 'settings_changed' as const,
        actor: 'Platform admin',
        summary: `Platform admin deleted user ${user.email}`,
        metadata: { adminAction: 'delete_user', userId, email: user.email },
        organizationId: member.organizationId,
      })),
    })
  }

  // Operator identity is recorded in server logs, not the tenant audit trail.
  logEvent({
    level: 'warn',
    area: 'security',
    action: 'admin_delete_user',
    message: `Platform admin deleted user ${user.email}`,
    metadata: { actor: context.email, userId, email: user.email },
  })

  await prisma.user.delete({ where: { id: userId } })

  revalidatePath('/admin/users')
  redirect(statusUrl(returnTo, 'user_deleted'))
}
