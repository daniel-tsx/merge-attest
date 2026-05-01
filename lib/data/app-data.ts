import { organization as demoOrganization } from '@/lib/demo-data'
import {
  activityEvents as demoActivityEvents,
  auditEvents as demoAuditEvents,
  trendData as demoTrendData,
  getPullRequest as getDemoPullRequest,
  getRepository as getDemoRepository,
  getRepositoryPullRequests as getDemoRepositoryPullRequests,
  getRepositoryRules as getDemoRepositoryRules,
  pullRequests as demoPullRequests,
  repositories as demoRepositories,
  users as demoUsers,
} from '@/lib/demo-data'
import { isProduction } from '@/lib/env'
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
  AuditExport,
  AuditEvent,
  PlanKey,
  PullRequest,
  PullRequestFileInput,
  Repository,
  RepoRule,
  RiskSignal,
} from '@/lib/types'

export type TeamInvite = {
  id: string
  email: string
  role: TeamMember['role']
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  token: string
  inviteUrl: string
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
  branch: string
  baseBranch: string
  status: string
  aiAssisted: boolean | null
  agentSource: string
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
  files: Array<{
    path: string
    additions: number
    deletions: number
    changeType: string
  }>
  riskSignals: Array<{
    key: string
    label: string
    score: number
    level: string
    filePaths: unknown
  }>
  testGapAnalysis: {
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
  comments: Array<{
    id: string
    body: string
    createdAt: Date
    author: { name: string; email: string } | null
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

function applyRepositoryFilters(
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

function buildTrendData(
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
  if (!client) return fallback()

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
  } | null,
): OrganizationContext {
  if (!row) {
    return {
      id: demoOrganization.id,
      name: demoOrganization.name,
      slug: demoOrganization.slug,
      planKey: demoOrganization.planKey,
      githubInstallationId: 'demo-installation',
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
    role: 'owner',
    dataMode: 'live',
  }
}

export async function getCurrentOrganization(): Promise<OrganizationContext> {
  const sessionOrganization = await ensureCurrentUserOrganization()
  if (sessionOrganization) {
    return {
      id: sessionOrganization.id,
      name: sessionOrganization.name,
      slug: sessionOrganization.slug,
      planKey: sessionOrganization.planKey,
      githubInstallationId: sessionOrganization.githubInstallationId,
      role: sessionOrganization.role,
      dataMode: 'live',
    }
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
}

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
    token: row.token,
    inviteUrl: `/api/team/invites/accept?token=${row.token}`,
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
    branch: row.branch,
    baseBranch: row.baseBranch,
    status: row.status as PullRequest['status'],
    aiAssisted: row.aiAssisted,
    agentSource: row.agentSource as PullRequest['agentSource'],
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
    files: row.files.map(
      (file): PullRequestFileInput => ({
        path: file.path,
        additions: file.additions,
        deletions: file.deletions,
        changeType: file.changeType as PullRequestFileInput['changeType'],
      }),
    ),
    riskSignals: row.riskSignals.map(
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
    comments: row.comments.map((comment) => ({
      id: comment.id,
      author:
        comment.author?.name ?? comment.author?.email ?? 'Unknown teammate',
      body: comment.body,
      createdAt: toIso(comment.createdAt),
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

const pullRequestInclude = {
  repository: true,
  assignedReviewer: true,
  files: true,
  riskSignals: true,
  testGapAnalysis: { include: { suggestions: true } },
  ruleViolations: { include: { rule: true } },
  approvals: { include: { reviewer: true } },
  comments: {
    include: { author: true },
    orderBy: { createdAt: 'desc' as const },
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
        token: 'demo-invite-token',
        inviteUrl: '/api/team/invites/accept?token=demo-invite-token',
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

export async function listPullRequests(
  organizationId: string,
  filters: PullRequestFilters = {},
) {
  return queryWithDemoFallback(
    async (client) => {
      const rows = await client.pullRequest.findMany({
        where: { organizationId },
        include: pullRequestInclude,
        orderBy: { updatedAt: 'desc' },
      })
      return applyPullRequestFilters(rows.map(mapPullRequest), filters)
    },
    () => applyPullRequestFilters(demoPullRequests, filters),
    'pull requests',
  )
}

export async function getRepositoryPullRequests(
  organizationId: string,
  repositoryId: string,
) {
  return queryWithDemoFallback(
    async (client) => {
      const rows = await client.pullRequest.findMany({
        where: { organizationId, repositoryId },
        include: pullRequestInclude,
        orderBy: { updatedAt: 'desc' },
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
        include: pullRequestInclude,
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
          repositoryId: filters.repositoryId,
          pullRequestId: filters.pullRequestId,
        },
        include: { repository: true, pullRequest: true },
        orderBy: { timestamp: 'desc' },
      })
      return applyActivityFilters(rows.map(mapActivityEvent), filters)
    },
    () => applyActivityFilters(demoActivityEvents, filters),
    'activity events',
  )
}

export async function getDashboardTrendData(organizationId: string) {
  return queryWithDemoFallback(
    async (client) => {
      const rows = await client.pullRequest.findMany({
        where: { organizationId },
        include: pullRequestInclude,
        orderBy: { updatedAt: 'desc' },
      })
      const pullRequests = rows.map(mapPullRequest)
      return pullRequests.length ? buildTrendData(pullRequests) : []
    },
    () => demoTrendData,
    'dashboard trend data',
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
      const rows = await client.auditEvent.findMany({
        where: {
          organizationId,
          repositoryId: filters.repositoryId,
          pullRequestId: filters.pullRequestId,
          eventType: filters.eventType as AuditEvent['eventType'] | undefined,
          actor: filters.actor,
          createdAt:
            lowerBound || filters.to
              ? { gte: lowerBound, lte: filters.to }
              : undefined,
        },
        include: { repository: true, pullRequest: true },
        orderBy: { createdAt: 'desc' },
        take:
          filters.query ||
          filters.pullRequestNumber ||
          filters.severity ||
          filters.eventType
            ? undefined
            : filters.take,
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
