import { reportError } from '@/lib/observability'
import { getPrismaClient } from '@/lib/prisma'
import {
  shouldEnqueueAiReview,
  stringListFromJson,
} from '@/lib/ai/settings'
import { getAiReviewTransitionData } from '@/lib/jobs/pr-review-lifecycle'
import { getOrganizationOpenRouterCredential } from '@/lib/ai/credentials'
import { getGitHubPullRequestDiff } from '@/lib/github'
import {
  filterDiffFiles,
  parseUnifiedDiff,
} from '@/lib/github/diff'

export type AiReviewQueueProcessResult = {
  processed: number
  blocked: number
  failed: number
  skipped: number
}

export async function processQueuedAiReviewJobs(
  input: { limit?: number; now?: Date } = {},
): Promise<AiReviewQueueProcessResult> {
  const prisma = getPrismaClient()
  if (!prisma) return { processed: 0, blocked: 0, failed: 0, skipped: 0 }

  const now = input.now ?? new Date()
  const jobs = await prisma.aiReviewJob.findMany({
    where: { status: 'queued' },
    include: {
      organization: { select: { githubInstallationId: true } },
      repository: {
        select: {
          owner: true,
          name: true,
          reviewSettings: {
            select: {
              aiReviewsEnabled: true,
              ignoredPaths: true,
              model: true,
            },
          },
        },
      },
      pullRequest: { select: { number: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: input.limit ?? 10,
  })
  const summary: AiReviewQueueProcessResult = {
    processed: 0,
    blocked: 0,
    failed: 0,
    skipped: 0,
  }

  for (const job of jobs) {
    try {
      await prisma.aiReviewJob.update({
        where: { id: job.id },
        data: {
          ...getAiReviewTransitionData({
            status: 'in_progress',
            statusDetail: 'Checking AI review prerequisites.',
            errorMessage: null,
            now,
          }),
          attemptCount: { increment: 1 },
        },
      })

      const reviewSettings = job.repository.reviewSettings
      if (!shouldEnqueueAiReview(reviewSettings)) {
        await prisma.aiReviewJob.update({
          where: { id: job.id },
          data: getAiReviewTransitionData({
            status: 'skipped',
            statusDetail: 'AI reviews are disabled for this repository.',
            now,
          }),
        })
        summary.processed += 1
        summary.skipped += 1
        continue
      }

      const credential = await getOrganizationOpenRouterCredential(
        job.organizationId,
      )
      if (!credential) {
        await prisma.aiReviewJob.update({
          where: { id: job.id },
          data: getAiReviewTransitionData({
            status: 'blocked',
            statusDetail: 'OpenRouter credentials are not configured yet.',
            now,
          }),
        })
        summary.processed += 1
        summary.blocked += 1
        continue
      }

      const installationId = job.organization.githubInstallationId
      const rawDiff = installationId
        ? await getGitHubPullRequestDiff({
            owner: job.repository.owner,
            name: job.repository.name,
            pullNumber: job.pullRequest.number,
            installationId,
          })
        : null
      if (!rawDiff) {
        await prisma.aiReviewJob.update({
          where: { id: job.id },
          data: getAiReviewTransitionData({
            status: 'skipped',
            statusDetail: 'GitHub diff is unavailable for this pull request.',
            now,
          }),
        })
        summary.processed += 1
        summary.skipped += 1
        continue
      }

      const filteredDiff = filterDiffFiles(parseUnifiedDiff(rawDiff), {
        ignoredPaths: stringListFromJson(reviewSettings?.ignoredPaths),
      })
      if (!filteredDiff.files.length) {
        await prisma.aiReviewJob.update({
          where: { id: job.id },
          data: getAiReviewTransitionData({
            status: 'skipped',
            statusDetail: 'No reviewable diff remained after filtering.',
            now,
          }),
        })
        summary.processed += 1
        summary.skipped += 1
        continue
      }

      await prisma.aiReviewJob.update({
        where: { id: job.id },
        data: {
          ...getAiReviewTransitionData({
            status: 'skipped',
            statusDetail:
              'Diff guardrails passed; AI model execution is not enabled yet.',
            now,
          }),
          model: reviewSettings?.model ?? null,
        },
      })
      summary.processed += 1
      summary.skipped += 1
    } catch (error) {
      reportError({
        area: 'jobs',
        action: 'ai_review_job_failed',
        error,
        metadata: { aiReviewJobId: job.id, reviewKey: job.reviewKey },
      })

      summary.failed += 1
      await prisma.aiReviewJob.update({
        where: { id: job.id },
        data: getAiReviewTransitionData({
          status: 'failed',
          statusDetail: 'AI review job failed before provider execution.',
          errorMessage:
            error instanceof Error ? error.message : 'AI review job failed.',
          now,
        }),
      })
    }
  }

  return summary
}
