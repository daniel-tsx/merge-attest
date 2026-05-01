import { NextResponse } from 'next/server'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import { getHealthDiagnostics, summarizeDiagnostics } from '@/lib/diagnostics'
import { getPlanEntitlements } from '@/lib/entitlements'
import { getPrismaClient } from '@/lib/prisma'
import { getPrCheckUsage } from '@/lib/usage'

function canViewDiagnostics(role: string) {
  return role === 'owner' || role === 'admin'
}

export async function GET() {
  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()

  if (!organization || !prisma) {
    return NextResponse.json(
      { error: 'Authentication and database access are required.' },
      { status: 401 },
    )
  }

  if (!canViewDiagnostics(organization.role)) {
    return NextResponse.json(
      { error: 'Only owners and admins can view diagnostics.' },
      { status: 403 },
    )
  }

  const [checks, repositoryCount, usage, webhookFailures] = await Promise.all([
    getHealthDiagnostics(),
    prisma.repository.count({ where: { organizationId: organization.id } }),
    getPrCheckUsage(organization.id),
    prisma.gitHubWebhookDelivery.findMany({
      where: { organizationId: organization.id, status: 'failed' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])
  const entitlements = getPlanEntitlements(organization.planKey)

  return NextResponse.json({
    status: summarizeDiagnostics(checks),
    organization: {
      id: organization.id,
      name: organization.name,
      planKey: organization.planKey,
      billingStatus: organization.billingStatus,
      repositoryCount,
      repositoryLimit: entitlements.repositoryLimit,
      prCheckUsage: usage,
      prCheckLimit: entitlements.prCheckLimit,
      githubInstallationId: organization.githubInstallationId,
    },
    checks,
    recentWebhookFailures: webhookFailures.map((delivery) => ({
      deliveryId: delivery.deliveryId,
      event: delivery.event,
      action: delivery.action,
      attempts: delivery.attemptCount,
      lastError: delivery.lastError,
      createdAt: delivery.createdAt.toISOString(),
    })),
  })
}
