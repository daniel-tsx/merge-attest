'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import { canManageRules } from '@/lib/collaboration'
import {
  parseRepositoryReviewSettingsForm,
  stringListFromJson,
} from '@/lib/ai/settings'
import { getPrismaClient } from '@/lib/prisma'

function listChangedFields(
  previous: {
    aiReviewsEnabled: boolean
    reviewDepth: string
    minimumSeverity: string
    model: string | null
    ignoredPaths: unknown
    stackTags: unknown
    publishInlineComments: boolean
    publishManagedComment: boolean
    publishCheckRun: boolean
  } | null,
  next: ReturnType<typeof parseRepositoryReviewSettingsForm>,
) {
  if (!previous) return Object.keys(next)

  const previousValues = {
    ...previous,
    model: previous.model ?? null,
    ignoredPaths: stringListFromJson(previous.ignoredPaths),
    stackTags: stringListFromJson(previous.stackTags),
  }
  return Object.entries(next)
    .filter(([key, value]) => {
      const previousValue = previousValues[key as keyof typeof previousValues]
      return JSON.stringify(previousValue) !== JSON.stringify(value)
    })
    .map(([key]) => key)
}

export async function updateRepositoryAiSettings(
  repositoryId: string,
  formData: FormData,
) {
  const base = `/repositories/${repositoryId}/ai`
  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()
  if (!organization || !prisma) redirect(`${base}?status=auth_required`)
  if (!canManageRules(organization.role)) redirect(`${base}?status=forbidden`)

  const repository = await prisma.repository.findFirst({
    where: { id: repositoryId, organizationId: organization.id },
  })
  if (!repository) redirect(`${base}?status=not_found`)

  const nextSettings = parseRepositoryReviewSettingsForm(formData)
  const previous = await prisma.repositoryReviewSettings.findUnique({
    where: { repositoryId: repository.id },
  })
  const changedFields = listChangedFields(previous, nextSettings)

  await prisma.repositoryReviewSettings.upsert({
    where: { repositoryId: repository.id },
    create: {
      ...nextSettings,
      organizationId: organization.id,
      repositoryId: repository.id,
    },
    update: nextSettings,
  })

  await prisma.auditEvent.create({
    data: {
      eventType: 'settings_changed',
      actor: organization.userName || organization.userEmail,
      summary: `Updated AI review settings for ${repository.owner}/${repository.name}`,
      metadata: {
        changedFields: changedFields.join(','),
        aiReviewsEnabled: nextSettings.aiReviewsEnabled,
        reviewDepth: nextSettings.reviewDepth,
        minimumSeverity: nextSettings.minimumSeverity,
      },
      organizationId: organization.id,
      repositoryId: repository.id,
    },
  })

  revalidatePath(base)
  revalidatePath(`/repositories/${repository.id}`)
  redirect(`${base}?status=updated`)
}
