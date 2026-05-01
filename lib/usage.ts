import { getPrismaClient } from '@/lib/prisma'

export const PR_CHECKS_METRIC = 'pr_checks'

export function getCurrentUsagePeriod(now = new Date()) {
  const periodStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  )
  const periodEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  )

  return { periodStart, periodEnd }
}

export async function getPrCheckUsage(
  organizationId: string,
  now = new Date(),
) {
  const prisma = getPrismaClient()
  if (!prisma) return 0

  const { periodStart, periodEnd } = getCurrentUsagePeriod(now)
  const aggregate = await prisma.usageRecord.aggregate({
    where: {
      organizationId,
      metric: PR_CHECKS_METRIC,
      periodStart: { gte: periodStart },
      periodEnd: { lte: periodEnd },
    },
    _sum: { quantity: true },
  })

  return aggregate._sum.quantity ?? 0
}

export async function getPrCheckUsageHistory(organizationId: string, take = 6) {
  const prisma = getPrismaClient()
  if (!prisma) return []

  const records = await prisma.usageRecord.findMany({
    where: {
      organizationId,
      metric: PR_CHECKS_METRIC,
    },
    orderBy: { periodStart: 'desc' },
    take: take * 20,
  })
  const buckets = new Map<
    string,
    { periodStart: Date; periodEnd: Date; quantity: number }
  >()

  for (const record of records) {
    const key = record.periodStart.toISOString()
    const bucket = buckets.get(key) ?? {
      periodStart: record.periodStart,
      periodEnd: record.periodEnd,
      quantity: 0,
    }
    bucket.quantity += record.quantity
    buckets.set(key, bucket)
  }

  return Array.from(buckets.values())
    .sort(
      (left, right) => right.periodStart.getTime() - left.periodStart.getTime(),
    )
    .slice(0, take)
    .map((bucket) => ({
      periodStart: bucket.periodStart.toISOString(),
      periodEnd: bucket.periodEnd.toISOString(),
      quantity: bucket.quantity,
    }))
}

export async function recordPrChecks(
  organizationId: string,
  quantity: number,
  now = new Date(),
) {
  const prisma = getPrismaClient()
  if (!prisma || quantity <= 0) return

  const { periodStart, periodEnd } = getCurrentUsagePeriod(now)
  await prisma.usageRecord.create({
    data: {
      organizationId,
      metric: PR_CHECKS_METRIC,
      quantity,
      periodStart,
      periodEnd,
    },
  })
}
