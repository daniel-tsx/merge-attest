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

  // Aggregate in the database: each PR check is its own row, so summing a
  // fixed window of recent rows would undercount busy months.
  const buckets = await prisma.usageRecord.groupBy({
    by: ['periodStart', 'periodEnd'],
    where: {
      organizationId,
      metric: PR_CHECKS_METRIC,
    },
    _sum: { quantity: true },
    orderBy: { periodStart: 'desc' },
    take,
  })

  return buckets.map((bucket) => ({
    periodStart: bucket.periodStart.toISOString(),
    periodEnd: bucket.periodEnd.toISOString(),
    quantity: bucket._sum.quantity ?? 0,
  }))
}

export async function recordPrChecks(
  organizationId: string,
  quantity: number,
  now = new Date(),
  sourceKey?: string,
) {
  const prisma = getPrismaClient()
  if (!prisma || quantity <= 0) return false

  const { periodStart, periodEnd } = getCurrentUsagePeriod(now)
  const sourceKeyWhere = sourceKey
    ? {
        organizationId_metric_periodStart_sourceKey: {
          organizationId,
          metric: PR_CHECKS_METRIC,
          periodStart,
          sourceKey,
        },
      }
    : null
  if (sourceKeyWhere) {
    const existing = await prisma.usageRecord.findUnique({
      where: sourceKeyWhere,
    })
    if (existing) return false
  }

  try {
    await prisma.usageRecord.create({
      data: {
        organizationId,
        metric: PR_CHECKS_METRIC,
        quantity,
        sourceKey,
        periodStart,
        periodEnd,
      },
    })
  } catch (error) {
    // Concurrent deliveries can race past the lookup; the unique constraint
    // makes the duplicate insert lose, which simply means "already recorded".
    if (sourceKeyWhere) {
      const duplicate = await prisma.usageRecord.findUnique({
        where: sourceKeyWhere,
      })
      if (duplicate) return false
    }
    throw error
  }
  return true
}
