import { describe, expect, it } from 'vitest'
import {
  getAgentGateCheckConclusion,
  postPullRequestReview,
  publishAccountabilityCheckRun,
  publishAiReviewCheckRun,
  postPullRequestComment,
  publishAgentGateCheckRun,
} from '../lib/github'

describe('GitHub comment helper', () => {
  it('returns demo mode when installation credentials are unavailable', async () => {
    const result = await postPullRequestComment(
      {
        number: 42,
        repositoryName: 'agent-gate',
        owner: 'northstar',
        commentId: '123',
      },
      'AgentGate decision: approved',
    )

    expect(result).toMatchObject({
      mode: 'demo',
    })
  })

  it('maps AgentGate state to GitHub check conclusions', () => {
    expect(
      getAgentGateCheckConclusion({
        approvalStatus: 'approved',
        riskLevel: 'medium',
        testGapStatus: 'none',
        ciStatus: 'passing',
      }),
    ).toBe('success')
    expect(
      getAgentGateCheckConclusion({
        approvalStatus: 'pending',
        riskLevel: 'high',
        testGapStatus: 'high',
        ciStatus: 'pending',
      }),
    ).toBe('action_required')
    expect(
      getAgentGateCheckConclusion({
        approvalStatus: 'rejected',
        riskLevel: 'high',
        testGapStatus: 'warning',
        ciStatus: 'passing',
      }),
    ).toBe('failure')
  })

  it('returns demo mode for check runs without installation credentials', async () => {
    const result = await publishAgentGateCheckRun({
      number: 42,
      repositoryName: 'agent-gate',
      owner: 'northstar',
      headSha: 'abc123',
      checkRunId: '123',
      riskScore: 52,
      riskLevel: 'high',
      testGapStatus: 'warning',
      ciStatus: 'passing',
      approvalStatus: 'pending',
    })

    expect(result).toMatchObject({
      mode: 'demo',
    })
  })

  it('returns demo mode for AI review checks without installation credentials', async () => {
    const result = await publishAiReviewCheckRun(
      {
        number: 42,
        repositoryName: 'agent-gate',
        owner: 'northstar',
        headSha: 'abc123',
        checkRunId: '123',
      },
      {
        title: 'AgentGate AI review found no findings',
        summary: 'AI review completed.',
        conclusion: 'success',
      },
    )

    expect(result).toMatchObject({
      mode: 'demo',
    })
  })

  it('returns demo mode for accountability checks without installation credentials', async () => {
    const result = await publishAccountabilityCheckRun(
      {
        number: 42,
        repositoryName: 'agent-gate',
        owner: 'northstar',
        headSha: 'abc123',
      },
      {
        reviewer: 'Maya Chen',
        agentSource: 'codex',
        statement:
          'Maya Chen takes responsibility for reviewing this codex pull request.',
      },
    )

    expect(result).toMatchObject({
      mode: 'demo',
    })
  })

  it('skips empty inline review batches', async () => {
    const result = await postPullRequestReview(
      {
        number: 42,
        repositoryName: 'agent-gate',
        owner: 'northstar',
        headSha: 'abc123',
      },
      'AgentGate AI review inline findings.',
      [],
    )

    expect(result).toEqual({
      mode: 'skipped',
      message: 'No inline review comments to publish.',
    })
  })
})
