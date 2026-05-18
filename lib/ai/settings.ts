import type { AiReviewDepth, RepositoryReviewSettings } from '@/lib/types'

export const aiReviewDepths: AiReviewDepth[] = ['standard', 'deep']
export const aiReviewSeverityLevels = [
  'low',
  'medium',
  'high',
  'critical',
] as const

export type AiReviewSeverity = (typeof aiReviewSeverityLevels)[number]

type RepositoryReviewSettingsInput = Partial<
  Pick<
    RepositoryReviewSettings,
    | 'aiReviewsEnabled'
    | 'reviewDepth'
    | 'minimumSeverity'
    | 'model'
    | 'ignoredPaths'
    | 'stackTags'
    | 'publishInlineComments'
    | 'publishManagedComment'
    | 'publishCheckRun'
  >
>

export function stringListFromJson(value: unknown) {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    : []
}

export function parseReviewSettingsList(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return []
  return value
    .split(/[\n,]/)
    .map((item) => item.trim().slice(0, 200))
    .filter(Boolean)
    .slice(0, 50)
}

function optionalText(value: FormDataEntryValue | null, maxLength: number) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, maxLength) : null
}

function pickOption<T extends string>(
  value: FormDataEntryValue | null,
  options: readonly T[],
  fallback: T,
) {
  return typeof value === 'string' && options.includes(value as T)
    ? (value as T)
    : fallback
}

export function parseRepositoryReviewSettingsForm(formData: FormData) {
  return {
    aiReviewsEnabled: formData.get('aiReviewsEnabled') === 'on',
    reviewDepth: pickOption(
      formData.get('reviewDepth'),
      aiReviewDepths,
      'standard',
    ),
    minimumSeverity: pickOption(
      formData.get('minimumSeverity'),
      aiReviewSeverityLevels,
      'medium',
    ),
    model: optionalText(formData.get('model'), 120),
    ignoredPaths: parseReviewSettingsList(formData.get('ignoredPaths')),
    stackTags: parseReviewSettingsList(formData.get('stackTags')),
    publishInlineComments: formData.get('publishInlineComments') === 'on',
    publishManagedComment: formData.get('publishManagedComment') === 'on',
    publishCheckRun: formData.get('publishCheckRun') === 'on',
  }
}

export function getDefaultRepositoryReviewSettings(
  repositoryId: string,
): RepositoryReviewSettings {
  const timestamp = new Date(0).toISOString()

  return {
    id: `${repositoryId}-ai-review-settings`,
    repositoryId,
    aiReviewsEnabled: false,
    reviewDepth: 'standard',
    minimumSeverity: 'medium',
    model: undefined,
    ignoredPaths: [],
    stackTags: [],
    publishInlineComments: true,
    publishManagedComment: true,
    publishCheckRun: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function normalizeRepositoryReviewSettings(
  repositoryId: string,
  settings?: RepositoryReviewSettingsInput | null,
) {
  return {
    ...getDefaultRepositoryReviewSettings(repositoryId),
    ...settings,
    model: settings?.model?.trim() || undefined,
    ignoredPaths: settings?.ignoredPaths ?? [],
    stackTags: settings?.stackTags ?? [],
  }
}

export function shouldEnqueueAiReview(
  settings?: Pick<RepositoryReviewSettings, 'aiReviewsEnabled'> | null,
) {
  return Boolean(settings?.aiReviewsEnabled)
}
