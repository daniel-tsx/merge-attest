import { describe, expect, it } from 'vitest'
import { calculateRisk, mapRiskLevel } from '../lib/risk'

describe('risk scoring', () => {
  it('maps scores to risk levels', () => {
    expect(mapRiskLevel(0)).toBe('low')
    expect(mapRiskLevel(25)).toBe('medium')
    expect(mapRiskLevel(50)).toBe('high')
    expect(mapRiskLevel(75)).toBe('critical')
  })

  it('scores AI-assisted sensitive changes without tests', () => {
    const result = calculateRisk({
      aiAssisted: true,
      ciStatus: 'failing',
      files: [
        {
          path: 'lib/auth/permissions.ts',
          additions: 40,
          deletions: 8,
          changeType: 'modified',
        },
        {
          path: 'prisma/migrations/20260430_roles/migration.sql',
          additions: 30,
          deletions: 0,
          changeType: 'added',
        },
      ],
    })

    expect(result.score).toBe(90)
    expect(result.level).toBe('critical')
    expect(result.signals.map((signal) => signal.key)).toContain('auth_changed')
    expect(result.signals.map((signal) => signal.key)).toContain('db_migration')
  })

  it('recognizes non-JavaScript test file conventions', () => {
    const result = calculateRisk({
      aiAssisted: false,
      ciStatus: 'passing',
      files: [
        {
          path: 'pkg/parser/parser.go',
          additions: 30,
          deletions: 5,
          changeType: 'modified',
        },
        {
          path: 'pkg/parser/parser_test.go',
          additions: 18,
          deletions: 0,
          changeType: 'modified',
        },
      ],
    })

    expect(result.signals.map((signal) => signal.key)).not.toContain('no_tests')
  })

  it('does not flag author or authorship paths as auth changes', () => {
    const result = calculateRisk({
      aiAssisted: false,
      ciStatus: 'passing',
      files: [
        {
          path: 'app/api/compliance/authorship/export/route.ts',
          additions: 10,
          deletions: 2,
          changeType: 'modified',
        },
        {
          path: 'components/author-card.tsx',
          additions: 6,
          deletions: 1,
          changeType: 'modified',
        },
      ],
    })

    expect(result.signals.map((signal) => signal.key)).not.toContain(
      'auth_changed',
    )
  })

  it('still flags oauth and authorization paths as auth changes', () => {
    const result = calculateRisk({
      aiAssisted: false,
      ciStatus: 'passing',
      files: [
        {
          path: 'lib/oauth-client.ts',
          additions: 9,
          deletions: 3,
          changeType: 'modified',
        },
      ],
    })

    expect(result.signals.map((signal) => signal.key)).toContain('auth_changed')
  })

  it('matches env files but not env-prefixed names for infra changes', () => {
    const signalsFor = (path: string) =>
      calculateRisk({
        aiAssisted: false,
        ciStatus: 'passing',
        files: [{ path, additions: 4, deletions: 0, changeType: 'modified' }],
      }).signals.map((signal) => signal.key)

    expect(signalsFor('.env.example')).toContain('infra_changed')
    expect(signalsFor('lib/env.ts')).toContain('infra_changed')
    expect(signalsFor('lib/envelope.ts')).not.toContain('infra_changed')
  })
})
