import { calculateRisk } from '@/lib/risk'
import { evaluateRepoRules } from '@/lib/rules'
import {
  attributeAgent,
  type AttributionCommit,
} from '@/lib/agents/attribution'
import { defaultReviewDueAt } from '@/lib/collaboration'
import { detectTestGap } from '@/lib/test-gap'
import {
  getGitHubPullRequest,
  listGitHubPullRequestCommits,
  listGitHubPullRequestFiles,
  listGitHubPullRequests,
  listInstallationRepositories,
  publishAgentGateCheckRun,
} from '@/lib/github'
import { canConsume, getPlanEntitlements } from '@/lib/entitlements'
import { getPrismaClient } from '@/lib/prisma'
import { enqueueAiReviewJob } from '@/lib/jobs/pr-review-lifecycle'
import {
  getCurrentUsagePeriod,
  getPrCheckUsage,
  PR_CHECKS_METRIC,
  recordPrChecks,
} from '@/lib/usage'
import type {
  AgentIdentityRule,
  ApprovalStatus,
  PlanKey,
  PullRequestFileInput,
  RepoRule,
} from '@/lib/types'

type GitHubPullRequestCommit = {
  commit?: {
    message?: string | null
    author?: { email?: string | null } | null
    committer?: { email?: string | null } | null
  } | null
  author?: { login?: string | null } | null
}

type GitHubOwner = {
  login: string
  id?: number
}

type GitHubRepository = {
  id: number
  node_id?: string
  name: string
  full_name?: string
  html_url?: string
  private?: boolean
  default_branch?: string
  owner: GitHubOwner
}

type GitHubPullRequest = {
  id: number
  node_id?: string
  html_url?: string
  number: number
  title: string
  state: 'open' | 'closed'
  merged_at?: string | null
  user?: { login?: string | null } | null
  head: { ref: string; sha: string }
  base: { ref: string }
}

type GitHubPullRequestFile = {
  filename: string
  additions: number
  deletions: number
  status: string
}

type SyncSummary = {
  mode: 'demo' | 'live'
  message: string
  repositoriesSynced: number
  pullRequestsSynced: number
}

export type BackfillSummary = SyncSummary & {
  repositoriesChecked: number
}

export function inferAgentSource(input: {
  author?: string | null
  title?: string
  branch?: string
}) {
  const value =
    `${input.author ?? ''} ${input.title ?? ''} ${input.branch ?? ''}`.toLowerCase()

  if (value.includes('cursor')) return 'cursor' as const
  if (value.includes('codex')) return 'codex' as const
  if (value.includes('claude')) return 'claude_code' as const
  if (value.includes('copilot')) return 'copilot' as const
  if (value.includes('devin')) return 'devin' as const
  if (
    value.includes('agent/') ||
    value.includes('-bot') ||
    value.includes('[ai]')
  )
    return 'unknown' as const

  return 'manual' as const
}

export function inferAiAssisted(input: {
  author?: string | null
  title?: string
  branch?: string
}) {
  return inferAgentSource(input) !== 'manual'
}

export function mapGitHubPullRequestFile(
  file: GitHubPullRequestFile,
): PullRequestFileInput {
  const changeType =
    file.status === 'added'
      ? 'added'
      : file.status === 'removed'
        ? 'deleted'
        : file.status === 'renamed'
          ? 'renamed'
          : 'modified'

  return {
    path: file.filename,
    additions: file.additions,
    deletions: file.deletions,
    changeType,
  }
}

function mapPullRequestStatus(pr: GitHubPullRequest) {
  if (pr.state === 'open') return 'open' as const
  return pr.merged_at ? ('merged' as const) : ('closed' as const)
}

function mapRules(
  rows: Array<{
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
  }>,
): RepoRule[] {
  return rows.map((rule) => ({
    id: rule.id,
    repositoryId: rule.repositoryId,
    name: rule.name,
    description: rule.description,
    enabled: rule.enabled,
    triggerType: rule.triggerType as RepoRule['triggerType'],
    actionType: rule.actionType as RepoRule['actionType'],
    severity: rule.severity as RepoRule['severity'],
    branchPattern: rule.branchPattern ?? undefined,
    pathPattern: rule.pathPattern ?? undefined,
    labelPattern: rule.labelPattern ?? undefined,
    agentSource: (rule.agentSource as RepoRule['agentSource']) ?? undefined,
    minimumRiskLevel:
      (rule.minimumRiskLevel as RepoRule['minimumRiskLevel']) ?? undefined,
    codeOwnerHint: rule.codeOwnerHint ?? undefined,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  }))
}

function mapAttributionCommits(
  rows: GitHubPullRequestCommit[],
): AttributionCommit[] {
  return rows.map((row) => ({
    message: row.commit?.message ?? null,
    authorEmail: row.commit?.author?.email ?? null,
    committerEmail: row.commit?.committer?.email ?? null,
    authorLogin: row.author?.login ?? null,
  }))
}

async function loadAgentIdentityRules(
  organizationId: string,
): Promise<AgentIdentityRule[]> {
  const prisma = getPrismaClient()
  if (!prisma) return []
  const rows = await prisma.agentIdentityRule.findMany({
    where: { organizationId, enabled: true },
  })
  return rows.map((row) => ({
    id: row.id,
    agentSource: row.agentSource as AgentIdentityRule['agentSource'],
    matchType: row.matchType as AgentIdentityRule['matchType'],
    pattern: row.pattern,
    enabled: row.enabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }))
}

export function getPrCheckSourceKey(input: {
  repositoryId: string
  pullNumber: number
  headSha: string
}) {
  return `${input.repositoryId}:${input.pullNumber}:${input.headSha}`
}

export function shouldPublishGitHubCheckRun(planKey: PlanKey) {
  return getPlanEntitlements(planKey).features.githubComments
}

export function getNextApprovalState(input: {
  existing?: {
    headSha: string | null
    approvalStatus: ApprovalStatus
    reviewDueAt: Date | null
  } | null
  headSha: string
  requiresApproval: boolean
  fallbackReviewDueAt: Date
}) {
  const existingApprovalStatus = input.existing?.approvalStatus
  const shouldPreserveDecision =
    input.existing?.headSha === input.headSha &&
    (existingApprovalStatus === 'approved' ||
      existingApprovalStatus === 'rejected' ||
      existingApprovalStatus === 'risk_accepted')
  const approvalStatus: ApprovalStatus = shouldPreserveDecision
    ? (existingApprovalStatus ?? 'pending')
    : input.requiresApproval
      ? 'pending'
      : 'not_required'
  const reviewDueAt =
    approvalStatus === 'pending'
      ? (input.existing?.reviewDueAt ?? input.fallbackReviewDueAt)
      : null

  return { approvalStatus, reviewDueAt }
}

async function canRunPrCheck(organizationId: string, sourceKey: string) {
  const prisma = getPrismaClient()
  if (!prisma) return false

  const { periodStart } = getCurrentUsagePeriod()
  const existingCheck = await prisma.usageRecord.findUnique({
    where: {
      organizationId_metric_periodStart_sourceKey: {
        organizationId,
        metric: PR_CHECKS_METRIC,
        periodStart,
        sourceKey,
      },
    },
  })
  if (existingCheck) return true

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { planKey: true },
  })
  if (!organization) return false

  const entitlements = getPlanEntitlements(organization.planKey as PlanKey)
  const used = await getPrCheckUsage(organizationId)
  return canConsume(entitlements.prCheckLimit, used, 1)
}

async function syncGitHubPullRequestRecord(input: {
  organizationId: string
  installationId: string
  repositoryId: string
  owner: string
  name: string
  pullRequest: GitHubPullRequest
  githubDeliveryId?: string | null
}) {
  const prisma = getPrismaClient()
  if (!prisma) return false
  const usageSourceKey = getPrCheckSourceKey({
    repositoryId: input.repositoryId,
    pullNumber: input.pullRequest.number,
    headSha: input.pullRequest.head.sha,
  })
  if (!(await canRunPrCheck(input.organizationId, usageSourceKey))) return false

  const rawFiles = ((await listGitHubPullRequestFiles({
    owner: input.owner,
    name: input.name,
    pullNumber: input.pullRequest.number,
    installationId: input.installationId,
  })) ?? []) as GitHubPullRequestFile[]
  const files = rawFiles.map(mapGitHubPullRequestFile)
  const rules = mapRules(
    await prisma.repoRule.findMany({
      where: {
        organizationId: input.organizationId,
        repositoryId: input.repositoryId,
        enabled: true,
      },
    }),
  )
  const author = input.pullRequest.user?.login ?? 'unknown'
  const commits = mapAttributionCommits(
    ((await listGitHubPullRequestCommits({
      owner: input.owner,
      name: input.name,
      pullNumber: input.pullRequest.number,
      installationId: input.installationId,
    })) ?? []) as GitHubPullRequestCommit[],
  )
  const registry = await loadAgentIdentityRules(input.organizationId)
  const attribution = attributeAgent({
    author,
    title: input.pullRequest.title,
    branch: input.pullRequest.head.ref,
    commits,
    registry,
  })
  const { agentSource, aiAssisted } = attribution
  const risk = calculateRisk({ aiAssisted, ciStatus: 'unknown', files })
  const testGap = detectTestGap({ title: input.pullRequest.title, files })
  const violations = evaluateRepoRules(rules, {
    aiAssisted,
    riskLevel: risk.level,
    ciStatus: 'unknown',
    testGapStatus: testGap.status,
    riskSignals: risk.signals,
    branch: input.pullRequest.head.ref,
    agentSource,
    files,
    labels: [],
  })
  const existing = await prisma.pullRequest.findUnique({
    where: {
      repositoryId_number: {
        repositoryId: input.repositoryId,
        number: input.pullRequest.number,
      },
    },
    select: {
      id: true,
      headSha: true,
      approvalStatus: true,
      reviewDueAt: true,
    },
  })
  const requiresApproval =
    violations.some(
      (violation) =>
        violation.actionType === 'require_approval' ||
        violation.actionType === 'request_security_review' ||
        violation.actionType === 'request_tests' ||
        violation.actionType === 'block_merge',
    ) ||
    risk.score >= 50 ||
    aiAssisted
  const nextApprovalState = getNextApprovalState({
    existing,
    headSha: input.pullRequest.head.sha,
    requiresApproval,
    fallbackReviewDueAt: defaultReviewDueAt(risk.level),
  })

  const savedPullRequest = await prisma.pullRequest.upsert({
    where: {
      repositoryId_number: {
        repositoryId: input.repositoryId,
        number: input.pullRequest.number,
      },
    },
    create: {
      number: input.pullRequest.number,
      title: input.pullRequest.title,
      author,
      githubPullRequestId: String(input.pullRequest.id),
      githubNodeId: input.pullRequest.node_id,
      url: input.pullRequest.html_url,
      headSha: input.pullRequest.head.sha,
      branch: input.pullRequest.head.ref,
      baseBranch: input.pullRequest.base.ref,
      status: mapPullRequestStatus(input.pullRequest),
      aiAssisted,
      agentSource,
      attributionConfidence: attribution.confidence,
      attributionEvidence: attribution.evidence,
      riskScore: risk.score,
      riskLevel: risk.level,
      testGapStatus: testGap.status,
      ciStatus: 'unknown',
      approvalStatus: nextApprovalState.approvalStatus,
      reviewDueAt: nextApprovalState.reviewDueAt,
      filesChangedCount: files.length,
      linesAdded: files.reduce((sum, file) => sum + file.additions, 0),
      linesDeleted: files.reduce((sum, file) => sum + file.deletions, 0),
      repositoryId: input.repositoryId,
      organizationId: input.organizationId,
    },
    update: {
      title: input.pullRequest.title,
      author,
      githubPullRequestId: String(input.pullRequest.id),
      githubNodeId: input.pullRequest.node_id,
      url: input.pullRequest.html_url,
      headSha: input.pullRequest.head.sha,
      branch: input.pullRequest.head.ref,
      baseBranch: input.pullRequest.base.ref,
      status: mapPullRequestStatus(input.pullRequest),
      aiAssisted,
      agentSource,
      attributionConfidence: attribution.confidence,
      attributionEvidence: attribution.evidence,
      riskScore: risk.score,
      riskLevel: risk.level,
      testGapStatus: testGap.status,
      ciStatus: 'unknown',
      approvalStatus: nextApprovalState.approvalStatus,
      reviewDueAt: nextApprovalState.reviewDueAt,
      filesChangedCount: files.length,
      linesAdded: files.reduce((sum, file) => sum + file.additions, 0),
      linesDeleted: files.reduce((sum, file) => sum + file.deletions, 0),
    },
  })

  await prisma.pullRequestFile.deleteMany({
    where: { pullRequestId: savedPullRequest.id },
  })
  await prisma.riskSignal.deleteMany({
    where: { pullRequestId: savedPullRequest.id },
  })
  await prisma.ruleViolation.deleteMany({
    where: { pullRequestId: savedPullRequest.id },
  })
  await prisma.testGapAnalysis.deleteMany({
    where: { pullRequestId: savedPullRequest.id },
  })

  if (files.length) {
    await prisma.pullRequestFile.createMany({
      data: files.map((file) => ({
        path: file.path,
        additions: file.additions,
        deletions: file.deletions,
        changeType: file.changeType,
        pullRequestId: savedPullRequest.id,
      })),
    })
  }

  if (risk.signals.length) {
    await prisma.riskSignal.createMany({
      data: risk.signals.map((signal) => ({
        key: signal.key,
        label: signal.label,
        score: signal.score,
        level: signal.level,
        filePaths: signal.filePaths,
        pullRequestId: savedPullRequest.id,
      })),
    })
  }

  await prisma.testGapAnalysis.create({
    data: {
      status: testGap.status,
      summary: testGap.summary,
      affectedFiles: testGap.affectedFiles,
      confidence: testGap.confidence,
      pullRequestId: savedPullRequest.id,
      suggestions: {
        create: testGap.suggestedTestFiles.map((testFile, index) => ({
          testFile,
          testCase:
            testGap.suggestedTestCases[index] ??
            testGap.suggestedTestCases[0] ??
            'Add focused coverage.',
        })),
      },
    },
  })

  for (const violation of violations) {
    const rule = rules.find((item) => `violation-${item.id}` === violation.id)
    if (!rule) continue

    await prisma.ruleViolation.create({
      data: {
        summary: violation.summary,
        resolved: false,
        ruleId: rule.id,
        pullRequestId: savedPullRequest.id,
      },
    })
  }

  await prisma.auditEvent.create({
    data: {
      eventType: existing ? 'risk_score_calculated' : 'pr_synced',
      actor: 'AgentGate',
      summary: existing
        ? `GitHub pull request #${input.pullRequest.number} resynced`
        : `Imported GitHub pull request #${input.pullRequest.number}`,
      metadata: { riskScore: risk.score, riskLevel: risk.level },
      organizationId: input.organizationId,
      repositoryId: input.repositoryId,
      pullRequestId: savedPullRequest.id,
    },
  })

  await enqueueAiReviewJob({
    organizationId: input.organizationId,
    repositoryId: input.repositoryId,
    pullRequestId: savedPullRequest.id,
    pullNumber: input.pullRequest.number,
    headSha: input.pullRequest.head.sha,
    githubDeliveryId: input.githubDeliveryId,
  })

  const recordedUsage = await recordPrChecks(
    input.organizationId,
    1,
    new Date(),
    usageSourceKey,
  )
  if (recordedUsage) {
    await prisma.repository.update({
      where: { id: input.repositoryId },
      data: { monthlyPrCheckUsage: { increment: 1 } },
    })
  }

  const organization = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    select: { planKey: true },
  })

  if (
    !organization ||
    !shouldPublishGitHubCheckRun(organization.planKey as PlanKey)
  ) {
    return true
  }

  try {
    const checkRun = await publishAgentGateCheckRun({
      number: input.pullRequest.number,
      repositoryName: input.name,
      owner: input.owner,
      installationId: input.installationId,
      headSha: input.pullRequest.head.sha,
      checkRunId: savedPullRequest.githubAgentGateCheckRunId,
      riskScore: risk.score,
      riskLevel: risk.level,
      testGapStatus: testGap.status,
      ciStatus: 'unknown',
      approvalStatus: nextApprovalState.approvalStatus,
    })

    if (checkRun.mode === 'live') {
      if (checkRun.checkRunId !== savedPullRequest.githubAgentGateCheckRunId) {
        await prisma.pullRequest.update({
          where: { id: savedPullRequest.id },
          data: { githubAgentGateCheckRunId: checkRun.checkRunId },
        })
      }

      await prisma.auditEvent.create({
        data: {
          eventType: 'github_check_run_published',
          actor: 'AgentGate',
          summary: `${checkRun.action === 'updated' ? 'Updated' : 'Created'} AgentGate check run for #${input.pullRequest.number}`,
          metadata: {
            action: checkRun.action,
            checkRunId: checkRun.checkRunId,
            conclusion: checkRun.conclusion,
          },
          organizationId: input.organizationId,
          repositoryId: input.repositoryId,
          pullRequestId: savedPullRequest.id,
        },
      })
    }
  } catch (error) {
    console.warn('Pull request synced but AgentGate check run failed.', error)
  }

  return true
}

async function syncPullRequestsForRepository(input: {
  organizationId: string
  installationId: string
  repositoryId: string
  owner: string
  name: string
}) {
  const prisma = getPrismaClient()
  if (!prisma) return 0

  const pullRequests = ((await listGitHubPullRequests({
    owner: input.owner,
    name: input.name,
    installationId: input.installationId,
  })) ?? []) as GitHubPullRequest[]

  let synced = 0

  for (const pullRequest of pullRequests) {
    const syncedPullRequest = await syncGitHubPullRequestRecord({
      ...input,
      pullRequest,
    })
    if (syncedPullRequest) synced += 1
  }

  return synced
}

export async function syncGitHubPullRequest(input: {
  organizationId: string
  installationId: string
  repositoryId: string
  owner: string
  name: string
  pullNumber: number
  githubDeliveryId?: string | null
}) {
  const pullRequest = (await getGitHubPullRequest({
    owner: input.owner,
    name: input.name,
    pullNumber: input.pullNumber,
    installationId: input.installationId,
  })) as GitHubPullRequest | null

  if (!pullRequest) return false
  return syncGitHubPullRequestRecord({ ...input, pullRequest })
}

export async function syncGitHubRepository(
  repositoryId: string,
  organizationId: string,
): Promise<SyncSummary> {
  const prisma = getPrismaClient()
  if (!prisma) {
    return {
      mode: 'demo',
      message:
        'Database is not configured; repository sync is unavailable in demo mode.',
      repositoriesSynced: 0,
      pullRequestsSynced: 0,
    }
  }

  const repository = await prisma.repository.findFirst({
    where: { id: repositoryId, organizationId },
    include: { organization: true },
  })
  if (!repository?.organization.githubInstallationId) {
    return {
      mode: 'demo',
      message: 'Connect a GitHub installation before syncing this repository.',
      repositoriesSynced: 0,
      pullRequestsSynced: 0,
    }
  }

  const pullRequestsSynced = await syncPullRequestsForRepository({
    organizationId,
    installationId: repository.organization.githubInstallationId,
    repositoryId: repository.id,
    owner: repository.owner,
    name: repository.name,
  })

  await prisma.repository.update({
    where: { id: repository.id },
    data: {
      connectedStatus: 'connected',
      lastSyncedAt: new Date(),
    },
  })

  return {
    mode: 'live',
    message: `Synced ${pullRequestsSynced} open pull requests from GitHub.`,
    repositoriesSynced: 1,
    pullRequestsSynced,
  }
}

export async function syncGitHubInstallation(
  organizationId: string,
): Promise<SyncSummary> {
  const prisma = getPrismaClient()
  if (!prisma) {
    return {
      mode: 'demo',
      message:
        'Database is not configured; GitHub sync is unavailable in demo mode.',
      repositoriesSynced: 0,
      pullRequestsSynced: 0,
    }
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  })
  if (!organization?.githubInstallationId) {
    return {
      mode: 'demo',
      message: 'Connect a GitHub installation before syncing repositories.',
      repositoriesSynced: 0,
      pullRequestsSynced: 0,
    }
  }

  const repositories = ((await listInstallationRepositories(
    organization.githubInstallationId,
  )) ?? []) as GitHubRepository[]
  const entitlements = getPlanEntitlements(organization.planKey as PlanKey)
  let repositoryCount = await prisma.repository.count({
    where: { organizationId },
  })
  let repositoriesSynced = 0
  let pullRequestsSynced = 0

  for (const repository of repositories) {
    const existing = await prisma.repository.findFirst({
      where: {
        organizationId,
        OR: [
          { githubRepositoryId: String(repository.id) },
          { owner: repository.owner.login, name: repository.name },
        ],
      },
      select: { id: true },
    })
    if (
      !existing &&
      !canConsume(entitlements.repositoryLimit, repositoryCount, 1)
    )
      continue

    const savedRepository = existing
      ? await prisma.repository.update({
          where: { id: existing.id },
          data: {
            name: repository.name,
            owner: repository.owner.login,
            githubRepositoryId: String(repository.id),
            githubNodeId: repository.node_id,
            url: repository.html_url,
            defaultBranch: repository.default_branch ?? 'main',
            visibility: repository.private ? 'private' : 'public',
            connectedStatus: 'connected',
            lastSyncedAt: new Date(),
            providerMetadata: {
              fullName: repository.full_name,
            },
          },
        })
      : await prisma.repository.create({
          data: {
            name: repository.name,
            provider: 'github',
            owner: repository.owner.login,
            githubRepositoryId: String(repository.id),
            githubNodeId: repository.node_id,
            url: repository.html_url,
            defaultBranch: repository.default_branch ?? 'main',
            visibility: repository.private ? 'private' : 'public',
            connectedStatus: 'connected',
            lastSyncedAt: new Date(),
            providerMetadata: {
              fullName: repository.full_name,
            },
            organizationId,
          },
        })
    if (!existing) repositoryCount += 1
    repositoriesSynced += 1

    pullRequestsSynced += await syncPullRequestsForRepository({
      organizationId,
      installationId: organization.githubInstallationId,
      repositoryId: savedRepository.id,
      owner: savedRepository.owner,
      name: savedRepository.name,
    })
  }

  return {
    mode: 'live',
    message: `Synced ${repositoriesSynced} repositories and ${pullRequestsSynced} open pull requests from GitHub.`,
    repositoriesSynced,
    pullRequestsSynced,
  }
}

export async function backfillStaleGitHubRepositories(input: {
  organizationId: string
  olderThanMinutes?: number
  limit?: number
}): Promise<BackfillSummary> {
  const prisma = getPrismaClient()
  if (!prisma) {
    return {
      mode: 'demo',
      message:
        'Database is not configured; GitHub backfill is unavailable in demo mode.',
      repositoriesChecked: 0,
      repositoriesSynced: 0,
      pullRequestsSynced: 0,
    }
  }

  const organization = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    select: { githubInstallationId: true },
  })
  if (!organization?.githubInstallationId) {
    return {
      mode: 'demo',
      message: 'Connect a GitHub installation before running backfill.',
      repositoriesChecked: 0,
      repositoriesSynced: 0,
      pullRequestsSynced: 0,
    }
  }

  const staleBefore = new Date(
    Date.now() - (input.olderThanMinutes ?? 60) * 60_000,
  )
  const repositories = await prisma.repository.findMany({
    where: {
      organizationId: input.organizationId,
      connectedStatus: 'connected',
      OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: staleBefore } }],
    },
    orderBy: [{ lastSyncedAt: 'asc' }, { updatedAt: 'asc' }],
    take: input.limit ?? 25,
  })

  let repositoriesSynced = 0
  let pullRequestsSynced = 0

  for (const repository of repositories) {
    const result = await syncGitHubRepository(
      repository.id,
      input.organizationId,
    )
    if (result.mode !== 'live') continue

    repositoriesSynced += result.repositoriesSynced
    pullRequestsSynced += result.pullRequestsSynced
  }

  return {
    mode: 'live',
    message: `Backfilled ${repositoriesSynced} stale repositories and ${pullRequestsSynced} pull requests.`,
    repositoriesChecked: repositories.length,
    repositoriesSynced,
    pullRequestsSynced,
  }
}
