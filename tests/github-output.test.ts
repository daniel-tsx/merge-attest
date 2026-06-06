import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  formatAiReviewCheckOutput,
  formatAiReviewInlineComment,
  formatAiReviewManagedComment,
  getAiReviewCheckConclusion,
  publishAiReviewGitHubOutput,
  sanitizeGitHubMarkdownText,
} from '../lib/github/output'
import {
  postPullRequestComment,
  postPullRequestReview,
  publishAiReviewCheckRun,
} from '@/lib/github'
import type { ValidatedAiReview } from '../lib/ai/review'

vi.mock('@/lib/github', () => ({
  postPullRequestComment: vi.fn(),
  postPullRequestReview: vi.fn(),
  publishAiReviewCheckRun: vi.fn(),
}))

const pullRequest = {
  id: 'pr_1',
  number: 42,
  repositoryName: 'auteur',
  owner: 'northstar',
  installationId: 'install_1',
  headSha: 'abc123',
  riskScore: 72,
  riskLevel: 'high' as const,
  testGapStatus: 'warning' as const,
  ciStatus: 'passing' as const,
  approvalStatus: 'pending' as const,
}

const review: ValidatedAiReview = {
  inlineComments: [
    {
      severity: 'high',
      category: 'correctness',
      confidence: 0.86,
      filePath: 'lib/review.ts',
      lineNumber: 2,
      body: 'This path misses the fallback case.',
      side: 'RIGHT',
    },
  ],
  summaryFindings: [
    {
      severity: 'medium',
      category: 'testing',
      confidence: 0.7,
      body: 'Add coverage for the failure path.',
    },
  ],
  skippedCommentsCount: 1,
}

describe('GitHub AI review output', () => {
  beforeEach(() => {
    vi.mocked(postPullRequestComment).mockReset()
    vi.mocked(postPullRequestReview).mockReset()
    vi.mocked(publishAiReviewCheckRun).mockReset()
  })

  it('formats inline comments with severity, category, and confidence', () => {
    expect(formatAiReviewInlineComment(review.inlineComments[0])).toContain(
      '**High correctness**',
    )
    expect(formatAiReviewInlineComment(review.inlineComments[0])).toContain(
      'Confidence: 86%',
    )
  })

  it('formats managed comments with Auteur signals and deep links', () => {
    const body = formatAiReviewManagedComment({
      pullRequest,
      review,
      summary: 'Two findings found.',
      appBaseUrl: 'https://app.example.test',
    })

    expect(body).toContain('## Auteur AI review')
    expect(body).toContain('Risk: 72 (high)')
    expect(body).toContain(
      '[Open in Auteur](https://app.example.test/pull-requests/pr_1)',
    )
  })

  it('sanitizes AI-authored GitHub markdown before publishing', () => {
    expect(sanitizeGitHubMarkdownText('Ping @team <!-- hidden -->')).toBe(
      'Ping (at)team <!--  hidden -->',
    )
    expect(
      formatAiReviewInlineComment({
        ...review.inlineComments[0],
        body: 'Ping @team',
      }),
    ).toContain('Ping (at)team')
  })

  it('uses neutral check conclusions for advisory findings', () => {
    expect(getAiReviewCheckConclusion(review)).toBe('neutral')
    expect(
      getAiReviewCheckConclusion({
        inlineComments: [],
        summaryFindings: [],
        skippedCommentsCount: 0,
      }),
    ).toBe('success')
    expect(formatAiReviewCheckOutput({ pullRequest, review }).title).toBe(
      'Auteur AI review found 2 findings',
    )
  })

  it('publishes output for the free plan during early access', async () => {
    vi.mocked(postPullRequestReview).mockResolvedValue({
      mode: 'live',
      reviewId: 'review_1',
      message: 'GitHub review posted.',
    })
    vi.mocked(postPullRequestComment).mockResolvedValue({
      mode: 'live',
      action: 'created',
      commentId: 'comment_1',
      message: 'GitHub comment posted.',
    })
    vi.mocked(publishAiReviewCheckRun).mockResolvedValue({
      mode: 'live',
      action: 'created',
      checkRunId: 'check_1',
      conclusion: 'neutral',
      message: 'Auteur AI review check run created.',
    })

    await expect(
      publishAiReviewGitHubOutput({
        planKey: 'free',
        pullRequest,
        job: { id: 'job_1' },
        review,
      }),
    ).resolves.toMatchObject({ mode: 'published' })
    expect(postPullRequestReview).toHaveBeenCalled()
    expect(postPullRequestComment).toHaveBeenCalled()
    expect(publishAiReviewCheckRun).toHaveBeenCalled()
  })

  it('publishes inline, managed comment, and check run output with returned ids', async () => {
    vi.mocked(postPullRequestReview).mockResolvedValue({
      mode: 'live',
      reviewId: 'review_1',
      message: 'GitHub review posted.',
    })
    vi.mocked(postPullRequestComment).mockResolvedValue({
      mode: 'live',
      action: 'created',
      commentId: 'comment_1',
      message: 'GitHub comment posted.',
    })
    vi.mocked(publishAiReviewCheckRun).mockResolvedValue({
      mode: 'live',
      action: 'created',
      checkRunId: 'check_1',
      conclusion: 'neutral',
      message: 'Auteur AI review check run created.',
    })

    await expect(
      publishAiReviewGitHubOutput({
        planKey: 'team',
        pullRequest,
        job: { id: 'job_1' },
        review,
        summary: 'Two findings found.',
      }),
    ).resolves.toMatchObject({
      mode: 'published',
      githubReviewId: 'review_1',
      githubManagedCommentId: 'comment_1',
      githubCheckRunId: 'check_1',
      commentsCount: 2,
      skippedCommentsCount: 1,
    })
    expect(postPullRequestReview).toHaveBeenCalledWith(
      expect.objectContaining({ number: 42, headSha: 'abc123' }),
      'Auteur AI review inline findings.',
      [
        expect.objectContaining({
          path: 'lib/review.ts',
          line: 2,
          side: 'RIGHT',
        }),
      ],
    )
    expect(postPullRequestComment).toHaveBeenCalledWith(
      expect.objectContaining({ commentId: undefined }),
      expect.stringContaining('## Auteur AI review'),
    )
    expect(publishAiReviewCheckRun).toHaveBeenCalledWith(
      expect.objectContaining({ checkRunId: undefined }),
      expect.objectContaining({ conclusion: 'neutral' }),
    )
  })

  it('does not duplicate inline reviews when a review id is already stored', async () => {
    vi.mocked(postPullRequestComment).mockResolvedValue({
      mode: 'live',
      action: 'updated',
      commentId: 'comment_1',
      message: 'GitHub comment updated.',
    })
    vi.mocked(publishAiReviewCheckRun).mockResolvedValue({
      mode: 'live',
      action: 'updated',
      checkRunId: 'check_1',
      conclusion: 'neutral',
      message: 'Auteur AI review check run updated.',
    })

    await expect(
      publishAiReviewGitHubOutput({
        planKey: 'team',
        pullRequest,
        job: {
          id: 'job_1',
          githubReviewId: 'review_1',
          githubManagedCommentId: 'comment_1',
          githubCheckRunId: 'check_1',
        },
        review,
      }),
    ).resolves.toMatchObject({
      mode: 'published',
      githubReviewId: 'review_1',
      githubManagedCommentId: 'comment_1',
      githubCheckRunId: 'check_1',
    })
    expect(postPullRequestReview).not.toHaveBeenCalled()
    expect(postPullRequestComment).toHaveBeenCalledWith(
      expect.objectContaining({ commentId: 'comment_1' }),
      expect.any(String),
    )
    expect(publishAiReviewCheckRun).toHaveBeenCalledWith(
      expect.objectContaining({ checkRunId: 'check_1' }),
      expect.any(Object),
    )
  })
})
