import { getPrismaClient } from "@/lib/prisma";

export const PR_CHECKS_METRIC = "pr_checks";

export function getCurrentUsagePeriod(now = new Date()) {
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return { periodStart, periodEnd };
}

export async function getPrCheckUsage(organizationId: string, now = new Date()) {
  const prisma = getPrismaClient();
  if (!prisma) return 0;

  const { periodStart, periodEnd } = getCurrentUsagePeriod(now);
  const aggregate = await prisma.usageRecord.aggregate({
    where: {
      organizationId,
      metric: PR_CHECKS_METRIC,
      periodStart: { gte: periodStart },
      periodEnd: { lte: periodEnd },
    },
    _sum: { quantity: true },
  });

  return aggregate._sum.quantity ?? 0;
}

export async function recordPrChecks(organizationId: string, quantity: number, now = new Date()) {
  const prisma = getPrismaClient();
  if (!prisma || quantity <= 0) return;

  const { periodStart, periodEnd } = getCurrentUsagePeriod(now);
  await prisma.usageRecord.create({
    data: {
      organizationId,
      metric: PR_CHECKS_METRIC,
      quantity,
      periodStart,
      periodEnd,
    },
  });
}
