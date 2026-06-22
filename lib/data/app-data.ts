import { cache } from 'react'
import { organization as demoOrganization } from '@/lib/demo-data'
import {
  activityEvents as demoActivityEvents,
  auditEvents as demoAuditEvents,
  getPullRequest as getDemoPullRequest,
  getRepository as getDemoRepository,
  getRepositoryPullRequests as getDemoRepositoryPullRequests,
  getRepositoryRules as getDemoRepositoryRules,
  getAgentIdentityRules as getDemoAgentIdentityRules,
  getAttestations as getDemoAttestations,
  pullRequests as demoPullRequests,
  repositories as demoRepositories,
  users as demoUsers,
} from '@/lib/demo-data'
import { isDatabaseConfigured, isProduction } from '@/lib/env'
import {
  getDefaultRepositoryReviewSettings,
  stringListFromJson,
} from '@/lib/ai/settings'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import {
  getReviewSlaStatus,
  normalizeInviteStatus,
  suggestReviewerFromViolations,
} from '@/lib/collaboration'
import { getPrismaClient } from '@/lib/prisma'
import type { PrismaClient } from '@/lib/generated/prisma/client'
import type {
  ActivityEvent,
  AgentIdentityRule,
  Attestation,
  AttributionEvidence,
  AuditExport,
  AuditEvent,
  BillingStatus,
  PlanKey,
  PullRequest,
  PullRequestFileInput,
  Repository,
  RepositoryReviewSettings,
  RepoRule,
  RiskSignal,
} from '@/lib/types'

export type TeamInvite = {
  id: string
  email: string
  role: TeamMember['role']
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  inviteUrl?: string
  invitedBy?: string
  expiresAt: string
  acceptedAt?: string
  createdAt: string
}

export type OrganizationContext = {
  id: string
  name: string
  slug: string
  planKey: PlanKey
  githubInstallationId: string | null
  billingStatus: BillingStatus
  lemonSqueezyCustomerId: string | null
  lemonSqueezySubscriptionId: string | null
  lemonSqueezySubscriptionStatus: string | null
  trialEndsAt?: string
  cancellationEffectiveAt?: string
  failedPaymentAt?: string
  lastUpgradeAt?: string
  role: TeamMember['role']
  dataMode: 'live' | 'demo'
}

type RepositoryRow = {
  id: string
  name: string
  provider: string
  owner: string
  defaultBranch: string
  visibility: string
  connectedStatus: string
  lastSyncedAt: Date | null
  activeRulesCount: number
  monthlyPrCheckUsage: number
  riskProfile: string
  createdAt: Date
  updatedAt: Date
}

type RuleRow = {
  id: string
  repositoryId: string
  name: string
  description: string
  enabled: boolean
  triggerType: string
  actionType: string
  severity: string
  branchPattern: string | null
  pathPattern: string | null
  labelPattern: string | null
  agentSource: string | null
  minimumRiskLevel: string | null
  codeOwnerHint: string | null
  createdAt: Date
  updatedAt: Date
}

type RepositoryReviewSettingsRow = {
  id: string
  repositoryId: string
  aiReviewsEnabled: boolean
  reviewDepth: string
  minimumSeverity: string
  model: string | null
  ignoredPaths: unknown
  stackTags: unknown
  publishInlineComments: boolean
  publishManagedComment: boolean
  publishCheckRun: boolean
  createdAt: Date
  updatedAt: Date
}

export type TeamMember = {
  id: string
  userId: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  createdAt: string
}

type TeamInviteRow = {
  id: string
  email: string
  role: string
  status: string
  token: string
  expiresAt: Date
  acceptedAt: Date | null
  createdAt: Date
  invitedBy: { name: string; email: string } | null
}

type TeamMemberRow = {
  id: string
  role: string
  createdAt: Date
  userId: string
  user: {
    name: string
    email: string
  }
}

type PullRequestRow = {
  id: string
  repositoryId: string
  repository: { name: string }
  number: number
  title: string
  author: string
  headSha: string | null
  branch: string
  baseBranch: string
  status: string
  aiAssisted: boolean | null
  agentSource: string
  attributionConfidence: number
  attributionEvidence: unknown
  riskScore: number
  riskLevel: string
  testGapStatus: string
  ciStatus: string
  approvalStatus: string
  filesChangedCount: number
  linesAdded: number
  linesDeleted: number
  assignedReviewerId: string | null
  reviewDueAt: Date | null
  createdAt: Date
  updatedAt: Date
  assignedReviewer: { id: string; name: string; email: string } | null
  files?: Array<{
    path: string
    additions: number
    deletions: number
    changeType: string
  }>
  riskSignals?: Array<{
    key: string
    label: string
    score: number
    level: string
    filePaths: unknown
  }>
  testGapAnalysis?: {
    status: string
    summary: string
    affectedFiles: unknown
    confidence: string
    suggestions: Array<{ testFile: string; testCase: string }>
  } | null
  ruleViolations: Array<{
    id: string
    summary: string
    resolved: boolean
    createdAt: Date
    rule: {
      name: string
      severity: string
      actionType: string
      codeOwnerHint: string | null
    }
  }>
  approvals: Array<{
    id: string
    decision: string
    note: string | null
    createdAt: Date
    reviewer: { name: string; email: string } | null
  }>
  comments?: Array<{
    id: string
    body: string
    createdAt: Date
    author: { name: string; email: string } | null
  }>
  aiReviewJobs?: Array<{
    id: string
    status: string
    statusDetail: string | null
    model: string | null
    githubReviewId: string | null
    githubManagedCommentId?: string | null
    githubCheckRunId?: string | null
    commentsCount: number
    skippedCommentsCount: number
    errorMessage: string | null
    startedAt: Date | null
    completedAt: Date | null
    createdAt: Date
    updatedAt: Date
  }>
}

type ActivityEventRow = {
  id: string
  timestamp: Date
  actor: string
  agentSource: string
  eventType: string
  summary: string
  riskLevel: string
  metadata: unknown
  repositoryId: string
  pullRequestId: string | null
  repository: { name: string }
  pullRequest: { number: number } | null
}

type AuditEventRow = {
  id: string
  eventType: string
  actor: string | null
  summary: string
  metadata: unknown
  repositoryId: string | null
  pullRequestId: string | null
  createdAt: Date
  repository: { name: string } | null
  pullRequest: { number: number } | null
}

type AuditExportRow = {
  id: string
  fileName: string
  format: string
  filters: unknown
  eventCount: number
  createdAt: Date
  createdBy: { name: string; email: string } | null
}

type GitHubWebhookDeliveryRow = {
  id: string
  deliveryId: string
  event: string
  action: string | null
  status: string
  message: string | null
  attemptCount: number
  lastAttemptAt: Date | null
  nextRetryAt: Date | null
  lastError: string | null
  createdAt: Date
  processedAt: Date | null
}

export type DashboardTrendPoint = {
  date: string
  risk: number
  testGaps: number
}

export type GitHubWebhookDiagnostic = {
  id: string
  deliveryId: string
  event: string
  action?: string
  status: string
  message?: string
  attemptCount: number
  lastAttemptAt?: string
  nextRetryAt?: string
  lastError?: string
  createdAt: string
  processedAt?: string
}

type SearchFilters = {
  query?: string
}

type RepositoryFilters = SearchFilters & {
  riskProfile?: string
  visibility?: string
}

type PullRequestFilters = SearchFilters & {
  repositoryId?: string
  riskLevel?: string
  agentSource?: string
  approvalStatus?: string
  assigneeId?: string
  slaStatus?: string
}

type ActivityFilters = SearchFilters & {
  repositoryId?: string
  pullRequestId?: string
  agentSource?: string
  eventType?: string
  take?: number
}

export type AuditEventFilters = SearchFilters & {
  repositoryId?: string
  pullRequestId?: string
  pullRequestNumber?: string
  eventType?: string
  actor?: string
  severity?: string
  since?: Date
  from?: Date
  to?: Date
  take?: number
}

function toIso(date: Date | string | null | undefined) {
  if (!date) return new Date(0).toISOString()
  return typeof date === 'string' ? date : date.toISOString()
}

function stringArrayFromJson(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

const attributionSignals = new Set<AttributionEvidence['signal']>([
  'commit_trailer',
  'bot_account',
  'email_domain',
  'branch_prefix',
  'label',
  'title_keyword',
  'registry_rule',
])

function attributionEvidenceFromJson(value: unknown): AttributionEvidence[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is AttributionEvidence => {
    if (!item || typeof item !== 'object') return false
    const candidate = item as Record<string, unknown>
    return (
      typeof candidate.signal === 'string' &&
      attributionSignals.has(
        candidate.signal as AttributionEvidence['signal'],
      ) &&
      typeof candidate.agentSource === 'string' &&
      typeof candidate.detail === 'string' &&
      typeof candidate.weight === 'number'
    )
  })
}

function recordFromJson(
  value: unknown,
): Record<string, string | number | boolean | undefined> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string | number | boolean | undefined] => {
        const item = entry[1]
        return (
          item === undefined ||
          typeof item === 'string' ||
          typeof item === 'number' ||
          typeof item === 'boolean'
        )
      },
    ),
  )
}

function normalizeFilter(value: string | undefined) {
  const trimmed = value?.trim().toLowerCase()
  return trimmed || undefined
}

/**
 * Filter value for a Prisma `where` clause. Page filters use `''`/`'all'` as
 * "no filter", which must become `undefined` before reaching the database —
 * enum columns reject `'all'` outright and string columns would match nothing.
 * Preserves the original casing for id-valued filters.
 */
function dbFilterValue(value: string | undefined) {
  const trimmed = value?.trim()
  if (!trimmed || trimmed.toLowerCase() === 'all') return undefined
  return trimmed
}

function includesQuery(
  values: Array<string | number | boolean | null | undefined>,
  query?: string,
) {
  const normalizedQuery = normalizeFilter(query)
  if (!normalizedQuery) return true

  return values.some((value) =>
    String(value ?? '')
      .toLowerCase()
      .includes(normalizedQuery),
  )
}

function matchesOptionalFilter(
  value: string | null | undefined,
  filter?: string,
) {
  const normalizedFilter = normalizeFilter(filter)
  if (!normalizedFilter || normalizedFilter === 'all') return true

  return value?.toLowerCase() === normalizedFilter
}

export function applyRepositoryFilters(
  items: Repository[],
  filters: RepositoryFilters = {},
) {
  return items.filter(
    (repository) =>
      includesQuery(
        [
          repository.name,
          repository.owner,
          repository.defaultBranch,
          repository.visibility,
        ],
        filters.query,
      ) &&
      matchesOptionalFilter(repository.riskProfile, filters.riskProfile) &&
      matchesOptionalFilter(repository.visibility, filters.visibility),
  )
}

function applyPullRequestFilters(
  items: PullRequest[],
  filters: PullRequestFilters = {},
) {
  return items.filter(
    (pullRequest) =>
      includesQuery(
        [
          pullRequest.title,
          pullRequest.number,
          pullRequest.author,
          pullRequest.repositoryName,
          pullRequest.branch,
          pullRequest.baseBranch,
        ],
        filters.query,
      ) &&
      matchesOptionalFilter(pullRequest.repositoryId, filters.repositoryId) &&
      matchesOptionalFilter(pullRequest.riskLevel, filters.riskLevel) &&
      matchesOptionalFilter(pullRequest.agentSource, filters.agentSource) &&
      matchesOptionalFilter(
        pullRequest.approvalStatus,
        filters.approvalStatus,
      ) &&
      matchesOptionalFilter(
        pullRequest.assignedReviewer?.id ?? 'unassigned',
        filters.assigneeId,
      ) &&
      matchesOptionalFilter(pullRequest.reviewSlaStatus, filters.slaStatus),
  )
}

function applyActivityFilters(
  items: ActivityEvent[],
  filters: ActivityFilters = {},
) {
  const filtered = items.filter(
    (event) =>
      includesQuery(
        [
          event.summary,
          event.repositoryName,
          event.pullRequestNumber,
          event.actor,
          event.agentSource,
          event.eventType,
        ],
        filters.query,
      ) &&
      matchesOptionalFilter(event.repositoryId, filters.repositoryId) &&
      matchesOptionalFilter(event.pullRequestId, filters.pullRequestId) &&
      matchesOptionalFilter(event.agentSource, filters.agentSource) &&
      matchesOptionalFilter(event.eventType, filters.eventType),
  )

  return typeof filters.take === 'number'
    ? filtered.slice(0, filters.take)
    : filtered
}

function applyAuditEventFilters(
  items: AuditEvent[],
  filters: AuditEventFilters = {},
) {
  const filtered = items.filter((event) => {
    const metadataSeverity =
      typeof event.metadata.severity === 'string'
        ? event.metadata.severity
        : undefined
    const createdAt = new Date(event.createdAt)

    return (
      includesQuery(
        [
          event.summary,
          event.eventType,
          event.actor,
          event.repositoryName,
          event.pullRequestNumber,
          metadataSeverity,
        ],
        filters.query,
      ) &&
      matchesOptionalFilter(event.eventType, filters.eventType) &&
      matchesOptionalFilter(event.repositoryId, filters.repositoryId) &&
      matchesOptionalFilter(event.pullRequestId, filters.pullRequestId) &&
      matchesOptionalFilter(
        event.pullRequestNumber?.toString(),
        filters.pullRequestNumber,
      ) &&
      matchesOptionalFilter(event.actor, filters.actor) &&
      matchesOptionalFilter(metadataSeverity, filters.severity) &&
      (!filters.from || createdAt >= filters.from) &&
      (!filters.to || createdAt <= filters.to) &&
      (!filters.since || createdAt >= filters.since)
    )
  })

  return typeof filters.take === 'number'
    ? filtered.slice(0, filters.take)
    : filtered
}

function formatTrendDate(date: Date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function buildTrendData(
  pullRequests: PullRequest[],
  days = 7,
): DashboardTrendPoint[] {
  const latestTimestamp = pullRequests.reduce((latest, pullRequest) => {
    const timestamp = new Date(pullRequest.updatedAt).getTime()
    return Number.isFinite(timestamp) ? Math.max(latest, timestamp) : latest
  }, 0)
  const end = latestTimestamp ? new Date(latestTimestamp) : new Date()
  const start = new Date(
    Date.UTC(
      end.getUTCFullYear(),
      end.getUTCMonth(),
      end.getUTCDate() - (days - 1),
    ),
  )
  const buckets = new Map<
    string,
    { riskTotal: number; pullRequestCount: number; testGaps: number }
  >()

  for (let index = 0; index < days; index += 1) {
    const day = new Date(
      Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth(),
        start.getUTCDate() + index,
      ),
    )
    buckets.set(day.toISOString().slice(0, 10), {
      riskTotal: 0,
      pullRequestCount: 0,
      testGaps: 0,
    })
  }

  for (const pullRequest of pullRequests) {
    const key = new Date(pullRequest.updatedAt).toISOString().slice(0, 10)
    const bucket = buckets.get(key)
    if (!bucket) continue

    bucket.riskTotal += pullRequest.riskScore
    bucket.pullRequestCount += 1
    if (pullRequest.testGapStatus !== 'none') bucket.testGaps += 1
  }

  return Array.from(buckets.entries()).map(([key, bucket]) => ({
    date: formatTrendDate(new Date(`${key}T00:00:00.000Z`)),
    risk: bucket.pullRequestCount
      ? Math.round(bucket.riskTotal / bucket.pullRequestCount)
      : 0,
    testGaps: bucket.testGaps,
  }))
}

function productionFallbackError(error: unknown): never {
  throw error instanceof Error ? error : new Error('Database query failed.')
}

async function queryWithDemoFallback<T>(
  query: (client: PrismaClient) => Promise<T>,
  fallback: () => T,
  label: string,
) {
  const client = getPrismaClient()
  if (!client) {
    if (isProduction()) {
      throw new Error('Database access is required in production.')
    }
    return fallback()
  }

  try {
    return await query(client)
  } catch (error) {
    if (isProduction()) productionFallbackError(error)
    console.warn(`Falling back to demo data for ${label}.`, error)
    return fallback()
  }
}

function mapOrganization(
  row: {
    id: string
    name: string
    slug: string
    planKey: string
    githubInstallationId: string | null
    billingStatus?: string
    lemonSqueezyCustomerId?: string | null
    lemonSqueezySubscriptionId?: string | null
    lemonSqueezySubscriptionStatus?: string | null
    trialEndsAt?: Date | null
    cancellationEffectiveAt?: Date | null
    failedPaymentAt?: Date | null
    lastUpgradeAt?: Date | null
  } | null,
): OrganizationContext {
  if (!row) {
    return {
      id: demoOrganization.id,
      name: demoOrganization.name,
      slug: demoOrganization.slug,
      planKey: demoOrganization.planKey,
      githubInstallationId: 'demo-installation',
      billingStatus: 'active',
      lemonSqueezyCustomerId: null,
      lemonSqueezySubscriptionId: null,
      lemonSqueezySubscriptionStatus: null,
      role: 'owner',
      dataMode: 'demo',
    }
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    planKey: row.planKey as PlanKey,
    githubInstallationId: row.githubInstallationId,
    billingStatus: (row.billingStatus ?? 'active') as BillingStatus,
    lemonSqueezyCustomerId: row.lemonSqueezyCustomerId ?? null,
    lemonSqueezySubscriptionId: row.lemonSqueezySubscriptionId ?? null,
    lemonSqueezySubscriptionStatus: row.lemonSqueezySubscriptionStatus ?? null,
    trialEndsAt: row.trialEndsAt ? toIso(row.trialEndsAt) : undefined,
    cancellationEffectiveAt: row.cancellationEffectiveAt
      ? toIso(row.cancellationEffectiveAt)
      : undefined,
    failedPaymentAt: row.failedPaymentAt
      ? toIso(row.failedPaymentAt)
      : undefined,
    lastUpgradeAt: row.lastUpgradeAt ? toIso(row.lastUpgradeAt) : undefined,
    role: 'owner',
    dataMode: 'live',
  }
}

export const getCurrentOrganization = cache(
  async function getCurrentOrganization(): Promise<OrganizationContext> {
    const sessionOrganization = await ensureCurrentUserOrganization()
    if (sessionOrganization) {
      return {
        id: sessionOrganization.id,
        name: sessionOrganization.name,
        slug: sessionOrganization.slug,
        planKey: sessionOrganization.planKey,
        githubInstallationId: sessionOrganization.githubInstallationId,
        billingStatus: sessionOrganization.billingStatus,
        lemonSqueezyCustomerId: sessionOrganization.lemonSqueezyCustomerId,
        lemonSqueezySubscriptionId:
          sessionOrganization.lemonSqueezySubscriptionId,
        lemonSqueezySubscriptionStatus:
          sessionOrganization.lemonSqueezySubscriptionStatus,
        trialEndsAt: sessionOrganization.trialEndsAt
          ? toIso(sessionOrganization.trialEndsAt)
          : undefined,
        cancellationEffectiveAt: sessionOrganization.cancellationEffectiveAt
          ? toIso(sessionOrganization.cancellationEffectiveAt)
          : undefined,
        failedPaymentAt: sessionOrganization.failedPaymentAt
          ? toIso(sessionOrganization.failedPaymentAt)
          : undefined,
        lastUpgradeAt: sessionOrganization.lastUpgradeAt
          ? toIso(sessionOrganization.lastUpgradeAt)
          : undefined,
        role: sessionOrganization.role,
        dataMode: 'live',
      }
    }

    if (isProduction() || isDatabaseConfigured()) {
      throw new Error('Authentication is required to access organization data.')
    }

    return queryWithDemoFallback(
      async (client) => {
        const organization = await client.organization.findFirst({
          orderBy: { createdAt: 'asc' },
        })
        return mapOrganization(organization)
      },
      () => mapOrganization(null),
      'current organization',
    )
  },
)

export function mapRepository(row: RepositoryRow): Repository {
  return {
    id: row.id,
    name: row.name,
    provider: 'GitHub',
    owner: row.owner,
    defaultBranch: row.defaultBranch,
    visibility: row.visibility as Repository['visibility'],
    connectedStatus: row.connectedStatus as Repository['connectedStatus'],
    lastSyncedAt: toIso(row.lastSyncedAt ?? row.updatedAt),
    activeRulesCount: row.activeRulesCount,
    monthlyPrCheckUsage: row.monthlyPrCheckUsage,
    riskProfile: row.riskProfile as Repository['riskProfile'],
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

export function mapRepoRule(row: RuleRow): RepoRule {
  return {
    id: row.id,
    repositoryId: row.repositoryId,
    name: row.name,
    description: row.description,
    enabled: row.enabled,
    triggerType: row.triggerType as RepoRule['triggerType'],
    actionType: row.actionType as RepoRule['actionType'],
    severity: row.severity as RepoRule['severity'],
    branchPattern: row.branchPattern ?? undefined,
    pathPattern: row.pathPattern ?? undefined,
    labelPattern: row.labelPattern ?? undefined,
    agentSource: (row.agentSource as RepoRule['agentSource']) ?? undefined,
    minimumRiskLevel:
      (row.minimumRiskLevel as RepoRule['minimumRiskLevel']) ?? undefined,
    codeOwnerHint: row.codeOwnerHint ?? undefined,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

export function mapRepositoryReviewSettings(
  row: RepositoryReviewSettingsRow,
): RepositoryReviewSettings {
  return {
    id: row.id,
    repositoryId: row.repositoryId,
    aiReviewsEnabled: row.aiReviewsEnabled,
    reviewDepth: row.reviewDepth as RepositoryReviewSettings['reviewDepth'],
    minimumSeverity:
      row.minimumSeverity as RepositoryReviewSettings['minimumSeverity'],
    model: row.model ?? undefined,
    ignoredPaths: stringListFromJson(row.ignoredPaths),
    stackTags: stringListFromJson(row.stackTags),
    publishInlineComments: row.publishInlineComments,
    publishManagedComment: row.publishManagedComment,
    publishCheckRun: row.publishCheckRun,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

export function mapTeamMember(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    userId: row.userId,
    name: row.user.name,
    email: row.user.email,
    role: row.role as TeamMember['role'],
    createdAt: toIso(row.createdAt),
  }
}

export function mapTeamInvite(row: TeamInviteRow): TeamInvite {
  const status = normalizeInviteStatus(
    row.status as TeamInvite['status'],
    row.expiresAt,
  )

  return {
    id: row.id,
    email: row.email,
    role: row.role as TeamInvite['role'],
    status,
    invitedBy: row.invitedBy?.name ?? row.invitedBy?.email ?? 'Workspace admin',
    expiresAt: toIso(row.expiresAt),
    acceptedAt: row.acceptedAt ? toIso(row.acceptedAt) : undefined,
    createdAt: toIso(row.createdAt),
  }
}

export function mapPullRequest(row: PullRequestRow): PullRequest {
  const ruleViolations = row.ruleViolations.map((violation) => ({
    id: violation.id,
    ruleName: violation.rule.name,
    summary: violation.summary,
    severity: violation.rule
      .severity as PullRequest['ruleViolations'][number]['severity'],
    actionType: violation.rule
      .actionType as PullRequest['ruleViolations'][number]['actionType'],
    codeOwnerHint: violation.rule.codeOwnerHint ?? undefined,
    resolved: violation.resolved,
    createdAt: toIso(violation.createdAt),
  }))

  return {
    id: row.id,
    repositoryId: row.repositoryId,
    repositoryName: row.repository.name,
    number: row.number,
    title: row.title,
    author: row.author,
    headSha: row.headSha ?? undefined,
    branch: row.branch,
    baseBranch: row.baseBranch,
    status: row.status as PullRequest['status'],
    aiAssisted: row.aiAssisted,
    agentSource: row.agentSource as PullRequest['agentSource'],
    attributionConfidence: row.attributionConfidence,
    attributionEvidence: attributionEvidenceFromJson(row.attributionEvidence),
    riskScore: row.riskScore,
    riskLevel: row.riskLevel as PullRequest['riskLevel'],
    testGapStatus: row.testGapStatus as PullRequest['testGapStatus'],
    ciStatus: row.ciStatus as PullRequest['ciStatus'],
    approvalStatus: row.approvalStatus as PullRequest['approvalStatus'],
    filesChangedCount: row.filesChangedCount,
    linesAdded: row.linesAdded,
    linesDeleted: row.linesDeleted,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    assignedReviewer: row.assignedReviewer
      ? {
          id: row.assignedReviewer.id,
          name: row.assignedReviewer.name,
          email: row.assignedReviewer.email,
        }
      : undefined,
    reviewDueAt: row.reviewDueAt ? toIso(row.reviewDueAt) : undefined,
    reviewSlaStatus: getReviewSlaStatus(row.reviewDueAt),
    files: (row.files ?? []).map(
      (file): PullRequestFileInput => ({
        path: file.path,
        additions: file.additions,
        deletions: file.deletions,
        changeType: file.changeType as PullRequestFileInput['changeType'],
      }),
    ),
    riskSignals: (row.riskSignals ?? []).map(
      (signal): RiskSignal => ({
        key: signal.key,
        label: signal.label,
        score: signal.score,
        level: signal.level as RiskSignal['level'],
        filePaths: stringArrayFromJson(signal.filePaths),
      }),
    ),
    testGapAnalysis: {
      status: (row.testGapAnalysis?.status ??
        'none') as PullRequest['testGapAnalysis']['status'],
      summary:
        row.testGapAnalysis?.summary ??
        'No test gap analysis has been recorded.',
      affectedFiles: stringArrayFromJson(row.testGapAnalysis?.affectedFiles),
      suggestedTestFiles:
        row.testGapAnalysis?.suggestions.map((item) => item.testFile) ?? [],
      suggestedTestCases:
        row.testGapAnalysis?.suggestions.map((item) => item.testCase) ?? [],
      confidence: (row.testGapAnalysis?.confidence ??
        'low') as PullRequest['testGapAnalysis']['confidence'],
    },
    ruleViolations,
    reviewerSuggestion: suggestReviewerFromViolations(ruleViolations),
    approvals: row.approvals.map((approval) => ({
      id: approval.id,
      reviewer:
        approval.reviewer?.name ??
        approval.reviewer?.email ??
        'Unknown reviewer',
      decision:
        approval.decision as PullRequest['approvals'][number]['decision'],
      note: approval.note ?? '',
      createdAt: toIso(approval.createdAt),
    })),
    comments: (row.comments ?? []).map((comment) => ({
      id: comment.id,
      author:
        comment.author?.name ?? comment.author?.email ?? 'Unknown teammate',
      body: comment.body,
      createdAt: toIso(comment.createdAt),
    })),
    aiReviewJobs: (row.aiReviewJobs ?? []).map((job) => ({
      id: job.id,
      status: job.status as PullRequest['aiReviewJobs'][number]['status'],
      statusDetail: job.statusDetail ?? undefined,
      model: job.model ?? undefined,
      githubReviewId: job.githubReviewId ?? undefined,
      githubManagedCommentId: job.githubManagedCommentId ?? undefined,
      githubCheckRunId: job.githubCheckRunId ?? undefined,
      commentsCount: job.commentsCount,
      skippedCommentsCount: job.skippedCommentsCount,
      errorMessage: job.errorMessage ?? undefined,
      startedAt: job.startedAt ? toIso(job.startedAt) : undefined,
      completedAt: job.completedAt ? toIso(job.completedAt) : undefined,
      createdAt: toIso(job.createdAt),
      updatedAt: toIso(job.updatedAt),
    })),
  }
}

export function mapActivityEvent(row: ActivityEventRow): ActivityEvent {
  return {
    id: row.id,
    timestamp: toIso(row.timestamp),
    repositoryId: row.repositoryId,
    repositoryName: row.repository.name,
    pullRequestId: row.pullRequestId ?? undefined,
    pullRequestNumber: row.pullRequest?.number,
    actor: row.actor,
    agentSource: row.agentSource as ActivityEvent['agentSource'],
    eventType: row.eventType as ActivityEvent['eventType'],
    summary: row.summary,
    riskLevel: row.riskLevel as ActivityEvent['riskLevel'],
    metadata: recordFromJson(row.metadata),
  }
}

export function mapAuditEvent(row: AuditEventRow): AuditEvent {
  return {
    id: row.id,
    eventType: row.eventType as AuditEvent['eventType'],
    repositoryId: row.repositoryId ?? undefined,
    pullRequestId: row.pullRequestId ?? undefined,
    actor: row.actor ?? undefined,
    repositoryName: row.repository?.name,
    pullRequestNumber: row.pullRequest?.number,
    summary: row.summary,
    metadata: recordFromJson(row.metadata),
    createdAt: toIso(row.createdAt),
  }
}

export function mapAuditExport(row: AuditExportRow): AuditExport {
  return {
    id: row.id,
    fileName: row.fileName,
    format: row.format,
    filters: recordFromJson(row.filters),
    eventCount: row.eventCount,
    createdBy: row.createdBy?.name ?? row.createdBy?.email ?? 'Unknown user',
    createdAt: toIso(row.createdAt),
  }
}

export function mapGitHubWebhookDiagnostic(
  row: GitHubWebhookDeliveryRow,
): GitHubWebhookDiagnostic {
  return {
    id: row.id,
    deliveryId: row.deliveryId,
    event: row.event,
    action: row.action ?? undefined,
    status: row.status,
    message: row.message ?? undefined,
    attemptCount: row.attemptCount,
    lastAttemptAt: row.lastAttemptAt ? toIso(row.lastAttemptAt) : undefined,
    nextRetryAt: row.nextRetryAt ? toIso(row.nextRetryAt) : undefined,
    lastError: row.lastError ?? undefined,
    createdAt: toIso(row.createdAt),
    processedAt: row.processedAt ? toIso(row.processedAt) : undefined,
  }
}

// Pull requests, activity, and audit rows accumulate for the life of an
// organization, so every org-scoped list read is bounded: lists, dashboard
// metrics, and exports cover the most recent rows, never the whole table.
const PR_LIST_LIMIT = 1000
const REPOSITORY_PR_DETAIL_LIMIT = 100
const IN_MEMORY_FILTER_SCAN_LIMIT = 1000

// Relations every PR list consumer renders (tables, dashboards, exports).
// Files, risk signals, test-gap details, and comments are detail-only — see
// `pullRequestDetailInclude` — so org-wide list queries stay lean.
const pullRequestListInclude = {
  repository: true,
  assignedReviewer: true,
  ruleViolations: { include: { rule: true } },
  approvals: { include: { reviewer: true } },
  aiReviewJobs: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
}

const pullRequestDetailInclude = {
  ...pullRequestListInclude,
  files: true,
  riskSignals: true,
  testGapAnalysis: { include: { suggestions: true } },
  comments: {
    include: { author: true },
    orderBy: { createdAt: 'desc' as const },
  },
  aiReviewJobs: {
    orderBy: { createdAt: 'desc' as const },
    take: 5,
  },
}

export async function listRepositories(
  organizationId: string,
  filters: RepositoryFilters = {},
) {
  return queryWithDemoFallback(
    async (client) => {
      const rows = await client.repository.findMany({
        where: { organizationId },
        orderBy: [{ riskProfile: 'desc' }, { name: 'asc' }],
      })
      return applyRepositoryFilters(rows.map(mapRepository), filters)
    },
    () => applyRepositoryFilters(demoRepositories, filters),
    'repositories',
  )
}

export async function getRepository(organizationId: string, id: string) {
  return queryWithDemoFallback(
    async (client) => {
      const row = await client.repository.findFirst({
        where: { id, organizationId },
      })
      return row ? mapRepository(row) : null
    },
    () => getDemoRepository(id) ?? null,
    'repository detail',
  )
}

export async function getRepositoryRules(
  organizationId: string,
  repositoryId: string,
) {
  return queryWithDemoFallback(
    async (client) => {
      const rows = await client.repoRule.findMany({
        where: { organizationId, repositoryId },
        orderBy: { updatedAt: 'desc' },
      })
      return rows.map(mapRepoRule)
    },
    () => getDemoRepositoryRules(repositoryId),
    'repository rules',
  )
}

export function mapAgentIdentityRule(row: {
  id: string
  agentSource: string
  matchType: string
  pattern: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}): AgentIdentityRule {
  return {
    id: row.id,
    agentSource: row.agentSource as AgentIdentityRule['agentSource'],
    matchType: row.matchType as AgentIdentityRule['matchType'],
    pattern: row.pattern,
    enabled: row.enabled,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

export async function listAgentIdentityRules(organizationId: string) {
  return queryWithDemoFallback(
    async (client) => {
      const rows = await client.agentIdentityRule.findMany({
        where: { organizationId },
        orderBy: [{ enabled: 'desc' }, { updatedAt: 'desc' }],
      })
      return rows.map(mapAgentIdentityRule)
    },
    () => getDemoAgentIdentityRules(),
    'agent identity rules',
  )
}

export function mapAttestation(row: {
  id: string
  statement: string
  reviewerName: string
  agentSource: string
  attributionConfidence: number
  headSha: string | null
  createdAt: Date
}): Attestation {
  return {
    id: row.id,
    statement: row.statement,
    reviewerName: row.reviewerName,
    agentSource: row.agentSource as Attestation['agentSource'],
    attributionConfidence: row.attributionConfidence,
    headSha: row.headSha ?? undefined,
    createdAt: toIso(row.createdAt),
  }
}

export async function listAttestations(
  organizationId: string,
  pullRequestId: string,
) {
  return queryWithDemoFallback(
    async (client) => {
      const rows = await client.attestation.findMany({
        where: { organizationId, pullRequestId },
        orderBy: { createdAt: 'desc' },
      })
      return rows.map(mapAttestation)
    },
    () => getDemoAttestations(pullRequestId),
    'attestations',
  )
}

export async function getRepositoryReviewSettings(
  organizationId: string,
  repositoryId: string,
) {
  return queryWithDemoFallback(
    async (client) => {
      const row = await client.repositoryReviewSettings.findFirst({
        where: { organizationId, repositoryId },
      })
      return row
        ? mapRepositoryReviewSettings(row)
        : getDefaultRepositoryReviewSettings(repositoryId)
    },
    () => getDefaultRepositoryReviewSettings(repositoryId),
    'repository AI review settings',
  )
}

export async function listTeamMembers(organizationId: string) {
  return queryWithDemoFallback(
    async (client) => {
      const rows = await client.organizationMember.findMany({
        where: { organizationId },
        include: { user: true },
        orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      })
      return rows.map(mapTeamMember)
    },
    () =>
      demoUsers.map(
        (user): TeamMember => ({
          id: `${user.id}-membership`,
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role as TeamMember['role'],
          createdAt: new Date(0).toISOString(),
        }),
      ),
    'team members',
  )
}

export async function listTeamInvites(organizationId: string) {
  return queryWithDemoFallback<TeamInvite[]>(
    async (client) => {
      const rows = await client.organizationInvite.findMany({
        where: { organizationId },
        include: { invitedBy: true },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      })
      return rows.map(mapTeamInvite)
    },
    () => [
      {
        id: 'invite-demo-viewer',
        email: 'sam@northstar.dev',
        role: 'viewer',
        status: 'pending',
        inviteUrl: undefined,
        invitedBy: 'Maya Chen',
        expiresAt: '2026-05-07T08:00:00.000Z',
        createdAt: '2026-04-30T08:00:00.000Z',
      } satisfies TeamInvite,
    ],
    'team invites',
  )
}

export async function getApiKeyCount(organizationId: string) {
  return queryWithDemoFallback(
    async (client) => client.apiKey.count({ where: { organizationId } }),
    () => 1,
    'api key count',
  )
}

export type NavAttentionCounts = {
  pendingApprovals: number
  highRiskOpen: number
}

/**
 * Cheap aggregate counts for the persistent nav "attention" badges. Two indexed
 * COUNT queries (no row payload), so it is safe to read from the shell layout on
 * every authenticated page. Mirrors the dashboard's pending-approval and
 * high-risk definitions.
 */
export async function getNavAttentionCounts(
  organizationId: string,
): Promise<NavAttentionCounts> {
  return queryWithDemoFallback(
    async (client) => {
      const [pendingApprovals, highRiskOpen] = await Promise.all([
        client.pullRequest.count({
          where: { organizationId, approvalStatus: 'pending' },
        }),
        client.pullRequest.count({
          where: {
            organizationId,
            riskLevel: {
              in: ['high', 'critical'] as PullRequest['riskLevel'][],
            },
          },
        }),
      ])
      return { pendingApprovals, highRiskOpen }
    },
    () => ({
      pendingApprovals: demoPullRequests.filter(
        (pr) => pr.approvalStatus === 'pending',
      ).length,
      highRiskOpen: demoPullRequests.filter(
        (pr) => pr.riskLevel === 'high' || pr.riskLevel === 'critical',
      ).length,
    }),
    'nav attention counts',
  )
}

export async function listPullRequests(
  organizationId: string,
  filters: PullRequestFilters = {},
) {
  return queryWithDemoFallback(
    async (client) => {
      const assigneeId = dbFilterValue(filters.assigneeId)
      const rows = await client.pullRequest.findMany({
        where: {
          organizationId,
          repositoryId: dbFilterValue(filters.repositoryId),
          riskLevel: dbFilterValue(filters.riskLevel) as
            | PullRequest['riskLevel']
            | undefined,
          agentSource: dbFilterValue(filters.agentSource) as
            | PullRequest['agentSource']
            | undefined,
          approvalStatus: dbFilterValue(filters.approvalStatus) as
            | PullRequest['approvalStatus']
            | undefined,
          assignedReviewerId: assigneeId === 'unassigned' ? null : assigneeId,
        },
        include: pullRequestListInclude,
        orderBy: { updatedAt: 'desc' },
        take: PR_LIST_LIMIT,
      })
      return applyPullRequestFilters(rows.map(mapPullRequest), filters)
    },
    () => applyPullRequestFilters(demoPullRequests, filters),
    'pull requests',
  )
}

// Repository-scoped reads keep the detail relations: the rules page previews
// rule matches against recent PR files and risk signals.
export async function getRepositoryPullRequests(
  organizationId: string,
  repositoryId: string,
) {
  return queryWithDemoFallback(
    async (client) => {
      const rows = await client.pullRequest.findMany({
        where: { organizationId, repositoryId },
        include: pullRequestDetailInclude,
        orderBy: { updatedAt: 'desc' },
        take: REPOSITORY_PR_DETAIL_LIMIT,
      })
      return rows.map(mapPullRequest)
    },
    () => getDemoRepositoryPullRequests(repositoryId),
    'repository pull requests',
  )
}

export async function getPullRequest(organizationId: string, id: string) {
  return queryWithDemoFallback(
    async (client) => {
      const row = await client.pullRequest.findFirst({
        where: { id, organizationId },
        include: pullRequestDetailInclude,
      })
      return row ? mapPullRequest(row) : null
    },
    () => getDemoPullRequest(id) ?? null,
    'pull request detail',
  )
}

export async function listActivityEvents(
  organizationId: string,
  filters: ActivityFilters = {},
) {
  return queryWithDemoFallback(
    async (client) => {
      const rows = await client.agentActivity.findMany({
        where: {
          organizationId,
          repositoryId: dbFilterValue(filters.repositoryId),
          pullRequestId: dbFilterValue(filters.pullRequestId),
          agentSource: dbFilterValue(filters.agentSource) as
            | ActivityEvent['agentSource']
            | undefined,
          eventType: dbFilterValue(filters.eventType) as
            | ActivityEvent['eventType']
            | undefined,
        },
        include: { repository: true, pullRequest: true },
        orderBy: { timestamp: 'desc' },
        // The free-text query still filters in memory, so it scans a bounded
        // window of the most recent rows instead of the whole table.
        take: normalizeFilter(filters.query)
          ? Math.max(filters.take ?? 0, IN_MEMORY_FILTER_SCAN_LIMIT)
          : (filters.take ?? IN_MEMORY_FILTER_SCAN_LIMIT),
      })
      return applyActivityFilters(rows.map(mapActivityEvent), filters)
    },
    () => applyActivityFilters(demoActivityEvents, filters),
    'activity events',
  )
}

export async function listGitHubWebhookDiagnostics(
  organizationId: string,
  take = 8,
) {
  return queryWithDemoFallback(
    async (client) => {
      const rows = await client.gitHubWebhookDelivery.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take,
      })
      return rows.map(mapGitHubWebhookDiagnostic)
    },
    () => [],
    'GitHub webhook diagnostics',
  )
}

export async function listAuditEvents(
  organizationId: string,
  filters: AuditEventFilters = {},
) {
  return queryWithDemoFallback(
    async (client) => {
      const lowerBound =
        filters.from && filters.since
          ? new Date(Math.max(filters.from.getTime(), filters.since.getTime()))
          : (filters.from ?? filters.since)
      const actor = dbFilterValue(filters.actor)
      // Free-text query, PR number, and metadata severity still filter in
      // memory, so they scan a bounded window of the most recent rows; the
      // requested limit is pushed down when they are absent.
      const limitInDatabase =
        !normalizeFilter(filters.query) &&
        !dbFilterValue(filters.pullRequestNumber) &&
        !dbFilterValue(filters.severity)
      const rows = await client.auditEvent.findMany({
        where: {
          organizationId,
          repositoryId: dbFilterValue(filters.repositoryId),
          pullRequestId: dbFilterValue(filters.pullRequestId),
          eventType: dbFilterValue(filters.eventType) as
            | AuditEvent['eventType']
            | undefined,
          actor: actor ? { equals: actor, mode: 'insensitive' } : undefined,
          createdAt:
            lowerBound || filters.to
              ? { gte: lowerBound, lte: filters.to }
              : undefined,
        },
        include: { repository: true, pullRequest: true },
        orderBy: { createdAt: 'desc' },
        take: limitInDatabase
          ? (filters.take ?? IN_MEMORY_FILTER_SCAN_LIMIT)
          : Math.max(filters.take ?? 0, IN_MEMORY_FILTER_SCAN_LIMIT),
      })
      return applyAuditEventFilters(rows.map(mapAuditEvent), filters)
    },
    () =>
      applyAuditEventFilters(
        demoAuditEvents.filter((event) => {
          if (filters.repositoryId) {
            const repository = getDemoRepository(filters.repositoryId)
            if (repository && event.repositoryName !== repository.name)
              return false
          }
          if (filters.pullRequestId) {
            const pullRequest = getDemoPullRequest(filters.pullRequestId)
            if (
              pullRequest &&
              (event.pullRequestNumber !== pullRequest.number ||
                event.repositoryName !== pullRequest.repositoryName)
            ) {
              return false
            }
          }
          if (filters.since && new Date(event.createdAt) < filters.since)
            return false
          return true
        }),
        filters,
      ),
    'audit events',
  )
}

export async function listAuditExports(organizationId: string, take = 8) {
  return queryWithDemoFallback(
    async (client) => {
      const rows = await client.auditExport.findMany({
        where: { organizationId },
        include: { createdBy: true },
        orderBy: { createdAt: 'desc' },
        take,
      })
      return rows.map(mapAuditExport)
    },
    () => [],
    'audit exports',
  )
}
