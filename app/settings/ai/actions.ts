'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import { canManageSettings } from '@/lib/collaboration'
import {
  decryptProviderKey,
  encryptProviderKey,
  getOrganizationOpenRouterCredential,
} from '@/lib/ai/credentials'
import { normalizeOpenRouterKey, verifyOpenRouterKey } from '@/lib/ai/openrouter'
import { getPrismaClient } from '@/lib/prisma'

function aiSettingsUrl(status: string) {
  return `/settings/ai?ai=${encodeURIComponent(status)}`
}

async function ensureCanManageAiSettings() {
  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()
  if (!organization || !prisma) redirect(aiSettingsUrl('auth_required'))
  if (!canManageSettings(organization.role)) redirect(aiSettingsUrl('forbidden'))

  return { organization, prisma }
}

export async function saveOpenRouterCredential(formData: FormData) {
  const { organization, prisma } = await ensureCanManageAiSettings()
  const rawKey = formData.get('apiKey')
  const apiKey = normalizeOpenRouterKey(rawKey)
  if (!apiKey) redirect(aiSettingsUrl('missing_key'))

  const verification = await verifyOpenRouterKey(apiKey)
  if (!verification.valid) redirect(aiSettingsUrl('verification_failed'))

  const encryptedKey = encryptProviderKey(apiKey)
  const existing = await getOrganizationOpenRouterCredential(organization.id)
  const credential = existing
    ? await prisma.aiProviderCredential.update({
        where: { id: existing.id },
        data: {
          encryptedKey,
          lastVerifiedAt: new Date(),
          userId: organization.userId,
        },
      })
    : await prisma.aiProviderCredential.create({
        data: {
          provider: 'openrouter',
          encryptedKey,
          lastVerifiedAt: new Date(),
          userId: organization.userId,
          organizationId: organization.id,
        },
      })

  await prisma.auditEvent.create({
    data: {
      eventType: 'settings_changed',
      actor: organization.userName || organization.userEmail,
      summary: existing
        ? 'OpenRouter credential replaced'
        : 'OpenRouter credential added',
      metadata: {
        provider: 'openrouter',
        credentialId: credential.id,
        action: existing ? 'replaced' : 'added',
        modelCount: verification.modelCount,
      },
      organizationId: organization.id,
    },
  })

  revalidatePath('/settings/ai')
  redirect(aiSettingsUrl(existing ? 'openrouter_replaced' : 'openrouter_saved'))
}

export async function verifyStoredOpenRouterCredential() {
  const { organization, prisma } = await ensureCanManageAiSettings()
  const credential = await getOrganizationOpenRouterCredential(organization.id)
  if (!credential) redirect(aiSettingsUrl('not_configured'))

  const verification = await verifyOpenRouterKey(
    decryptProviderKey(credential.encryptedKey),
  )
  if (!verification.valid) redirect(aiSettingsUrl('verification_failed'))

  await prisma.aiProviderCredential.update({
    where: { id: credential.id },
    data: { lastVerifiedAt: new Date() },
  })
  await prisma.auditEvent.create({
    data: {
      eventType: 'settings_changed',
      actor: organization.userName || organization.userEmail,
      summary: 'OpenRouter credential verified',
      metadata: {
        provider: 'openrouter',
        credentialId: credential.id,
        action: 'verified',
        modelCount: verification.modelCount,
      },
      organizationId: organization.id,
    },
  })

  revalidatePath('/settings/ai')
  redirect(aiSettingsUrl('openrouter_verified'))
}

export async function deleteOpenRouterCredential() {
  const { organization, prisma } = await ensureCanManageAiSettings()
  const credential = await getOrganizationOpenRouterCredential(organization.id)
  if (!credential) redirect(aiSettingsUrl('not_configured'))

  await prisma.aiProviderCredential.delete({ where: { id: credential.id } })
  await prisma.auditEvent.create({
    data: {
      eventType: 'settings_changed',
      actor: organization.userName || organization.userEmail,
      summary: 'OpenRouter credential deleted',
      metadata: {
        provider: 'openrouter',
        credentialId: credential.id,
        action: 'deleted',
      },
      organizationId: organization.id,
    },
  })

  revalidatePath('/settings/ai')
  redirect(aiSettingsUrl('openrouter_deleted'))
}
