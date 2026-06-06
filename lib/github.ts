import { createHmac, timingSafeEqual } from 'node:crypto'
import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from 'octokit'
import { getGitHubWebhookSecret, isProduction } from '@/lib/env'
import type {
  ApprovalStatus,
  CiStatus,
  PullRequest,
  RiskLevel,
  TestGapStatus,
} from '@/lib/types'

export function githubConfigured() {
  return Boolean(
    process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY,
  )
}

export function isGitHubDemoMode() {
  return !githubConfigured()
}

function getAppOctokit() {
  if (!githubConfigured()) return null

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID!,
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    },
  })
}

export function getInstallationOctokit(installationId?: string) {
  if (!githubConfigured() || !installationId) return null

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID!,
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      installationId,
    },
  })
}

export function getGitHubAppInstallUrl(state?: string) {
  if (!process.env.GITHUB_APP_SLUG) return null

  const url = new URL(
    `https://github.com/apps/${process.env.GITHUB_APP_SLUG}/installations/new`,
  )
  if (state) url.searchParams.set('state', state)
  return url.toString()
}

export async function getGitHubInstallationMetadata(installationId: string) {
  const octokit = getAppOctokit()
  if (!octokit) return null

  const response = await octokit.request(
    'GET /app/installations/{installation_id}',
    {
      installation_id: Number(installationId),
    },
  )
  const account = response.data.account

  return {
    accountId: account?.id ? String(account.id) : null,
    accountLogin: account && 'login' in account ? account.login : null,
  }
}

export async function listInstallationRepositories(installationId: string) {
  const octokit = getInstallationOctokit(installationId)
  if (!octokit) return null

  return octokit.paginate('GET /installation/repositories', {
    per_page: 100,
  })
}

export async function listGitHubPullRequests(repository: {
  owner: string
  name: string
  installationId: string
}) {
  const octokit = getInstallationOctokit(repository.installationId)
  if (!octokit) return null

  return octokit.paginate('GET /repos/{owner}/{repo}/pulls', {
    owner: repository.owner,
    repo: repository.name,
    state: 'open',
    per_page: 50,
  })
}

export async function getGitHubPullRequest(repository: {
  owner: string
  name: string
  pullNumber: number
  installationId: string
}) {
  const octokit = getInstallationOctokit(repository.installationId)
  if (!octokit) return null

  const response = await octokit.request(
    'GET /repos/{owner}/{repo}/pulls/{pull_number}',
    {
      owner: repository.owner,
      repo: repository.name,
      pull_number: repository.pullNumber,
    },
  )

  return response.data
}

export async function getGitHubPullRequestDiff(repository: {
  owner: string
  name: string
  pullNumber: number
  installationId: string
}): Promise<string | null> {
  const octokit = getInstallationOctokit(repository.installationId)
  if (!octokit) return null

  const response = (await octokit.request(
    'GET /repos/{owner}/{repo}/pulls/{pull_number}',
    {
      owner: repository.owner,
      repo: repository.name,
      pull_number: repository.pullNumber,
      headers: {
        accept: 'application/vnd.github.v3.diff',
      },
    },
  )) as { data: unknown }

  return typeof response.data === 'string' ? response.data : null
}

export async function listGitHubPullRequestFiles(repository: {
  owner: string
  name: string
  pullNumber: number
  installationId: string
}) {
  const octokit = getInstallationOctokit(repository.installationId)
  if (!octokit) return null

  return octokit.paginate(
    'GET /repos/{owner}/{repo}/pulls/{pull_number}/files',
    {
      owner: repository.owner,
      repo: repository.name,
      pull_number: repository.pullNumber,
      per_page: 100,
    },
  )
}

export async function listGitHubPullRequestCommits(repository: {
  owner: string
  name: string
  pullNumber: number
  installationId: string
}) {
  const octokit = getInstallationOctokit(repository.installationId)
  if (!octokit) return null

  // Attribution needs representative commit metadata, not an unbounded history.
  // Keep this to one GitHub page so large PRs do not exhaust sync rate limits.
  const response = await octokit.request(
    'GET /repos/{owner}/{repo}/pulls/{pull_number}/commits',
    {
      owner: repository.owner,
      repo: repository.name,
      pull_number: repository.pullNumber,
      per_page: 100,
    },
  )
  return response.data
}

export async function syncPullRequests(repository: {
  owner: string
  name: string
  installationId?: string
}) {
  const octokit = getInstallationOctokit(repository.installationId)
  if (!octokit) {
    return {
      mode: 'demo' as const,
      message:
        'GitHub credentials are missing; using seeded demo pull requests.',
      pullRequests: [],
    }
  }

  const response = await octokit.rest.pulls.list({
    owner: repository.owner,
    repo: repository.name,
    state: 'all',
    per_page: 50,
  })

  return {
    mode: 'live' as const,
    message: `Synced ${response.data.length} pull requests from GitHub.`,
    pullRequests: response.data,
  }
}

export async function postPullRequestComment(
  pr: Pick<PullRequest, 'number' | 'repositoryName'> & {
    owner?: string
    installationId?: string
    commentId?: string | null
  },
  body: string,
) {
  const octokit = getInstallationOctokit(pr.installationId)
  if (!octokit || !pr.owner) {
    return {
      mode: 'demo' as const,
      message: `Mock GitHub comment for ${pr.repositoryName}#${pr.number}: ${body}`,
    }
  }

  const commentId = pr.commentId ? Number(pr.commentId) : null
  if (commentId && Number.isFinite(commentId)) {
    try {
      const response = await octokit.rest.issues.updateComment({
        owner: pr.owner,
        repo: pr.repositoryName,
        comment_id: commentId,
        body,
      })

      return {
        mode: 'live' as const,
        action: 'updated' as const,
        commentId: String(response.data.id),
        message: 'GitHub comment updated.',
      }
    } catch (error) {
      if (!isGitHubNotFoundError(error)) throw error
    }
  }

  const response = await octokit.rest.issues.createComment({
    owner: pr.owner,
    repo: pr.repositoryName,
    issue_number: pr.number,
    body,
  })

  return {
    mode: 'live' as const,
    action: 'created' as const,
    commentId: String(response.data.id),
    message: 'GitHub comment posted.',
  }
}

export type PullRequestReviewCommentInput = {
  path: string
  line: number
  side: 'RIGHT'
  body: string
}

export async function postPullRequestReview(
  pr: Pick<PullRequest, 'number' | 'repositoryName'> & {
    owner?: string
    installationId?: string
    headSha?: string | null
  },
  body: string,
  comments: PullRequestReviewCommentInput[],
) {
  if (!comments.length) {
    return {
      mode: 'skipped' as const,
      message: 'No inline review comments to publish.',
    }
  }

  const octokit = getInstallationOctokit(pr.installationId)
  if (!octokit || !pr.owner || !pr.headSha) {
    return {
      mode: 'demo' as const,
      message: `Mock GitHub review for ${pr.repositoryName}#${pr.number}.`,
    }
  }

  const response = await octokit.rest.pulls.createReview({
    owner: pr.owner,
    repo: pr.repositoryName,
    pull_number: pr.number,
    commit_id: pr.headSha,
    body,
    event: 'COMMENT',
    comments,
  })

  return {
    mode: 'live' as const,
    reviewId: String(response.data.id),
    message: 'GitHub review posted.',
  }
}

export function getAuteurCheckConclusion(input: {
  approvalStatus: ApprovalStatus
  riskLevel: RiskLevel
  testGapStatus: TestGapStatus
  ciStatus: CiStatus
}) {
  if (input.approvalStatus === 'rejected' || input.ciStatus === 'failing') {
    return 'failure' as const
  }

  if (
    input.approvalStatus === 'pending' ||
    input.testGapStatus === 'high' ||
    input.riskLevel === 'critical'
  ) {
    return 'action_required' as const
  }

  if (
    input.approvalStatus === 'approved' ||
    input.approvalStatus === 'risk_accepted' ||
    input.approvalStatus === 'not_required'
  ) {
    return 'success' as const
  }

  return 'neutral' as const
}

export type GitHubCheckConclusion =
  | 'success'
  | 'failure'
  | 'neutral'
  | 'cancelled'
  | 'skipped'
  | 'timed_out'
  | 'action_required'

export async function publishAuteurCheckRun(
  pr: Pick<
    PullRequest,
    | 'number'
    | 'repositoryName'
    | 'riskScore'
    | 'riskLevel'
    | 'testGapStatus'
    | 'ciStatus'
    | 'approvalStatus'
  > & {
    owner?: string
    installationId?: string
    headSha?: string | null
    checkRunId?: string | null
  },
) {
  const octokit = getInstallationOctokit(pr.installationId)
  if (!octokit || !pr.owner || !pr.headSha) {
    return {
      mode: 'demo' as const,
      message: `Mock Auteur check run for ${pr.repositoryName}#${pr.number}.`,
    }
  }

  const conclusion = getAuteurCheckConclusion(pr)
  const output = {
    title: `Auteur ${conclusion.replaceAll('_', ' ')}`,
    summary: [
      `Risk: ${pr.riskScore} (${pr.riskLevel})`,
      `Tests: ${pr.testGapStatus}`,
      `CI: ${pr.ciStatus}`,
      `Approval: ${pr.approvalStatus.replaceAll('_', ' ')}`,
    ].join('\n'),
  }
  const checkRunId = pr.checkRunId ? Number(pr.checkRunId) : null

  if (checkRunId && Number.isFinite(checkRunId)) {
    try {
      const response = await octokit.rest.checks.update({
        owner: pr.owner,
        repo: pr.repositoryName,
        check_run_id: checkRunId,
        name: 'Auteur',
        status: 'completed',
        conclusion,
        output,
      })

      return {
        mode: 'live' as const,
        action: 'updated' as const,
        checkRunId: String(response.data.id),
        conclusion,
        message: 'Auteur check run updated.',
      }
    } catch (error) {
      if (!isGitHubNotFoundError(error)) throw error
    }
  }

  const response = await octokit.rest.checks.create({
    owner: pr.owner,
    repo: pr.repositoryName,
    name: 'Auteur',
    head_sha: pr.headSha,
    status: 'completed',
    conclusion,
    output,
  })

  return {
    mode: 'live' as const,
    action: 'created' as const,
    checkRunId: String(response.data.id),
    conclusion,
    message: 'Auteur check run created.',
  }
}

export async function publishAiReviewCheckRun(
  pr: Pick<PullRequest, 'number' | 'repositoryName'> & {
    owner?: string
    installationId?: string
    headSha?: string | null
    checkRunId?: string | null
  },
  output: {
    title: string
    summary: string
    conclusion: GitHubCheckConclusion
  },
) {
  const octokit = getInstallationOctokit(pr.installationId)
  if (!octokit || !pr.owner || !pr.headSha) {
    return {
      mode: 'demo' as const,
      message: `Mock Auteur AI review check run for ${pr.repositoryName}#${pr.number}.`,
    }
  }

  const checkRunId = pr.checkRunId ? Number(pr.checkRunId) : null
  const payload = {
    name: 'Auteur AI Review',
    status: 'completed' as const,
    conclusion: output.conclusion,
    output: {
      title: output.title,
      summary: output.summary,
    },
  }

  if (checkRunId && Number.isFinite(checkRunId)) {
    try {
      const response = await octokit.rest.checks.update({
        owner: pr.owner,
        repo: pr.repositoryName,
        check_run_id: checkRunId,
        ...payload,
      })

      return {
        mode: 'live' as const,
        action: 'updated' as const,
        checkRunId: String(response.data.id),
        conclusion: output.conclusion,
        message: 'Auteur AI review check run updated.',
      }
    } catch (error) {
      if (!isGitHubNotFoundError(error)) throw error
    }
  }

  const response = await octokit.rest.checks.create({
    owner: pr.owner,
    repo: pr.repositoryName,
    head_sha: pr.headSha,
    ...payload,
  })

  return {
    mode: 'live' as const,
    action: 'created' as const,
    checkRunId: String(response.data.id),
    conclusion: output.conclusion,
    message: 'Auteur AI review check run created.',
  }
}

export async function publishAccountabilityCheckRun(
  pr: Pick<PullRequest, 'number' | 'repositoryName'> & {
    owner?: string
    installationId?: string
    headSha?: string | null
  },
  input: { reviewer: string; agentSource: string; statement: string },
) {
  const octokit = getInstallationOctokit(pr.installationId)
  if (!octokit || !pr.owner || !pr.headSha) {
    return {
      mode: 'demo' as const,
      message: `Mock Auteur accountability check for ${pr.repositoryName}#${pr.number}.`,
    }
  }

  const response = await octokit.rest.checks.create({
    owner: pr.owner,
    repo: pr.repositoryName,
    name: 'Auteur Accountability',
    head_sha: pr.headSha,
    status: 'completed',
    conclusion: 'success',
    output: {
      title: `Human sign-off by ${input.reviewer}`,
      summary: input.statement,
    },
  })

  return {
    mode: 'live' as const,
    checkRunId: String(response.data.id),
    message: 'Auteur accountability check published.',
  }
}

function isGitHubNotFoundError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status?: number }).status === 404
  )
}

export function verifyGitHubWebhook(
  rawBody: string,
  signatureHeader: string | null,
  env: Record<string, string | undefined> = process.env,
) {
  const secret = getGitHubWebhookSecret(env)
  if (!secret) {
    return isProduction(env)
      ? { ok: false, mode: 'live' as const, reason: 'missing_secret' as const }
      : { ok: true, mode: 'demo' as const }
  }
  if (!signatureHeader?.startsWith('sha256=')) {
    return {
      ok: false,
      mode: 'live' as const,
      reason: 'missing_signature' as const,
    }
  }

  const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`
  const actual = signatureHeader
  const ok =
    expected.length === actual.length &&
    timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(actual, 'utf8'))

  return ok
    ? { ok: true, mode: 'live' as const }
    : { ok: false, mode: 'live' as const, reason: 'invalid_signature' as const }
}
