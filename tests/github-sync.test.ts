import { describe, expect, it } from 'vitest'
import {
  getNextApprovalState,
  getPrCheckSourceKey,
  inferAgentSource,
  inferAiAssisted,
  mapGitHubPullRequestFile,
} from '../lib/github-sync'

describe('GitHub sync helpers', () => {
  it('infers common AI agent sources from author, title, and branch', () => {
    expect(
      inferAgentSource({
        author: 'cursor-agent',
        title: 'Refactor auth',
        branch: 'agent/auth',
      }),
    ).toBe('cursor')
    expect(
      inferAgentSource({
        author: 'devin',
        title: 'Add billing sync',
        branch: 'feature/billing',
      }),
    ).toBe('devin')
    expect(
      inferAgentSource({
        author: 'maya',
        title: 'Fix typo',
        branch: 'fix/typo',
      }),
    ).toBe('manual')
  })

  it('marks bot or agent branches as AI assisted', () => {
    expect(
      inferAiAssisted({
        author: 'build-bot',
        title: 'Update SDK',
        branch: 'chore/sdk',
      }),
    ).toBe(true)
    expect(
      inferAiAssisted({
        author: 'owen',
        title: 'Update SDK',
        branch: 'agent/sdk',
      }),
    ).toBe(true)
    expect(
      inferAiAssisted({
        author: 'owen',
        title: 'Update SDK',
        branch: 'chore/sdk',
      }),
    ).toBe(false)
  })

  it('maps GitHub file statuses to internal change types', () => {
    expect(
      mapGitHubPullRequestFile({
        filename: 'lib/auth.ts',
        additions: 4,
        deletions: 1,
        status: 'modified',
      }),
    ).toEqual({
      path: 'lib/auth.ts',
      additions: 4,
      deletions: 1,
      changeType: 'modified',
    })
    expect(
      mapGitHubPullRequestFile({
        filename: 'lib/old.ts',
        additions: 0,
        deletions: 12,
        status: 'removed',
      }).changeType,
    ).toBe('deleted')
  })

  it('uses repository, pull request, and head SHA as the PR check source key', () => {
    expect(
      getPrCheckSourceKey({
        repositoryId: 'repo_1',
        pullNumber: 42,
        headSha: 'abc123',
      }),
    ).toBe('repo_1:42:abc123')
  })

  it('preserves explicit approval decisions across same-SHA resyncs', () => {
    const dueAt = new Date('2026-05-03T00:00:00.000Z')
    const fallbackReviewDueAt = new Date('2026-05-04T00:00:00.000Z')

    expect(
      getNextApprovalState({
        existing: {
          headSha: 'abc123',
          approvalStatus: 'approved',
          reviewDueAt: dueAt,
        },
        headSha: 'abc123',
        requiresApproval: true,
        fallbackReviewDueAt,
      }),
    ).toEqual({ approvalStatus: 'approved', reviewDueAt: null })

    expect(
      getNextApprovalState({
        existing: {
          headSha: 'abc123',
          approvalStatus: 'approved',
          reviewDueAt: null,
        },
        headSha: 'def456',
        requiresApproval: true,
        fallbackReviewDueAt,
      }),
    ).toEqual({ approvalStatus: 'pending', reviewDueAt: fallbackReviewDueAt })
  })
})
