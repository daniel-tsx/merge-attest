import { describe, expect, it } from 'vitest'
import {
  filterDiffFiles,
  getCommentableLines,
  matchesIgnoredPath,
  parseUnifiedDiff,
} from '../lib/github/diff'

function sampleDiff(path = 'lib/review.ts') {
  return [
    `diff --git a/${path} b/${path}`,
    `--- a/${path}`,
    `+++ b/${path}`,
    '@@ -1,3 +1,4 @@',
    ' export function review() {',
    '+  return true',
    ' }',
    '',
  ].join('\n')
}

describe('GitHub diff guardrails', () => {
  it('parses unified diff hunks into added commentable lines', () => {
    const files = parseUnifiedDiff(sampleDiff())

    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('lib/review.ts')
    expect(files[0].additions).toBe(1)
    expect(getCommentableLines(files).get('lib/review.ts')).toEqual(
      new Set([2]),
    )
  })

  it('matches exact, directory, and wildcard ignored paths', () => {
    expect(matchesIgnoredPath('docs/readme.md', ['docs/'])).toBe(true)
    expect(matchesIgnoredPath('src/generated/client.ts', ['src/*/client.ts']))
      .toBe(true)
    expect(matchesIgnoredPath('lib/review.ts', ['lib/review.ts'])).toBe(true)
    expect(matchesIgnoredPath('lib/review.ts', ['app/'])).toBe(false)
  })

  it('filters ignored, generated, lockfile, vendored, binary, and empty files', () => {
    const files = [
      ...parseUnifiedDiff(sampleDiff('docs/readme.md')),
      ...parseUnifiedDiff(sampleDiff('src/schema.generated.ts')),
      ...parseUnifiedDiff(sampleDiff('pnpm-lock.yaml')),
      ...parseUnifiedDiff(sampleDiff('vendor/client.ts')),
      ...parseUnifiedDiff(sampleDiff('public/logo.png')),
      ...parseUnifiedDiff(
        [
          'diff --git a/lib/delete.ts b/lib/delete.ts',
          '--- a/lib/delete.ts',
          '+++ b/lib/delete.ts',
          '@@ -1,2 +1,1 @@',
          '-export const removed = true',
          ' export const kept = true',
        ].join('\n'),
      ),
      ...parseUnifiedDiff(sampleDiff('lib/review.ts')),
    ]

    const filtered = filterDiffFiles(files, { ignoredPaths: ['docs/'] })

    expect(filtered.files.map((file) => file.path)).toEqual(['lib/review.ts'])
    expect(filtered.skippedFiles).toEqual([
      { path: 'docs/readme.md', reason: 'ignored_path' },
      { path: 'src/schema.generated.ts', reason: 'generated' },
      { path: 'pnpm-lock.yaml', reason: 'lockfile' },
      { path: 'vendor/client.ts', reason: 'vendored' },
      { path: 'public/logo.png', reason: 'binary' },
      { path: 'lib/delete.ts', reason: 'no_commentable_lines' },
    ])
  })

  it('marks every file as skipped when no reviewable diff remains', () => {
    const filtered = filterDiffFiles(parseUnifiedDiff(sampleDiff('build/app.js')))

    expect(filtered.files).toEqual([])
    expect(filtered.skippedFiles).toEqual([
      { path: 'build/app.js', reason: 'vendored' },
    ])
  })
})
