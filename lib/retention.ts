import { getPlanEntitlements } from '@/lib/entitlements'
import { getPrismaClient } from '@/lib/prisma'
import type { PlanKey } from '@/lib/types'

export function getRetentionCutoff(days: number, now: Date) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

export async function cleanupOperationalData(now = new Date()) {
  const prisma = getPrismaClient()
  if (!prisma) {
    return {
      auditEventsDeleted: 0,
      webhookDeliveriesDeleted: 0,
      billingEventsDeleted: 0,
      auditExportsDeleted: 0,
    }
  }

  const organizations = await prisma.organization.findMany({
    select: { id: true, planKey: true },
  })
  let auditEventsDeleted = 0

  for (const organization of organizations) {
    const retentionDays = getPlanEntitlements(
      organization.planKey as PlanKey,
    ).auditRetentionDays
    if (retentionDays === null) continue

    const result = await prisma.auditEvent.deleteMany({
      where: {
        organizationId: organization.id,
        createdAt: { lt: getRetentionCutoff(retentionDays, now) },
      },
    })
    auditEventsDeleted += result.count
  }

  const [webhookDeliveries, billingEvents, auditExports] = await Promise.all([
    prisma.gitHubWebhookDelivery.deleteMany({
      where: {
        status: { in: ['processed', 'ignored'] },
        createdAt: { lt: getRetentionCutoff(30, now) },
      },
    }),
    prisma.billingWebhookEvent.deleteMany({
      where: {
        status: { in: ['processed', 'ignored'] },
        createdAt: { lt: getRetentionCutoff(365, now) },
      },
    }),
    prisma.auditExport.deleteMany({
      where: { createdAt: { lt: getRetentionCutoff(30, now) } },
    }),
  ])

  return {
    auditEventsDeleted,
    webhookDeliveriesDeleted: webhookDeliveries.count,
    billingEventsDeleted: billingEvents.count,
    auditExportsDeleted: auditExports.count,
  }
}
