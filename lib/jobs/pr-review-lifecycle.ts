import { getPrismaClient } from '@/lib/prisma'
import { shouldEnqueueAiReview } from '@/lib/ai/settings'
import { getQueueJobId, PR_REVIEW_JOB_NAME } from '@/lib/jobs/queue'
import type { AiReviewStatus } from '@/lib/types'

const terminalStatuses = new Set<AiReviewStatus>([
  'blocked',
  'skipped',
  'completed',
  'failed',
])

export function getAiReviewKey(input: {
  organizationId: string
  repositoryId: string
  pullNumber: number
  headSha: string
}) {
  return [
    input.organizationId,
    input.repositoryId,
    input.pullNumber,
    input.headSha,
  ].join(':')
}

export function isTerminalAiReviewStatus(status: AiReviewStatus) {
  return terminalStatuses.has(status)
}

export function getAiReviewStatusTimestamps(
  status: AiReviewStatus,
  now = new Date(),
) {
  if (status === 'in_progress') {
    return { startedAt: now, completedAt: null }
  }

  if (isTerminalAiReviewStatus(status)) {
    return { completedAt: now }
  }

  return {}
}

export function getAiReviewTransitionData(input: {
  status: AiReviewStatus
  statusDetail?: string
  errorMessage?: string | null
  now?: Date
}) {
  const now = input.now ?? new Date()
  return {
    status: input.status,
    statusDetail: input.statusDetail,
    errorMessage: input.errorMessage,
    ...getAiReviewStatusTimestamps(input.status, now),
  }
}

export async function enqueueAiReviewJob(input: {
  organizationId: string
  repositoryId: string
  pullRequestId: string
  pullNumber: number
  headSha: string | null | undefined
  githubDeliveryId?: string | null
  queueJobId?: string | null
}) {
  const prisma = getPrismaClient()
  if (!prisma || !input.headSha) return null

  const settings = await prisma.repositoryReviewSettings.findUnique({
    where: { repositoryId: input.repositoryId },
    select: { aiReviewsEnabled: true },
  })
  if (!shouldEnqueueAiReview(settings)) return null

  const reviewKey = getAiReviewKey({
    organizationId: input.organizationId,
    repositoryId: input.repositoryId,
    pullNumber: input.pullNumber,
    headSha: input.headSha,
  })
  const queueJobId =
    input.queueJobId ?? getQueueJobId(PR_REVIEW_JOB_NAME, reviewKey)
  const existing = await prisma.aiReviewJob.findUnique({
    where: { reviewKey },
  })
  if (existing) return { job: existing, created: false }

  try {
    const job = await prisma.aiReviewJob.create({
      data: {
        reviewKey,
        status: 'queued',
        statusDetail: 'Waiting for AI review worker.',
        githubDeliveryId: input.githubDeliveryId ?? undefined,
        queueJobId,
        organizationId: input.organizationId,
        repositoryId: input.repositoryId,
        pullRequestId: input.pullRequestId,
      },
    })

    return { job, created: true }
  } catch (error) {
    const duplicate = await prisma.aiReviewJob.findUnique({
      where: { reviewKey },
    })
    if (duplicate) return { job: duplicate, created: false }

    throw error
  }
}
