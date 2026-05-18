import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import {
  enqueueAiReviewJob,
  getAiReviewKey,
  getAiReviewStatusTimestamps,
  getAiReviewTransitionData,
  isTerminalAiReviewStatus,
} from '../lib/jobs/pr-review-lifecycle'
import { processQueuedAiReviewJobs } from '../lib/jobs/pr-review-worker'
import { getQueueJobId, parseJobLimit } from '../lib/jobs/queue'
import { getPrismaClient } from '../lib/prisma'
import { getGitHubPullRequestDiff } from '@/lib/github'

vi.mock('../lib/prisma', () => ({
  getPrismaClient: vi.fn(),
}))

vi.mock('@/lib/github', () => ({
  getGitHubPullRequestDiff: vi.fn(),
}))

describe('PR review lifecycle', () => {
  beforeEach(() => {
    vi.mocked(getPrismaClient).mockReset()
    vi.mocked(getGitHubPullRequestDiff).mockReset()
  })

  it('uses organization, repository, pull request number, and head SHA as the review key', () => {
    expect(
      getAiReviewKey({
        organizationId: 'org_1',
        repositoryId: 'repo_1',
        pullNumber: 42,
        headSha: 'abc123',
      }),
    ).toBe('org_1:repo_1:42:abc123')
  })

  it('classifies terminal review statuses', () => {
    expect(isTerminalAiReviewStatus('queued')).toBe(false)
    expect(isTerminalAiReviewStatus('in_progress')).toBe(false)
    expect(isTerminalAiReviewStatus('blocked')).toBe(true)
    expect(isTerminalAiReviewStatus('completed')).toBe(true)
    expect(isTerminalAiReviewStatus('failed')).toBe(true)
  })

  it('maps review statuses to lifecycle timestamps', () => {
    const now = new Date('2026-05-18T07:00:00.000Z')

    expect(getAiReviewStatusTimestamps('queued', now)).toEqual({})
    expect(getAiReviewStatusTimestamps('in_progress', now)).toEqual({
      startedAt: now,
      completedAt: null,
    })
    expect(getAiReviewStatusTimestamps('completed', now)).toEqual({
      completedAt: now,
    })
  })

  it('builds transition data with consistent timestamps and error state', () => {
    const now = new Date('2026-05-18T07:00:00.000Z')

    expect(
      getAiReviewTransitionData({
        status: 'failed',
        statusDetail: 'Provider failed.',
        errorMessage: 'Bad response',
        now,
      }),
    ).toEqual({
      status: 'failed',
      statusDetail: 'Provider failed.',
      errorMessage: 'Bad response',
      completedAt: now,
    })
  })

  it('normalizes queue ids and runner limits', () => {
    expect(getQueueJobId('pr_review', 'org_1:repo_1:42:abc123')).toBe(
      'pr_review:org_1:repo_1:42:abc123',
    )
    expect(parseJobLimit('250', { fallback: 25, max: 100 })).toBe(100)
    expect(parseJobLimit('0', { fallback: 25, max: 100 })).toBe(1)
    expect(parseJobLimit('bad', { fallback: 25, max: 100 })).toBe(25)
  })

  it('does not enqueue without a head SHA', async () => {
    vi.mocked(getPrismaClient).mockReturnValue({
      aiReviewJob: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    } as never)

    await expect(
      enqueueAiReviewJob({
        organizationId: 'org_1',
        repositoryId: 'repo_1',
        pullRequestId: 'pr_1',
        pullNumber: 42,
        headSha: null,
      }),
    ).resolves.toBeNull()
  })

  it('returns the existing job for duplicate review keys', async () => {
    const existingJob = {
      id: 'job_1',
      reviewKey: 'org_1:repo_1:42:abc123',
      status: 'queued',
    }
    const create = vi.fn()
    vi.mocked(getPrismaClient).mockReturnValue({
      repositoryReviewSettings: {
        findUnique: vi.fn().mockResolvedValue({ aiReviewsEnabled: true }),
      },
      aiReviewJob: {
        findUnique: vi.fn().mockResolvedValue(existingJob),
        create,
      },
    } as never)

    await expect(
      enqueueAiReviewJob({
        organizationId: 'org_1',
        repositoryId: 'repo_1',
        pullRequestId: 'pr_1',
        pullNumber: 42,
        headSha: 'abc123',
      }),
    ).resolves.toEqual({ job: existingJob, created: false })
    expect(create).not.toHaveBeenCalled()
  })

  it('does not enqueue when repository AI reviews are disabled', async () => {
    const create = vi.fn()
    vi.mocked(getPrismaClient).mockReturnValue({
      repositoryReviewSettings: {
        findUnique: vi.fn().mockResolvedValue({ aiReviewsEnabled: false }),
      },
      aiReviewJob: {
        findUnique: vi.fn(),
        create,
      },
    } as never)

    await expect(
      enqueueAiReviewJob({
        organizationId: 'org_1',
        repositoryId: 'repo_1',
        pullRequestId: 'pr_1',
        pullNumber: 42,
        headSha: 'abc123',
      }),
    ).resolves.toBeNull()
    expect(create).not.toHaveBeenCalled()
  })

  it('creates a queued job for a new review key', async () => {
    const createdJob = {
      id: 'job_1',
      reviewKey: 'org_1:repo_1:42:abc123',
      status: 'queued',
    }
    const create = vi.fn().mockResolvedValue(createdJob)
    vi.mocked(getPrismaClient).mockReturnValue({
      repositoryReviewSettings: {
        findUnique: vi.fn().mockResolvedValue({ aiReviewsEnabled: true }),
      },
      aiReviewJob: {
        findUnique: vi.fn().mockResolvedValue(null),
        create,
      },
    } as never)

    await expect(
      enqueueAiReviewJob({
        organizationId: 'org_1',
        repositoryId: 'repo_1',
        pullRequestId: 'pr_1',
        pullNumber: 42,
        headSha: 'abc123',
        githubDeliveryId: 'delivery_1',
      }),
    ).resolves.toEqual({ job: createdJob, created: true })
    expect(create).toHaveBeenCalledWith({
      data: {
        reviewKey: 'org_1:repo_1:42:abc123',
        status: 'queued',
        statusDetail: 'Waiting for AI review worker.',
        githubDeliveryId: 'delivery_1',
        queueJobId: 'pr_review:org_1:repo_1:42:abc123',
        organizationId: 'org_1',
        repositoryId: 'repo_1',
        pullRequestId: 'pr_1',
      },
    })
  })

  it('blocks queued jobs while OpenRouter credentials are not configured', async () => {
    const now = new Date('2026-05-18T07:00:00.000Z')
    const update = vi.fn().mockResolvedValue({})
    vi.mocked(getPrismaClient).mockReturnValue({
      aiReviewJob: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'job_1',
            reviewKey: 'org_1:repo_1:42:abc123',
            organizationId: 'org_1',
            repository: {
              reviewSettings: {
                aiReviewsEnabled: true,
                ignoredPaths: [],
                model: null,
              },
            },
          },
        ]),
        update,
      },
      aiProviderCredential: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    } as never)

    await expect(
      processQueuedAiReviewJobs({ limit: 5, now }),
    ).resolves.toEqual({
      processed: 1,
      blocked: 1,
      failed: 0,
      skipped: 0,
    })
    expect(update).toHaveBeenNthCalledWith(1, {
      where: { id: 'job_1' },
      data: {
        status: 'in_progress',
        statusDetail: 'Checking AI review prerequisites.',
        errorMessage: null,
        startedAt: now,
        completedAt: null,
        attemptCount: { increment: 1 },
      },
    })
    expect(update).toHaveBeenNthCalledWith(2, {
      where: { id: 'job_1' },
      data: {
        status: 'blocked',
        statusDetail: 'OpenRouter credentials are not configured yet.',
        errorMessage: undefined,
        completedAt: now,
      },
    })
  })

  it('skips queued jobs when repository AI reviews are disabled', async () => {
    const now = new Date('2026-05-18T07:00:00.000Z')
    const update = vi.fn().mockResolvedValue({})
    vi.mocked(getPrismaClient).mockReturnValue({
      aiReviewJob: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'job_1',
            reviewKey: 'org_1:repo_1:42:abc123',
            organizationId: 'org_1',
            repository: {
              reviewSettings: {
                aiReviewsEnabled: false,
                ignoredPaths: [],
                model: null,
              },
            },
          },
        ]),
        update,
      },
    } as never)

    await expect(
      processQueuedAiReviewJobs({ limit: 5, now }),
    ).resolves.toEqual({
      processed: 1,
      blocked: 0,
      failed: 0,
      skipped: 1,
    })
    expect(update).toHaveBeenNthCalledWith(2, {
      where: { id: 'job_1' },
      data: {
        status: 'skipped',
        statusDetail: 'AI reviews are disabled for this repository.',
        errorMessage: undefined,
        completedAt: now,
      },
    })
    expect(getGitHubPullRequestDiff).not.toHaveBeenCalled()
  })

  it('skips queued jobs when GitHub diff is unavailable', async () => {
    const now = new Date('2026-05-18T07:00:00.000Z')
    const update = vi.fn().mockResolvedValue({})
    vi.mocked(getGitHubPullRequestDiff).mockResolvedValue(null)
    vi.mocked(getPrismaClient).mockReturnValue({
      aiReviewJob: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'job_1',
            reviewKey: 'org_1:repo_1:42:abc123',
            organizationId: 'org_1',
            organization: { githubInstallationId: 'install_1' },
            repository: {
              owner: 'northstar',
              name: 'agent-gate',
              reviewSettings: {
                aiReviewsEnabled: true,
                ignoredPaths: [],
                model: null,
              },
            },
            pullRequest: { number: 42 },
          },
        ]),
        update,
      },
      aiProviderCredential: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'credential_1',
          provider: 'openrouter',
        }),
      },
    } as never)

    await expect(
      processQueuedAiReviewJobs({ limit: 5, now }),
    ).resolves.toEqual({
      processed: 1,
      blocked: 0,
      failed: 0,
      skipped: 1,
    })
    expect(update).toHaveBeenNthCalledWith(2, {
      where: { id: 'job_1' },
      data: {
        status: 'skipped',
        statusDetail: 'GitHub diff is unavailable for this pull request.',
        errorMessage: undefined,
        completedAt: now,
      },
    })
  })

  it('skips queued jobs when filtered diff is empty', async () => {
    const now = new Date('2026-05-18T07:00:00.000Z')
    const update = vi.fn().mockResolvedValue({})
    vi.mocked(getGitHubPullRequestDiff).mockResolvedValue(
      [
        'diff --git a/pnpm-lock.yaml b/pnpm-lock.yaml',
        '--- a/pnpm-lock.yaml',
        '+++ b/pnpm-lock.yaml',
        '@@ -1,1 +1,2 @@',
        ' lockfileVersion: 9.0',
        '+settings: {}',
      ].join('\n'),
    )
    vi.mocked(getPrismaClient).mockReturnValue({
      aiReviewJob: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'job_1',
            reviewKey: 'org_1:repo_1:42:abc123',
            organizationId: 'org_1',
            organization: { githubInstallationId: 'install_1' },
            repository: {
              owner: 'northstar',
              name: 'agent-gate',
              reviewSettings: {
                aiReviewsEnabled: true,
                ignoredPaths: [],
                model: null,
              },
            },
            pullRequest: { number: 42 },
          },
        ]),
        update,
      },
      aiProviderCredential: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'credential_1',
          provider: 'openrouter',
        }),
      },
    } as never)

    await expect(
      processQueuedAiReviewJobs({ limit: 5, now }),
    ).resolves.toEqual({
      processed: 1,
      blocked: 0,
      failed: 0,
      skipped: 1,
    })
    expect(update).toHaveBeenNthCalledWith(2, {
      where: { id: 'job_1' },
      data: {
        status: 'skipped',
        statusDetail: 'No reviewable diff remained after filtering.',
        errorMessage: undefined,
        completedAt: now,
      },
    })
  })

  it('skips queued jobs after diff guardrails pass', async () => {
    const now = new Date('2026-05-18T07:00:00.000Z')
    const update = vi.fn().mockResolvedValue({})
    vi.mocked(getGitHubPullRequestDiff).mockResolvedValue(
      [
        'diff --git a/lib/review.ts b/lib/review.ts',
        '--- a/lib/review.ts',
        '+++ b/lib/review.ts',
        '@@ -1,2 +1,3 @@',
        ' export function review() {',
        '+  return true',
        ' }',
      ].join('\n'),
    )
    vi.mocked(getPrismaClient).mockReturnValue({
      aiReviewJob: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'job_1',
            reviewKey: 'org_1:repo_1:42:abc123',
            organizationId: 'org_1',
            organization: { githubInstallationId: 'install_1' },
            repository: {
              owner: 'northstar',
              name: 'agent-gate',
              reviewSettings: {
                aiReviewsEnabled: true,
                ignoredPaths: [],
                model: 'openai/gpt-5.1',
              },
            },
            pullRequest: { number: 42 },
          },
        ]),
        update,
      },
      aiProviderCredential: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'credential_1',
          provider: 'openrouter',
        }),
      },
    } as never)

    await expect(
      processQueuedAiReviewJobs({ limit: 5, now }),
    ).resolves.toEqual({
      processed: 1,
      blocked: 0,
      failed: 0,
      skipped: 1,
    })
    expect(update).toHaveBeenNthCalledWith(2, {
      where: { id: 'job_1' },
      data: {
        status: 'skipped',
        statusDetail:
          'Diff guardrails passed; AI model execution is not enabled yet.',
        errorMessage: undefined,
        completedAt: now,
        model: 'openai/gpt-5.1',
      },
    })
  })

  it('protects the PR review job route and clamps its limit', async () => {
    process.env.JOB_RUNNER_SECRET = 'job-secret'
    const findMany = vi.fn().mockResolvedValue([])
    vi.mocked(getPrismaClient).mockReturnValue({
      aiReviewJob: {
        findMany,
      },
    } as never)
    const { POST } = await import('../app/api/jobs/pr-reviews/route')

    const unauthorized = await POST(
      new NextRequest('https://app.example.test/api/jobs/pr-reviews', {
        method: 'POST',
        headers: { authorization: 'Bearer wrong' },
      }),
    )
    expect(unauthorized.status).toBe(401)

    const authorized = await POST(
      new NextRequest('https://app.example.test/api/jobs/pr-reviews?limit=250', {
        method: 'POST',
        headers: { authorization: 'Bearer job-secret' },
      }),
    )
    await expect(authorized.json()).resolves.toEqual({
      processed: 0,
      blocked: 0,
      failed: 0,
      skipped: 0,
    })
    expect(findMany).toHaveBeenCalledWith({
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
      take: 100,
    })

    delete process.env.JOB_RUNNER_SECRET
  })
})
