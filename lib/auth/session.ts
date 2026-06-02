import { cache } from 'react'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { isProduction } from '@/lib/env'
import { reportError } from '@/lib/observability'
import { getPrismaClient } from '@/lib/prisma'
import type { BillingStatus, PlanKey } from '@/lib/types'

export type SessionOrganization = {
  userId: string
  userName: string
  userEmail: string
  id: string
  name: string
  slug: string
  planKey: PlanKey
  githubInstallationId: string | null
  role: 'owner' | 'admin' | 'member' | 'viewer'
  billingStatus: BillingStatus
  lemonSqueezyCustomerId: string | null
  lemonSqueezySubscriptionId: string | null
  lemonSqueezySubscriptionStatus: string | null
  trialEndsAt: Date | null
  cancellationEffectiveAt: Date | null
  failedPaymentAt: Date | null
  lastUpgradeAt: Date | null
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)

  return slug || 'workspace'
}

// Cached per request so callers (org context + platform-admin check) share a
// single session validation instead of each hitting the auth API.
export const getServerSession = cache(async () => {
  try {
    return await auth.api.getSession({
      headers: await headers(),
    })
  } catch (error) {
    if (isProduction()) throw error
    reportError({
      area: 'auth',
      action: 'session_read_failed',
      error,
      metadata: { production: false },
    })
    return null
  }
})

export async function ensureCurrentUserOrganization(): Promise<SessionOrganization | null> {
  const session = await getServerSession()
  const prisma = getPrismaClient()
  if (!session || !prisma) return null

  const existingMembership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
    orderBy: { createdAt: 'asc' },
  })

  if (existingMembership) {
    return {
      userId: session.user.id,
      userName: session.user.name,
      userEmail: session.user.email,
      id: existingMembership.organization.id,
      name: existingMembership.organization.name,
      slug: existingMembership.organization.slug,
      planKey: existingMembership.organization.planKey as PlanKey,
      githubInstallationId:
        existingMembership.organization.githubInstallationId,
      role: existingMembership.role,
      billingStatus: existingMembership.organization
        .billingStatus as BillingStatus,
      lemonSqueezyCustomerId:
        existingMembership.organization.lemonSqueezyCustomerId,
      lemonSqueezySubscriptionId:
        existingMembership.organization.lemonSqueezySubscriptionId,
      lemonSqueezySubscriptionStatus:
        existingMembership.organization.lemonSqueezySubscriptionStatus,
      trialEndsAt: existingMembership.organization.trialEndsAt,
      cancellationEffectiveAt:
        existingMembership.organization.cancellationEffectiveAt,
      failedPaymentAt: existingMembership.organization.failedPaymentAt,
      lastUpgradeAt: existingMembership.organization.lastUpgradeAt,
    }
  }

  const workspaceName = `${session.user.name || session.user.email.split('@')[0]}'s workspace`
  const slugBase = slugify(workspaceName)
  const organization = await prisma.organization.create({
    data: {
      name: workspaceName,
      slug: `${slugBase}-${session.user.id.slice(0, 6)}`,
      planKey: 'free',
      members: {
        create: {
          userId: session.user.id,
          role: 'owner',
        },
      },
    },
  })

  return {
    userId: session.user.id,
    userName: session.user.name,
    userEmail: session.user.email,
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    planKey: organization.planKey as PlanKey,
    githubInstallationId: organization.githubInstallationId,
    role: 'owner',
    billingStatus: organization.billingStatus as BillingStatus,
    lemonSqueezyCustomerId: organization.lemonSqueezyCustomerId,
    lemonSqueezySubscriptionId: organization.lemonSqueezySubscriptionId,
    lemonSqueezySubscriptionStatus: organization.lemonSqueezySubscriptionStatus,
    trialEndsAt: organization.trialEndsAt,
    cancellationEffectiveAt: organization.cancellationEffectiveAt,
    failedPaymentAt: organization.failedPaymentAt,
    lastUpgradeAt: organization.lastUpgradeAt,
  }
}
