import { getPrismaClient } from '@/lib/prisma'
import { reportError } from '@/lib/observability'
import {
  syncGitHubInstallation,
  syncGitHubPullRequest,
} from '@/lib/github-sync'
import type { CiStatus } from '@/lib/types'

type WebhookRepository = {
  id?: number
  node_id?: string
  name?: string
  full_name?: string
  html_url?: string
  private?: boolean
  default_branch?: string
  owner?: { login?: string; id?: number }
}

type WebhookPullRequest = {
  number?: number
  state?: 'open' | 'closed'
  merged?: boolean
  merged_at?: string | null
  id?: number
  node_id?: string
  html_url?: string
  title?: string
  user?: { login?: string | null } | null
  head?: { ref?: string; sha?: string }
  base?: { ref?: string }
}

type WebhookCheckPayload = {
  status?: string
  conclusion?: string | null
  head_sha?: string
  pull_requests?: Array<{ number?: number }>
}

type WebhookReview = {
  state?: string
  body?: string | null
  user?: { login?: string | null } | null
}

export type GitHubWebhookPayload = {
  action?: string
  installation?: { id?: number }
  repository?: WebhookRepository
  pull_request?: WebhookPullRequest
  review?: WebhookReview
  check_run?: WebhookCheckPayload
  check_suite?: WebhookCheckPayload
  workflow_run?: WebhookCheckPayload
}

export type WebhookProcessResult = {
  mode: 'demo' | 'live'
  received: true
  event: string
  action?: string
  duplicate?: boolean
  processed: boolean
  message: string
}

export type WebhookEnqueueResult = {
  mode: 'demo' | 'live'
  received: true
  event: string
  action?: string
  duplicate?: boolean
  queued: boolean
  deliveryId?: string
  message: string
}

export type WebhookQueueProcessResult = {
  processed: number
  failed: number
  skipped: number
}

const pullRequestSyncActions = new Set([
  'opened',
  'synchronize',
  'reopened',
  'edited',
  'ready_for_review',
])

const checkEvents = new Set(['check_run', 'check_suite', 'workflow_run'])

function retryDelayMs(attemptCount: number) {
  return Math.min(60_000 * 2 ** Math.max(0, attemptCount - 1), 15 * 60_000)
}

export function parseGitHubWebhookPayload(
  rawBody: string,
): GitHubWebhookPayload {
  const parsed = JSON.parse(rawBody) as unknown
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('GitHub webhook payload must be an object.')
  }

  return parsed as GitHubWebhookPayload
}

export function getWebhookInstallationId(payload: GitHubWebhookPayload) {
  return payload.installation?.id ? String(payload.installation.id) : null
}

export function shouldSyncPullRequestAction(action?: string) {
  return Boolean(action && pullRequestSyncActions.has(action))
}

function readRawBodyFromMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null
  }

  const rawBody = (metadata as { rawBody?: unknown }).rawBody
  return typeof rawBody === 'string' ? rawBody : null
}

export function mapGitHubCiStatus(input: {
  status?: string
  conclusion?: string | null
}): CiStatus {
  if (
    input.status === 'queued' ||
    input.status === 'in_progress' ||
    input.status === 'requested' ||
    input.status === 'waiting' ||
    input.status === 'pending'
  ) {
    return 'pending'
  }

  if (input.status === 'completed') {
    if (
      input.conclusion === 'success' ||
      input.conclusion === 'neutral' ||
      input.conclusion === 'skipped'
    ) {
      return 'passing'
    }

    if (
      input.conclusion === 'failure' ||
      input.conclusion === 'timed_out' ||
      input.conclusion === 'cancelled' ||
      input.conclusion === 'action_required' ||
      input.conclusion === 'startup_failure'
    ) {
      return 'failing'
    }
  }

  return 'unknown'
}

function pullRequestStatusFromPayload(pullRequest: WebhookPullRequest) {
  if (pullRequest.state === 'open') return 'open' as const
  return pullRequest.merged || pullRequest.merged_at
    ? ('merged' as const)
    : ('closed' as const)
}

async function ensureWebhookRepository(input: {
  organizationId: string
  repository: WebhookRepository
}) {
  const prisma = getPrismaClient()
  if (!prisma || !input.repository.name || !input.repository.owner?.login)
    return null

  const githubRepositoryId = input.repository.id
    ? String(input.repository.id)
    : undefined
  const existing = await prisma.repository.findFirst({
    where: {
      organizationId: input.organizationId,
      OR: [
        ...(githubRepositoryId ? [{ githubRepositoryId }] : []),
        { owner: input.repository.owner.login, name: input.repository.name },
      ],
    },
    select: { id: true },
  })

  if (existing) {
    return prisma.repository.update({
      where: { id: existing.id },
      data: {
        name: input.repository.name,
        owner: input.repository.owner.login,
        githubRepositoryId,
        githubNodeId: input.repository.node_id,
        url: input.repository.html_url,
        defaultBranch: input.repository.default_branch ?? 'main',
        visibility: input.repository.private ? 'private' : 'public',
        connectedStatus: 'connected',
        providerMetadata: { fullName: input.repository.full_name },
      },
    })
  }

  return prisma.repository.create({
    data: {
      name: input.repository.name,
      owner: input.repository.owner.login,
      githubRepositoryId,
      githubNodeId: input.repository.node_id,
      url: input.repository.html_url,
      defaultBranch: input.repository.default_branch ?? 'main',
      visibility: input.repository.private ? 'private' : 'public',
      connectedStatus: 'connected',
      providerMetadata: { fullName: input.repository.full_name },
      organizationId: input.organizationId,
    },
  })
}

async function updateClosedPullRequestFromPayload(input: {
  organizationId: string
  repositoryId: string
  pullRequest: WebhookPullRequest
}) {
  const prisma = getPrismaClient()
  if (!prisma || !input.pullRequest.number) return false

  const existing = await prisma.pullRequest.findUnique({
    where: {
      repositoryId_number: {
        repositoryId: input.repositoryId,
        number: input.pullRequest.number,
      },
    },
    select: { id: true },
  })

  if (!existing) return false

  await prisma.pullRequest.update({
    where: { id: existing.id },
    data: {
      title: input.pullRequest.title,
      author: input.pullRequest.user?.login ?? undefined,
      githubPullRequestId: input.pullRequest.id
        ? String(input.pullRequest.id)
        : undefined,
      githubNodeId: input.pullRequest.node_id,
      url: input.pullRequest.html_url,
      headSha: input.pullRequest.head?.sha,
      branch: input.pullRequest.head?.ref,
      baseBranch: input.pullRequest.base?.ref,
      status: pullRequestStatusFromPayload(input.pullRequest),
    },
  })

  await prisma.auditEvent.create({
    data: {
      eventType: 'pr_synced',
      actor: 'GitHub',
      summary: `GitHub pull request #${input.pullRequest.number} ${pullRequestStatusFromPayload(input.pullRequest)}`,
      metadata: { source: 'github_webhook' },
      organizationId: input.organizationId,
      repositoryId: input.repositoryId,
      pullRequestId: existing.id,
    },
  })

  return true
}

async function processPullRequestWebhook(input: {
  organizationId: string
  installationId: string
  action?: string
  payload: GitHubWebhookPayload
}) {
  if (!input.payload.repository || !input.payload.pull_request?.number) {
    return {
      processed: false,
      message: 'Pull request payload is missing repository or PR number.',
    }
  }

  const repository = await ensureWebhookRepository({
    organizationId: input.organizationId,
    repository: input.payload.repository,
  })
  if (!repository)
    return { processed: false, message: 'Repository could not be resolved.' }

  if (input.action === 'closed') {
    const processed = await updateClosedPullRequestFromPayload({
      organizationId: input.organizationId,
      repositoryId: repository.id,
      pullRequest: input.payload.pull_request,
    })
    return {
      processed,
      message: processed
        ? 'Pull request close state updated from webhook.'
        : 'Closed PR was not previously synced.',
    }
  }

  if (!shouldSyncPullRequestAction(input.action)) {
    return {
      processed: false,
      message: `Pull request action ${input.action ?? 'unknown'} does not require sync.`,
    }
  }

  const processed = await syncGitHubPullRequest({
    organizationId: input.organizationId,
    installationId: input.installationId,
    repositoryId: repository.id,
    owner: repository.owner,
    name: repository.name,
    pullNumber: input.payload.pull_request.number,
  })

  return {
    processed,
    message: processed
      ? 'Pull request synced from GitHub webhook.'
      : 'Pull request could not be synced.',
  }
}

function getCheckPayload(payload: GitHubWebhookPayload) {
  return (
    payload.check_run ?? payload.check_suite ?? payload.workflow_run ?? null
  )
}

function getCheckPullRequestNumber(payload: GitHubWebhookPayload) {
  const checkPayload = getCheckPayload(payload)
  return checkPayload?.pull_requests?.find((pullRequest) => pullRequest.number)
    ?.number
}

async function processCheckWebhook(input: {
  organizationId: string
  payload: GitHubWebhookPayload
  event: string
}) {
  if (!input.payload.repository) {
    return {
      processed: false,
      message: 'Check payload is missing repository information.',
    }
  }

  const checkPayload = getCheckPayload(input.payload)
  if (!checkPayload) {
    return { processed: false, message: 'Check payload is missing check data.' }
  }

  const repository = await ensureWebhookRepository({
    organizationId: input.organizationId,
    repository: input.payload.repository,
  })
  const prisma = getPrismaClient()
  if (!repository || !prisma) {
    return { processed: false, message: 'Repository could not be resolved.' }
  }

  const pullRequestNumber = getCheckPullRequestNumber(input.payload)
  const pullRequest = pullRequestNumber
    ? await prisma.pullRequest.findUnique({
        where: {
          repositoryId_number: {
            repositoryId: repository.id,
            number: pullRequestNumber,
          },
        },
      })
    : checkPayload.head_sha
      ? await prisma.pullRequest.findFirst({
          where: {
            repositoryId: repository.id,
            headSha: checkPayload.head_sha,
          },
          orderBy: { updatedAt: 'desc' },
        })
      : null

  if (!pullRequest) {
    return {
      processed: false,
      message: 'No synced pull request matched this check payload.',
    }
  }

  const ciStatus = mapGitHubCiStatus({
    status: checkPayload.status,
    conclusion: checkPayload.conclusion,
  })
  await prisma.pullRequest.update({
    where: { id: pullRequest.id },
    data: { ciStatus },
  })

  if (ciStatus === 'passing' || ciStatus === 'failing') {
    await prisma.agentActivity.create({
      data: {
        actor: 'GitHub Checks',
        agentSource: pullRequest.agentSource,
        eventType: ciStatus === 'passing' ? 'ci_passed' : 'ci_failed',
        summary: `${input.event.replaceAll('_', ' ')} ${ciStatus} for #${pullRequest.number}`,
        riskLevel: pullRequest.riskLevel,
        metadata: {
          status: checkPayload.status,
          conclusion: checkPayload.conclusion ?? undefined,
        },
        repositoryId: repository.id,
        pullRequestId: pullRequest.id,
        organizationId: input.organizationId,
      },
    })
  }

  return {
    processed: ciStatus !== 'unknown',
    message:
      ciStatus === 'unknown'
        ? 'Check payload did not map to a known CI status.'
        : `Updated pull request #${pullRequest.number} CI status to ${ciStatus}.`,
  }
}

async function processPullRequestReviewWebhook(input: {
  organizationId: string
  payload: GitHubWebhookPayload
}) {
  if (!input.payload.repository || !input.payload.pull_request?.number) {
    return {
      processed: false,
      message: 'Review payload is missing repository or PR number.',
    }
  }

  const state = input.payload.review?.state?.toLowerCase()
  const decision =
    state === 'approved'
      ? ('approved' as const)
      : state === 'changes_requested'
        ? ('rejected' as const)
        : null
  if (!decision) {
    return {
      processed: false,
      message: `Review state ${state ?? 'unknown'} does not change AgentGate approval status.`,
    }
  }

  const repository = await ensureWebhookRepository({
    organizationId: input.organizationId,
    repository: input.payload.repository,
  })
  const prisma = getPrismaClient()
  if (!repository || !prisma) {
    return { processed: false, message: 'Repository could not be resolved.' }
  }

  const pullRequest = await prisma.pullRequest.findUnique({
    where: {
      repositoryId_number: {
        repositoryId: repository.id,
        number: input.payload.pull_request.number,
      },
    },
  })
  if (!pullRequest) {
    return {
      processed: false,
      message: 'Reviewed pull request was not previously synced.',
    }
  }

  const actor = input.payload.review?.user?.login ?? 'GitHub reviewer'
  const approvalStatus = decision === 'approved' ? 'approved' : 'rejected'
  await prisma.pullRequest.update({
    where: { id: pullRequest.id },
    data: { approvalStatus },
  })
  await prisma.approval.create({
    data: {
      decision,
      note: input.payload.review?.body?.slice(0, 1000) ?? undefined,
      pullRequestId: pullRequest.id,
    },
  })
  await prisma.auditEvent.create({
    data: {
      eventType: decision === 'approved' ? 'pr_approved' : 'pr_rejected',
      actor,
      summary: `GitHub review ${decision.replaceAll('_', ' ')} pull request #${pullRequest.number}`,
      metadata: { source: 'github_review', state },
      organizationId: input.organizationId,
      repositoryId: repository.id,
      pullRequestId: pullRequest.id,
    },
  })
  await prisma.agentActivity.create({
    data: {
      actor,
      agentSource: pullRequest.agentSource,
      eventType: decision === 'approved' ? 'approved' : 'rejected',
      summary: `GitHub review ${decision.replaceAll('_', ' ')} #${pullRequest.number}`,
      riskLevel: pullRequest.riskLevel,
      metadata: { source: 'github_review', state },
      repositoryId: repository.id,
      pullRequestId: pullRequest.id,
      organizationId: input.organizationId,
    },
  })

  return {
    processed: true,
    message: `Applied GitHub review state to pull request #${pullRequest.number}.`,
  }
}

export async function enqueueGitHubWebhookDelivery(input: {
  deliveryId: string | null
  event: string
  rawBody: string
}): Promise<WebhookEnqueueResult> {
  const payload = parseGitHubWebhookPayload(input.rawBody)
  const action = payload.action
  const prisma = getPrismaClient()

  if (!prisma || !input.deliveryId) {
    return {
      mode: 'demo',
      received: true,
      event: input.event,
      action,
      queued: false,
      message: 'Webhook received in demo mode; persistence is unavailable.',
    }
  }

  const existingDelivery = await prisma.gitHubWebhookDelivery.findUnique({
    where: { deliveryId: input.deliveryId },
  })

  if (existingDelivery?.status === 'processed') {
    return {
      mode: 'live',
      received: true,
      event: input.event,
      action,
      duplicate: true,
      queued: false,
      deliveryId: input.deliveryId,
      message: 'Duplicate GitHub webhook delivery ignored.',
    }
  }

  if (
    existingDelivery &&
    (existingDelivery.status === 'queued' ||
      existingDelivery.status === 'processing')
  ) {
    return {
      mode: 'live',
      received: true,
      event: input.event,
      action,
      duplicate: true,
      queued: existingDelivery.status === 'queued',
      deliveryId: input.deliveryId,
      message: `GitHub webhook delivery is already ${existingDelivery.status}.`,
    }
  }

  const installationId = getWebhookInstallationId(payload)
  const organization = installationId
    ? await prisma.organization.findFirst({
        where: { githubInstallationId: installationId },
      })
    : null
  const metadata = {
    rawBody: input.rawBody,
    installationId,
    repositoryId: payload.repository?.id,
  }

  if (existingDelivery) {
    await prisma.gitHubWebhookDelivery.update({
      where: { id: existingDelivery.id },
      data: {
        event: input.event,
        action,
        status: 'queued',
        message: 'GitHub webhook delivery queued for retry.',
        metadata,
        organizationId: organization?.id,
        nextRetryAt: null,
      },
    })
  } else {
    await prisma.gitHubWebhookDelivery.create({
      data: {
        deliveryId: input.deliveryId,
        event: input.event,
        action,
        status: 'queued',
        message: 'GitHub webhook delivery queued.',
        organizationId: organization?.id,
        metadata,
      },
    })
  }

  return {
    mode: 'live',
    received: true,
    event: input.event,
    action,
    queued: true,
    deliveryId: input.deliveryId,
    message: 'GitHub webhook delivery queued.',
  }
}

export async function processGitHubWebhookDelivery(input: {
  deliveryId: string | null
  event: string
  rawBody: string
}): Promise<WebhookProcessResult> {
  const payload = parseGitHubWebhookPayload(input.rawBody)
  const action = payload.action
  const prisma = getPrismaClient()

  if (!prisma || !input.deliveryId) {
    return {
      mode: 'demo',
      received: true,
      event: input.event,
      action,
      processed: false,
      message: 'Webhook received in demo mode; persistence is unavailable.',
    }
  }

  const existingDelivery = await prisma.gitHubWebhookDelivery.findUnique({
    where: { deliveryId: input.deliveryId },
  })
  if (existingDelivery?.status === 'processed') {
    return {
      mode: 'live',
      received: true,
      event: input.event,
      action,
      duplicate: true,
      processed: false,
      message: 'Duplicate GitHub webhook delivery ignored.',
    }
  }

  const installationId = getWebhookInstallationId(payload)
  const organization = installationId
    ? await prisma.organization.findFirst({
        where: { githubInstallationId: installationId },
      })
    : null

  const delivery =
    existingDelivery ??
    (await prisma.gitHubWebhookDelivery.create({
      data: {
        deliveryId: input.deliveryId,
        event: input.event,
        action,
        status: 'queued',
        organizationId: organization?.id,
        metadata: {
          rawBody: input.rawBody,
          installationId,
          repositoryId: payload.repository?.id,
        },
      },
    }))
  const nextAttemptCount = delivery.attemptCount + 1
  const attemptStartedAt = new Date()

  await prisma.gitHubWebhookDelivery.update({
    where: { id: delivery.id },
    data: {
      status: 'processing',
      attemptCount: { increment: 1 },
      lastAttemptAt: attemptStartedAt,
      nextRetryAt: null,
      lastError: null,
    },
  })

  if (!installationId || !organization) {
    await prisma.gitHubWebhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'ignored',
        message: 'No organization is connected to this GitHub installation.',
        processedAt: new Date(),
      },
    })
    return {
      mode: 'live',
      received: true,
      event: input.event,
      action,
      processed: false,
      message: 'No organization is connected to this GitHub installation.',
    }
  }

  try {
    let result = {
      processed: false,
      message: `Event ${input.event} is not handled yet.`,
    }

    if (input.event === 'pull_request') {
      result = await processPullRequestWebhook({
        organizationId: organization.id,
        installationId,
        action,
        payload,
      })
    } else if (input.event === 'pull_request_review') {
      result = await processPullRequestReviewWebhook({
        organizationId: organization.id,
        payload,
      })
    } else if (checkEvents.has(input.event)) {
      result = await processCheckWebhook({
        organizationId: organization.id,
        payload,
        event: input.event,
      })
    } else if (
      input.event === 'installation_repositories' ||
      input.event === 'installation'
    ) {
      const syncResult = await syncGitHubInstallation(organization.id)
      result = {
        processed: syncResult.mode === 'live',
        message: syncResult.message,
      }
    }

    await prisma.gitHubWebhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: result.processed ? 'processed' : 'ignored',
        message: result.message,
        organizationId: organization.id,
        lastError: null,
        nextRetryAt: null,
        processedAt: new Date(),
      },
    })

    return {
      mode: 'live',
      received: true,
      event: input.event,
      action,
      processed: result.processed,
      message: result.message,
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'GitHub webhook processing failed.'
    await prisma.gitHubWebhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'failed',
        message,
        lastError: message,
        nextRetryAt: new Date(
          attemptStartedAt.getTime() + retryDelayMs(nextAttemptCount),
        ),
        organizationId: organization.id,
        processedAt: new Date(),
      },
    })
    throw error
  }
}

export async function processQueuedGitHubWebhookDeliveries(
  input: {
    organizationId?: string
    deliveryId?: string
    limit?: number
    now?: Date
  } = {},
): Promise<WebhookQueueProcessResult> {
  const prisma = getPrismaClient()
  if (!prisma) return { processed: 0, failed: 0, skipped: 0 }

  const now = input.now ?? new Date()
  const deliveries = await prisma.gitHubWebhookDelivery.findMany({
    where: {
      deliveryId: input.deliveryId,
      organizationId: input.organizationId,
      OR: [
        { status: 'queued' },
        { status: 'failed', nextRetryAt: { lte: now } },
        { status: 'failed', nextRetryAt: null },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: input.limit ?? 10,
  })
  const summary: WebhookQueueProcessResult = {
    processed: 0,
    failed: 0,
    skipped: 0,
  }

  for (const delivery of deliveries) {
    const rawBody = readRawBodyFromMetadata(delivery.metadata)
    if (!rawBody) {
      summary.skipped += 1
      await prisma.gitHubWebhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'failed',
          message: 'Queued webhook delivery is missing raw payload metadata.',
          lastError: 'Queued webhook delivery is missing raw payload metadata.',
          lastAttemptAt: now,
          attemptCount: { increment: 1 },
          nextRetryAt: new Date(
            now.getTime() + retryDelayMs(delivery.attemptCount + 1),
          ),
          processedAt: now,
        },
      })
      continue
    }

    try {
      await processGitHubWebhookDelivery({
        deliveryId: delivery.deliveryId,
        event: delivery.event,
        rawBody,
      })
      summary.processed += 1
    } catch (error) {
      reportError({
        area: 'jobs',
        action: 'queued_github_webhook_failed',
        error,
        metadata: {
          deliveryId: delivery.deliveryId,
          event: delivery.event,
          attemptCount: delivery.attemptCount + 1,
        },
      })
      summary.failed += 1
    }
  }

  return summary
}
