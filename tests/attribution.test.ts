import { describe, expect, it } from 'vitest'
import { attributeAgent } from '../lib/agents/attribution'
import type { AgentIdentityRule } from '../lib/types'

function registryRule(
  overrides: Partial<AgentIdentityRule> &
    Pick<AgentIdentityRule, 'agentSource' | 'matchType' | 'pattern'>,
): AgentIdentityRule {
  return {
    id: 'rule-1',
    enabled: true,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('attributeAgent', () => {
  it('attributes from commit trailers with high confidence and evidence', () => {
    const result = attributeAgent({
      author: 'maya',
      title: 'Refactor billing',
      branch: 'feature/billing',
      commits: [
        {
          message:
            'Refactor billing\n\nCo-Authored-By: Claude <noreply@anthropic.com>',
          authorEmail: 'maya@northstar.dev',
        },
      ],
    })

    expect(result.agentSource).toBe('claude_code')
    expect(result.aiAssisted).toBe(true)
    expect(result.confidence).toBeGreaterThanOrEqual(90)
    expect(result.evidence[0].signal).toBe('commit_trailer')
  })

  it('attributes from a bot account login', () => {
    const result = attributeAgent({
      author: 'copilot-swe-agent[bot]',
      title: 'Update dependencies',
      branch: 'copilot/update-deps',
    })

    expect(result.agentSource).toBe('copilot')
    expect(result.aiAssisted).toBe(true)
    expect(result.evidence.some((item) => item.signal === 'bot_account')).toBe(
      true,
    )
  })

  it('attributes from author email domain', () => {
    const result = attributeAgent({
      author: 'background-agent',
      title: 'Tidy types',
      branch: 'work/types',
      authorEmail: 'agent@cursor.sh',
    })

    expect(result.agentSource).toBe('cursor')
    expect(result.evidence.some((item) => item.signal === 'email_domain')).toBe(
      true,
    )
  })

  it('falls back to manual when there are no signals', () => {
    const result = attributeAgent({
      author: 'maya',
      title: 'Fix typo',
      branch: 'fix/typo',
    })

    expect(result.agentSource).toBe('manual')
    expect(result.aiAssisted).toBe(false)
    expect(result.confidence).toBe(0)
    expect(result.evidence).toHaveLength(0)
  })

  it('marks generic agent branches as AI assisted but unknown agent', () => {
    const result = attributeAgent({
      author: 'owen',
      title: 'Update SDK',
      branch: 'agent/sdk',
    })

    expect(result.agentSource).toBe('unknown')
    expect(result.aiAssisted).toBe(true)
  })

  it('does not treat human logins that merely end in bot as bots', () => {
    const result = attributeAgent({
      author: 'talbot',
      title: 'Fix typo',
      branch: 'fix/typo',
    })

    expect(result.agentSource).toBe('manual')
    expect(result.aiAssisted).toBe(false)
  })

  it('still flags separator and bracket bot logins as generic bots', () => {
    for (const author of ['renovate-bot', 'github-actions[bot]']) {
      const result = attributeAgent({
        author,
        title: 'Update dependencies',
        branch: 'chore/deps',
      })

      expect(result.agentSource).toBe('unknown')
      expect(result.aiAssisted).toBe(true)
    }
  })

  it('prefers a named agent over a generic bot signal', () => {
    const result = attributeAgent({
      author: 'devin-ai-integration[bot]',
      title: 'Migrate schema',
      branch: 'agent/migrate',
    })

    expect(result.agentSource).toBe('devin')
  })

  it('applies authoritative organization registry rules', () => {
    const result = attributeAgent({
      author: 'internal-ci',
      title: 'Generated change',
      branch: 'autopilot/feature',
      registry: [
        registryRule({
          agentSource: 'codex',
          matchType: 'branch_prefix',
          pattern: 'autopilot/',
        }),
      ],
    })

    expect(result.agentSource).toBe('codex')
    expect(
      result.evidence.some((item) => item.signal === 'registry_rule'),
    ).toBe(true)
  })

  it('ignores registry rules with only wildcard matching', () => {
    const result = attributeAgent({
      author: 'maya',
      title: 'Manual docs update',
      branch: 'docs/update',
      registry: [
        registryRule({
          agentSource: 'cursor',
          matchType: 'branch_prefix',
          pattern: '*',
        }),
      ],
    })

    expect(result.agentSource).toBe('manual')
    expect(result.aiAssisted).toBe(false)
  })

  it('matches email-domain registry rules on domain boundaries', () => {
    expect(
      attributeAgent({
        authorEmail: 'agent@team.cursor.sh',
        registry: [
          registryRule({
            agentSource: 'cursor',
            matchType: 'email_domain',
            pattern: 'cursor.sh',
          }),
        ],
      }).agentSource,
    ).toBe('cursor')

    expect(
      attributeAgent({
        authorEmail: 'human@notcursor.sh',
        registry: [
          registryRule({
            agentSource: 'cursor',
            matchType: 'email_domain',
            pattern: 'cursor.sh',
          }),
        ],
      }).agentSource,
    ).toBe('manual')
  })

  it('matches branch-prefix registry rules only at the branch start', () => {
    expect(
      attributeAgent({
        branch: 'cursor/feature',
        registry: [
          registryRule({
            agentSource: 'cursor',
            matchType: 'branch_prefix',
            pattern: 'cursor/',
          }),
        ],
      }).agentSource,
    ).toBe('cursor')

    expect(
      attributeAgent({
        branch: 'feature/cursor/update',
        registry: [
          registryRule({
            agentSource: 'cursor',
            matchType: 'branch_prefix',
            pattern: 'cursor/',
          }),
        ],
      }).agentSource,
    ).toBe('manual')
  })

  it('ignores disabled registry rules', () => {
    const result = attributeAgent({
      author: 'internal-ci',
      title: 'Generated change',
      branch: 'autopilot/feature',
      registry: [
        registryRule({
          id: 'rule-disabled',
          enabled: false,
          agentSource: 'codex',
          matchType: 'branch_prefix',
          pattern: 'autopilot/',
        }),
      ],
    })

    expect(result.agentSource).toBe('manual')
  })

  it('ranks stronger signals above weaker ones in evidence', () => {
    const result = attributeAgent({
      author: 'cursor',
      title: 'cursor change',
      branch: 'cursor/feature',
      commits: [
        {
          message:
            'cursor change\n\nCo-authored-by: Cursor Agent <cursoragent>',
        },
      ],
    })

    expect(result.agentSource).toBe('cursor')
    const weights = result.evidence.map((item) => item.weight)
    expect(weights).toEqual([...weights].sort((a, b) => b - a))
    expect(result.evidence[0].signal).toBe('commit_trailer')
  })
})
