import { describe, expect, it } from 'vitest'
import {
  getDefaultRepositoryReviewSettings,
  normalizeRepositoryReviewSettings,
  parseRepositoryReviewSettingsForm,
  shouldEnqueueAiReview,
  stringListFromJson,
} from '../lib/ai/settings'

describe('AI review settings', () => {
  it('defaults repository AI reviews to disabled', () => {
    expect(getDefaultRepositoryReviewSettings('repo_1')).toMatchObject({
      repositoryId: 'repo_1',
      aiReviewsEnabled: false,
      reviewDepth: 'standard',
      minimumSeverity: 'medium',
      publishInlineComments: true,
      publishManagedComment: true,
      publishCheckRun: true,
    })
  })

  it('parses repository AI review settings forms', () => {
    const formData = new FormData()
    formData.set('aiReviewsEnabled', 'on')
    formData.set('reviewDepth', 'deep')
    formData.set('minimumSeverity', 'high')
    formData.set('model', ' openai/gpt-5.1 ')
    formData.set('ignoredPaths', 'docs/\n*.snap, generated/')
    formData.set('stackTags', 'nextjs\nprisma')
    formData.set('publishManagedComment', 'on')
    formData.set('publishCheckRun', 'on')

    expect(parseRepositoryReviewSettingsForm(formData)).toEqual({
      aiReviewsEnabled: true,
      reviewDepth: 'deep',
      minimumSeverity: 'high',
      model: 'openai/gpt-5.1',
      ignoredPaths: ['docs/', '*.snap', 'generated/'],
      stackTags: ['nextjs', 'prisma'],
      publishInlineComments: false,
      publishManagedComment: true,
      publishCheckRun: true,
    })
  })

  it('normalizes persisted JSON lists and enqueue state', () => {
    expect(stringListFromJson([' docs/ ', 12, '', 'src/'])).toEqual([
      'docs/',
      'src/',
    ])
    expect(
      normalizeRepositoryReviewSettings('repo_1', {
        aiReviewsEnabled: true,
        ignoredPaths: ['docs/'],
        stackTags: ['nextjs'],
      }),
    ).toMatchObject({
      aiReviewsEnabled: true,
      ignoredPaths: ['docs/'],
      stackTags: ['nextjs'],
    })
    expect(shouldEnqueueAiReview({ aiReviewsEnabled: true })).toBe(true)
    expect(shouldEnqueueAiReview({ aiReviewsEnabled: false })).toBe(false)
    expect(shouldEnqueueAiReview(null)).toBe(false)
  })
})
