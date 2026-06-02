/**
 * Cross-tenant data access for the platform admin dashboard.
 *
 * This is the ONLY module that intentionally queries across organizations.
 * Every other read in the app stays org-scoped via `lib/data/app-data.ts`.
 * Callers must be gated by `requirePlatformAdmin()` before reaching here.
 */
import {
  getHealthDiagnostics,
  summarizeDiagnostics,
  type DiagnosticCheck,
  type DiagnosticStatus,
} from '@/lib/diagnostics'
import { getPrismaClient } from '@/lib/prisma'
import type { Prisma } from '@/lib/generated/prisma/client'
import { requirePlatformAdmin } from '@/lib/admin/access'
import {
  PLAN_MONTHLY_PRICE,
  bucketByWeek,
  billingStatusDistribution,
  estimateMrr,
  planDistribution,
  type WeekBucket,
} from '@/lib/admin/metrics'
import {
  cursorQuery,
  cursorResult,
  type CursorInput,
  type CursorPage,
} from '@/lib/admin/pagination'
import type { AiReviewStatus, BillingStatus, PlanKey } from '@/lib/types'

export type AdminListPage<T> = CursorPage<T> & { total: number }

export type AdminSubscriptionSummary = {
  mrr: number
  active: number
  trialing: number
  churnRisk: number
  total: number
}

const SIGNUP_WEEKS = 12

export type AdminSubscriptionFilters = {
  q: string
  plan: PlanKey | 'all'
  status: BillingStatus | 'all'
  after: string
  before: string
}

export type AdminUserFilters = {
  q: string
  verified: 'all' | 'yes' | 'no'
  after: string
  before: string
}

export type AdminOrganizationFilters = {
  q: string
  plan: PlanKey | 'all'
  status: BillingStatus | 'all'
  after: string
  before: string
}

export type AdminRecentUser = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  membershipCount: number
  createdAt: string
}

export type AdminOverview = {
  totals: {
    users: number
    organizations: number
    repositories: number
    pullRequests: number
  }
  subscriptions: {
    mrr: number
    active: number
    trialing: number
    pastDue: number
    canceled: number
  }
  planDistribution: Record<PlanKey, number>
  billingDistribution: Record<BillingStatus, number>
  signupsByWeek: WeekBucket[]
  recentUsers: AdminRecentUser[]
  health: DiagnosticStatus
}

export type AdminSubscriptionRow = {
  id: string
  name: string
  slug: string
  planKey: PlanKey
  billingStatus: BillingStatus
  subscriptionStatus: string | null
  customerId: string | null
  subscriptionId: string | null
  monthlyPrice: number
  trialEndsAt: string | null
  cancellationEffectiveAt: string | null
  lastUpgradeAt: string | null
}

export type AdminUserRow = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  membershipCount: number
  roles: string[]
  lastActiveAt: string | null
  createdAt: string
}

export type AdminOrganizationRow = {
  id: string
  name: string
  slug: string
  planKey: PlanKey
  billingStatus: BillingStatus
  memberCount: number
  repositoryCount: number
  prCheckUsage: number
  createdAt: string
}

export type AdminOrganizationDetail = {
  id: string
  name: string
  slug: string
  planKey: PlanKey
  billingStatus: BillingStatus
  subscriptionStatus: string | null
  customerId: string | null
  subscriptionId: string | null
  trialEndsAt: string | null
  cancellationEffectiveAt: string | null
  failedPaymentAt: string | null
  lastUpgradeAt: string | null
  githubInstallationId: string | null
  createdAt: string
  counts: { members: number; repositories: number; pullRequests: number }
  members: Array<{
    id: string
    role: string
    name: string
    email: string
    emailVerified: boolean
    joinedAt: string
  }>
  repositories: Array<{
    id: string
    name: string
    owner: string
    connectedStatus: string
    visibility: string
    riskProfile: string
    monthlyPrCheckUsage: number
    lastSyncedAt: string | null
  }>
  auditEvents: Array<{
    id: string
    eventType: string
    actor: string | null
    summary: string
    createdAt: string
  }>
}

export type AdminSystem = {
  summary: DiagnosticStatus
  checks: DiagnosticCheck[]
  webhooks: {
    pending: number
    failed: number
    processed: number
    recentFailures: Array<{
      deliveryId: string
      event: string
      action: string | null
      attemptCount: number
      lastError: string | null
      createdAt: string
    }>
  }
  billingEvents: Array<{
    id: string
    eventName: string
    status: string
    createdAt: string
  }>
  aiReviews: Record<AiReviewStatus, number>
}

function buildOrgWhere(filters: {
  q: string
  plan: PlanKey | 'all'
  status: BillingStatus | 'all'
}): Prisma.OrganizationWhereInput {
  const where: Prisma.OrganizationWhereInput = {}
  if (filters.plan !== 'all') where.planKey = filters.plan
  if (filters.status !== 'all') where.billingStatus = filters.status
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: 'insensitive' } },
      { slug: { contains: filters.q, mode: 'insensitive' } },
    ]
  }
  return where
}

async function paginateByCursor<T extends { id: string }>(
  input: CursorInput,
  fetch: (opts: {
    backward: boolean
    take: number
    cursor?: { id: string }
    skip: number
  }) => Promise<T[]>,
): Promise<CursorPage<T>> {
  const query = cursorQuery(input)
  const fetched = await fetch(query)
  return cursorResult(fetched, input)
}

export async function getAdminOverview(): Promise<AdminOverview | null> {
  await requirePlatformAdmin()
  const prisma = getPrismaClient()
  if (!prisma) return null

  const signupCutoff = new Date(
    Date.now() - SIGNUP_WEEKS * 7 * 24 * 60 * 60 * 1000,
  )
  const [
    userCount,
    orgCount,
    repoCount,
    prCount,
    orgs,
    signups,
    recentUsers,
    checks,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.repository.count(),
    prisma.pullRequest.count(),
    prisma.organization.findMany({
      select: { planKey: true, billingStatus: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: signupCutoff } },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        _count: { select: { memberships: true } },
      },
    }),
    getHealthDiagnostics(),
  ])

  const planRows = orgs.map((org) => ({
    planKey: org.planKey as PlanKey,
    billingStatus: org.billingStatus as BillingStatus,
  }))
  const billing = billingStatusDistribution(planRows)

  return {
    totals: {
      users: userCount,
      organizations: orgCount,
      repositories: repoCount,
      pullRequests: prCount,
    },
    subscriptions: {
      mrr: estimateMrr(planRows),
      active: billing.active,
      trialing: billing.trialing,
      pastDue: billing.past_due,
      canceled: billing.canceled,
    },
    planDistribution: planDistribution(planRows),
    billingDistribution: billing,
    signupsByWeek: bucketByWeek(
      signups.map((row) => row.createdAt),
      SIGNUP_WEEKS,
    ),
    recentUsers: recentUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      membershipCount: user._count.memberships,
      createdAt: user.createdAt.toISOString(),
    })),
    health: summarizeDiagnostics(checks),
  }
}

export async function listAdminSubscriptions(
  filters: AdminSubscriptionFilters,
): Promise<CursorPage<AdminSubscriptionRow>> {
  await requirePlatformAdmin()
  const prisma = getPrismaClient()
  if (!prisma) return { rows: [], nextCursor: null, prevCursor: null }

  const where = buildOrgWhere(filters)
  const page = await paginateByCursor(
    { after: filters.after || null, before: filters.before || null },
    (opts) =>
      prisma.organization.findMany({
        where,
        orderBy: opts.backward
          ? [{ createdAt: 'asc' }, { id: 'asc' }]
          : [{ createdAt: 'desc' }, { id: 'desc' }],
        take: opts.take,
        cursor: opts.cursor,
        skip: opts.skip,
        select: {
          id: true,
          name: true,
          slug: true,
          planKey: true,
          billingStatus: true,
          lemonSqueezySubscriptionStatus: true,
          lemonSqueezyCustomerId: true,
          lemonSqueezySubscriptionId: true,
          trialEndsAt: true,
          cancellationEffectiveAt: true,
          lastUpgradeAt: true,
        },
      }),
  )

  return {
    rows: page.rows.map((org) => {
      const planKey = org.planKey as PlanKey
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        planKey,
        billingStatus: org.billingStatus as BillingStatus,
        subscriptionStatus: org.lemonSqueezySubscriptionStatus,
        customerId: org.lemonSqueezyCustomerId,
        subscriptionId: org.lemonSqueezySubscriptionId,
        monthlyPrice: PLAN_MONTHLY_PRICE[planKey] ?? 0,
        trialEndsAt: org.trialEndsAt?.toISOString() ?? null,
        cancellationEffectiveAt:
          org.cancellationEffectiveAt?.toISOString() ?? null,
        lastUpgradeAt: org.lastUpgradeAt?.toISOString() ?? null,
      }
    }),
    nextCursor: page.nextCursor,
    prevCursor: page.prevCursor,
  }
}

/**
 * Plan/billing aggregates across the full filtered set (not just the visible
 * page) so the subscriptions summary metrics stay accurate under pagination.
 */
export async function getAdminSubscriptionSummary(
  filters: AdminSubscriptionFilters,
): Promise<AdminSubscriptionSummary> {
  await requirePlatformAdmin()
  const prisma = getPrismaClient()
  if (!prisma) return { mrr: 0, active: 0, trialing: 0, churnRisk: 0, total: 0 }

  const groups = await prisma.organization.groupBy({
    by: ['planKey', 'billingStatus'],
    where: buildOrgWhere(filters),
    _count: true,
  })

  let mrr = 0
  let active = 0
  let trialing = 0
  let churnRisk = 0
  let total = 0
  for (const group of groups) {
    const count = group._count
    const status = group.billingStatus as BillingStatus
    total += count
    if (status === 'active') active += count
    if (status === 'trialing') trialing += count
    if (status === 'past_due' || status === 'canceled') churnRisk += count
    if (status === 'active' || status === 'trialing') {
      mrr += (PLAN_MONTHLY_PRICE[group.planKey as PlanKey] ?? 0) * count
    }
  }

  return { mrr, active, trialing, churnRisk, total }
}

export async function listAdminUsers(
  filters: AdminUserFilters,
): Promise<AdminListPage<AdminUserRow>> {
  await requirePlatformAdmin()
  const prisma = getPrismaClient()
  if (!prisma) return { rows: [], nextCursor: null, prevCursor: null, total: 0 }

  const where: Prisma.UserWhereInput = {}
  if (filters.verified !== 'all')
    where.emailVerified = filters.verified === 'yes'
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: 'insensitive' } },
      { email: { contains: filters.q, mode: 'insensitive' } },
    ]
  }

  const [page, total] = await Promise.all([
    paginateByCursor(
      { after: filters.after || null, before: filters.before || null },
      (opts) =>
        prisma.user.findMany({
          where,
          orderBy: opts.backward
            ? [{ createdAt: 'asc' }, { id: 'asc' }]
            : [{ createdAt: 'desc' }, { id: 'desc' }],
          take: opts.take,
          cursor: opts.cursor,
          skip: opts.skip,
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            createdAt: true,
            memberships: { select: { role: true } },
            sessions: {
              select: { createdAt: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        }),
    ),
    prisma.user.count({ where }),
  ])

  return {
    rows: page.rows.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      membershipCount: user.memberships.length,
      roles: Array.from(new Set(user.memberships.map((member) => member.role))),
      lastActiveAt: user.sessions[0]?.createdAt.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    })),
    nextCursor: page.nextCursor,
    prevCursor: page.prevCursor,
    total,
  }
}

export async function listAdminOrganizations(
  filters: AdminOrganizationFilters,
): Promise<AdminListPage<AdminOrganizationRow>> {
  await requirePlatformAdmin()
  const prisma = getPrismaClient()
  if (!prisma) return { rows: [], nextCursor: null, prevCursor: null, total: 0 }

  const where = buildOrgWhere(filters)
  const [page, total, usage] = await Promise.all([
    paginateByCursor(
      { after: filters.after || null, before: filters.before || null },
      (opts) =>
        prisma.organization.findMany({
          where,
          orderBy: opts.backward
            ? [{ createdAt: 'asc' }, { id: 'asc' }]
            : [{ createdAt: 'desc' }, { id: 'desc' }],
          take: opts.take,
          cursor: opts.cursor,
          skip: opts.skip,
          select: {
            id: true,
            name: true,
            slug: true,
            planKey: true,
            billingStatus: true,
            createdAt: true,
            _count: { select: { members: true, repositories: true } },
          },
        }),
    ),
    prisma.organization.count({ where }),
    prisma.repository.groupBy({
      by: ['organizationId'],
      _sum: { monthlyPrCheckUsage: true },
    }),
  ])

  const usageMap = new Map(
    usage.map((row) => [row.organizationId, row._sum.monthlyPrCheckUsage ?? 0]),
  )

  return {
    rows: page.rows.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      planKey: org.planKey as PlanKey,
      billingStatus: org.billingStatus as BillingStatus,
      memberCount: org._count.members,
      repositoryCount: org._count.repositories,
      prCheckUsage: usageMap.get(org.id) ?? 0,
      createdAt: org.createdAt.toISOString(),
    })),
    nextCursor: page.nextCursor,
    prevCursor: page.prevCursor,
    total,
  }
}

export async function getAdminOrganization(
  id: string,
): Promise<AdminOrganizationDetail | null> {
  await requirePlatformAdmin()
  const prisma = getPrismaClient()
  if (!prisma) return null

  const org = await prisma.organization.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      planKey: true,
      billingStatus: true,
      lemonSqueezySubscriptionStatus: true,
      lemonSqueezyCustomerId: true,
      lemonSqueezySubscriptionId: true,
      trialEndsAt: true,
      cancellationEffectiveAt: true,
      failedPaymentAt: true,
      lastUpgradeAt: true,
      githubInstallationId: true,
      createdAt: true,
      _count: {
        select: { members: true, repositories: true, pullRequests: true },
      },
      members: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          role: true,
          createdAt: true,
          user: {
            select: { name: true, email: true, emailVerified: true },
          },
        },
      },
      repositories: {
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          owner: true,
          connectedStatus: true,
          visibility: true,
          riskProfile: true,
          monthlyPrCheckUsage: true,
          lastSyncedAt: true,
        },
      },
      auditEvents: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          eventType: true,
          actor: true,
          summary: true,
          createdAt: true,
        },
      },
    },
  })

  if (!org) return null

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    planKey: org.planKey as PlanKey,
    billingStatus: org.billingStatus as BillingStatus,
    subscriptionStatus: org.lemonSqueezySubscriptionStatus,
    customerId: org.lemonSqueezyCustomerId,
    subscriptionId: org.lemonSqueezySubscriptionId,
    trialEndsAt: org.trialEndsAt?.toISOString() ?? null,
    cancellationEffectiveAt: org.cancellationEffectiveAt?.toISOString() ?? null,
    failedPaymentAt: org.failedPaymentAt?.toISOString() ?? null,
    lastUpgradeAt: org.lastUpgradeAt?.toISOString() ?? null,
    githubInstallationId: org.githubInstallationId,
    createdAt: org.createdAt.toISOString(),
    counts: {
      members: org._count.members,
      repositories: org._count.repositories,
      pullRequests: org._count.pullRequests,
    },
    members: org.members.map((member) => ({
      id: member.id,
      role: member.role,
      name: member.user.name,
      email: member.user.email,
      emailVerified: member.user.emailVerified,
      joinedAt: member.createdAt.toISOString(),
    })),
    repositories: org.repositories.map((repo) => ({
      id: repo.id,
      name: repo.name,
      owner: repo.owner,
      connectedStatus: repo.connectedStatus,
      visibility: repo.visibility,
      riskProfile: repo.riskProfile,
      monthlyPrCheckUsage: repo.monthlyPrCheckUsage,
      lastSyncedAt: repo.lastSyncedAt?.toISOString() ?? null,
    })),
    auditEvents: org.auditEvents.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      actor: event.actor,
      summary: event.summary,
      createdAt: event.createdAt.toISOString(),
    })),
  }
}

export async function getAdminSystem(): Promise<AdminSystem | null> {
  await requirePlatformAdmin()
  const prisma = getPrismaClient()
  if (!prisma) return null

  const [
    checks,
    pending,
    failed,
    processed,
    recentFailures,
    billingEvents,
    aiReviewGroups,
  ] = await Promise.all([
    getHealthDiagnostics(),
    prisma.gitHubWebhookDelivery.count({
      where: { status: { in: ['received', 'queued', 'processing'] } },
    }),
    prisma.gitHubWebhookDelivery.count({ where: { status: 'failed' } }),
    prisma.gitHubWebhookDelivery.count({
      where: { status: { in: ['processed', 'ignored'] } },
    }),
    prisma.gitHubWebhookDelivery.findMany({
      where: { status: 'failed' },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        deliveryId: true,
        event: true,
        action: true,
        attemptCount: true,
        lastError: true,
        createdAt: true,
      },
    }),
    prisma.billingWebhookEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, eventName: true, status: true, createdAt: true },
    }),
    prisma.aiReviewJob.groupBy({ by: ['status'], _count: true }),
  ])

  const aiReviews: Record<AiReviewStatus, number> = {
    queued: 0,
    in_progress: 0,
    blocked: 0,
    skipped: 0,
    completed: 0,
    failed: 0,
  }
  for (const group of aiReviewGroups) {
    aiReviews[group.status as AiReviewStatus] = group._count
  }

  return {
    summary: summarizeDiagnostics(checks),
    checks,
    webhooks: {
      pending,
      failed,
      processed,
      recentFailures: recentFailures.map((delivery) => ({
        deliveryId: delivery.deliveryId,
        event: delivery.event,
        action: delivery.action,
        attemptCount: delivery.attemptCount,
        lastError: delivery.lastError,
        createdAt: delivery.createdAt.toISOString(),
      })),
    },
    billingEvents: billingEvents.map((event) => ({
      id: event.id,
      eventName: event.eventName,
      status: event.status,
      createdAt: event.createdAt.toISOString(),
    })),
    aiReviews,
  }
}
