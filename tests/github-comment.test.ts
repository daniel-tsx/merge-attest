import { describe, expect, it } from 'vitest'
import {
  getAgentGateCheckConclusion,
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
})
