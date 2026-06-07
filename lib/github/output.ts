import type { PlanKey, PullRequest } from '@/lib/types'
import { getBetterAuthUrl } from '@/lib/env'
import { isFeatureAvailable } from '@/lib/plans'
import type { ValidatedAiReview } from '@/lib/ai/review'
import {
  postPullRequestComment,
  postPullRequestReview,
  publishAiReviewCheckRun,
  type GitHubCheckConclusion,
  type PullRequestReviewCommentInput,
} from '@/lib/github'

type AiReviewOutputSettings = {
  publishInlineComments?: boolean
  publishManagedComment?: boolean
  publishCheckRun?: boolean
}

type AiReviewOutputPullRequest = Pick<
  PullRequest,
  | 'id'
  | 'number'
  | 'repositoryName'
  | 'riskScore'
  | 'riskLevel'
  | 'testGapStatus'
  | 'ciStatus'
  | 'approvalStatus'
> & {
  owner?: string
  installationId?: string | null
  headSha?: string | null
}

type AiReviewOutputJob = {
  id: string
  githubReviewId?: string | null
  githubManagedCommentId?: string | null
  githubCheckRunId?: string | null
}

export type PublishAiReviewOutputInput = {
  planKey: PlanKey
  pullRequest: AiReviewOutputPullRequest
  job: AiReviewOutputJob
  review: ValidatedAiReview
  summary?: string
  settings?: AiReviewOutputSettings
  appBaseUrl?: string
}

export type PublishAiReviewOutputResult = {
  mode: 'blocked' | 'published'
  reason?: string
  githubReviewId?: string
  githubManagedCommentId?: string
  githubCheckRunId?: string
  commentsCount: number
  skippedCommentsCount: number
}

function confidenceLabel(value: number) {
  return `${Math.round(value * 100)}%`
}

function titleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 3)}...`
}

export function sanitizeGitHubMarkdownText(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/@/g, '(at)')
    .replace(/<!--/g, '<!-- ')
}

export function formatAiReviewInlineComment(
  comment: ValidatedAiReview['inlineComments'][number],
) {
  return truncate(
    [
      `**${titleCase(comment.severity)} ${comment.category}**`,
      '',
      sanitizeGitHubMarkdownText(comment.body),
      '',
      `Confidence: ${confidenceLabel(comment.confidence)}`,
    ].join('\n'),
    1200,
  )
}

function findingLines(review: ValidatedAiReview) {
  return review.summaryFindings.map(
    (finding) =>
      `- **${titleCase(finding.severity)} ${finding.category}** (${confidenceLabel(
        finding.confidence,
      )} confidence): ${sanitizeGitHubMarkdownText(finding.body)}`,
  )
}

export function getAiReviewCheckConclusion(
  review: ValidatedAiReview,
): GitHubCheckConclusion {
  return review.inlineComments.length || review.summaryFindings.length
    ? 'neutral'
    : 'success'
}

export function formatAiReviewManagedComment(input: {
  pullRequest: AiReviewOutputPullRequest
  review: ValidatedAiReview
  summary?: string
  appBaseUrl?: string
}) {
  const appBaseUrl = input.appBaseUrl ?? getBetterAuthUrl()
  const prUrl = `${appBaseUrl.replace(/\/$/, '')}/pull-requests/${
    input.pullRequest.id
  }`
  const totalFindings =
    input.review.inlineComments.length + input.review.summaryFindings.length
  const lines = [
    '## MergeAttest AI review',
    '',
    sanitizeGitHubMarkdownText(input.summary?.trim() || 'AI review completed.'),
    '',
    `Findings: ${totalFindings}`,
    `Inline comments: ${input.review.inlineComments.length}`,
    `Summary findings: ${input.review.summaryFindings.length}`,
    `Skipped comments: ${input.review.skippedCommentsCount}`,
    '',
    '### MergeAttest signals',
    '',
    `- Risk: ${input.pullRequest.riskScore} (${input.pullRequest.riskLevel})`,
    `- Tests: ${input.pullRequest.testGapStatus}`,
    `- CI: ${input.pullRequest.ciStatus}`,
    `- Approval: ${input.pullRequest.approvalStatus.replaceAll('_', ' ')}`,
  ]

  const summaryFindings = findingLines(input.review)
  if (summaryFindings.length) {
    lines.push('', '### Summary findings', '', ...summaryFindings)
  }

  lines.push('', `[Open in MergeAttest](${prUrl})`)

  return truncate(lines.join('\n'), 60_000)
}

export function formatAiReviewCheckOutput(input: {
  pullRequest: AiReviewOutputPullRequest
  review: ValidatedAiReview
  summary?: string
}) {
  const totalFindings =
    input.review.inlineComments.length + input.review.summaryFindings.length
  return {
    title: totalFindings
      ? `MergeAttest AI review found ${totalFindings} finding${
          totalFindings === 1 ? '' : 's'
        }`
      : 'MergeAttest AI review found no findings',
    summary: truncate(
      [
        sanitizeGitHubMarkdownText(
          input.summary?.trim() || 'AI review completed.',
        ),
        '',
        `Findings: ${totalFindings}`,
        `Inline comments: ${input.review.inlineComments.length}`,
        `Summary findings: ${input.review.summaryFindings.length}`,
        `Skipped comments: ${input.review.skippedCommentsCount}`,
        '',
        `Risk: ${input.pullRequest.riskScore} (${input.pullRequest.riskLevel})`,
        `Tests: ${input.pullRequest.testGapStatus}`,
        `CI: ${input.pullRequest.ciStatus}`,
        `Approval: ${input.pullRequest.approvalStatus.replaceAll('_', ' ')}`,
      ].join('\n'),
      60_000,
    ),
    conclusion: getAiReviewCheckConclusion(input.review),
  }
}

export async function publishAiReviewGitHubOutput(
  input: PublishAiReviewOutputInput,
): Promise<PublishAiReviewOutputResult> {
  if (!isFeatureAvailable(input.planKey, 'githubComments')) {
    return {
      mode: 'blocked',
      reason: 'github_output_not_entitled',
      commentsCount: 0,
      skippedCommentsCount: input.review.skippedCommentsCount,
    }
  }

  const settings = {
    publishInlineComments: true,
    publishManagedComment: true,
    publishCheckRun: true,
    ...input.settings,
  }
  const pullRequest = {
    number: input.pullRequest.number,
    repositoryName: input.pullRequest.repositoryName,
    owner: input.pullRequest.owner,
    installationId: input.pullRequest.installationId ?? undefined,
    headSha: input.pullRequest.headSha,
  }
  const result: PublishAiReviewOutputResult = {
    mode: 'published',
    githubReviewId: input.job.githubReviewId ?? undefined,
    githubManagedCommentId: input.job.githubManagedCommentId ?? undefined,
    githubCheckRunId: input.job.githubCheckRunId ?? undefined,
    commentsCount:
      input.review.inlineComments.length + input.review.summaryFindings.length,
    skippedCommentsCount: input.review.skippedCommentsCount,
  }

  if (
    settings.publishInlineComments &&
    input.review.inlineComments.length &&
    !input.job.githubReviewId
  ) {
    const comments: PullRequestReviewCommentInput[] =
      input.review.inlineComments.map((comment) => ({
        path: comment.filePath,
        line: comment.lineNumber,
        side: comment.side,
        body: formatAiReviewInlineComment(comment),
      }))
    const review = await postPullRequestReview(
      pullRequest,
      'MergeAttest AI review inline findings.',
      comments,
    )
    if (review.mode === 'live') result.githubReviewId = review.reviewId
  }

  if (settings.publishManagedComment) {
    const managedComment = await postPullRequestComment(
      {
        ...pullRequest,
        commentId: input.job.githubManagedCommentId,
      },
      formatAiReviewManagedComment({
        pullRequest: input.pullRequest,
        review: input.review,
        summary: input.summary,
        appBaseUrl: input.appBaseUrl,
      }),
    )
    if (managedComment.mode === 'live') {
      result.githubManagedCommentId = managedComment.commentId
    }
  }

  if (settings.publishCheckRun) {
    const checkRun = await publishAiReviewCheckRun(
      {
        ...pullRequest,
        checkRunId: input.job.githubCheckRunId,
      },
      formatAiReviewCheckOutput({
        pullRequest: input.pullRequest,
        review: input.review,
        summary: input.summary,
      }),
    )
    if (checkRun.mode === 'live') {
      result.githubCheckRunId = checkRun.checkRunId
    }
  }

  return result
}
