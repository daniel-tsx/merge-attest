'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { isUsableRegistryPattern } from '@/lib/agents/attribution'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import { canManageRules } from '@/lib/collaboration'
import { isFeatureAvailable } from '@/lib/plans'
import { getPrismaClient } from '@/lib/prisma'
import type { AgentIdentityMatchType, AgentSource } from '@/lib/types'

const base = '/settings/agents'

const agentSources = [
  'cursor',
  'codex',
  'claude_code',
  'copilot',
  'devin',
  'unknown',
] as const satisfies readonly AgentSource[]

const matchTypes = [
  'bot_login',
  'email_domain',
  'branch_prefix',
  'label',
  'commit_trailer',
] as const satisfies readonly AgentIdentityMatchType[]

const ruleSchema = z.object({
  agentSource: z.enum(agentSources),
  matchType: z.enum(matchTypes),
  pattern: z.string().trim().min(1).max(200).refine(isUsableRegistryPattern),
})

function stringValue(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

export async function createAgentIdentityRule(formData: FormData) {
  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()
  if (!organization || !prisma) redirect(`${base}?status=auth_required`)
  if (!canManageRules(organization.role)) redirect(`${base}?status=forbidden`)
  if (!isFeatureAvailable(organization.planKey, 'customRules')) {
    redirect(`${base}?status=upgrade_required`)
  }

  const parsed = ruleSchema.safeParse({
    agentSource: stringValue(formData, 'agentSource'),
    matchType: stringValue(formData, 'matchType'),
    pattern: stringValue(formData, 'pattern'),
  })
  if (!parsed.success) redirect(`${base}?status=invalid_form`)

  const rule = await prisma.agentIdentityRule.create({
    data: {
      agentSource: parsed.data.agentSource,
      matchType: parsed.data.matchType,
      pattern: parsed.data.pattern,
      enabled: true,
      organizationId: organization.id,
    },
  })
  await prisma.auditEvent.create({
    data: {
      eventType: 'agent_identity_rule_changed',
      actor: organization.userName || organization.userEmail,
      summary: `Created agent identity rule mapping ${parsed.data.matchType.replaceAll('_', ' ')} to ${parsed.data.agentSource.replaceAll('_', ' ')}`,
      metadata: {
        ruleId: rule.id,
        matchType: rule.matchType,
        pattern: rule.pattern,
        action: 'create',
      },
      organizationId: organization.id,
    },
  })

  revalidatePath(base)
  redirect(`${base}?status=created`)
}

export async function mutateAgentIdentityRule(
  ruleId: string,
  formData: FormData,
) {
  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()
  if (!organization || !prisma) redirect(`${base}?status=auth_required`)
  if (!canManageRules(organization.role)) redirect(`${base}?status=forbidden`)
  if (!isFeatureAvailable(organization.planKey, 'customRules')) {
    redirect(`${base}?status=upgrade_required`)
  }

  const rule = await prisma.agentIdentityRule.findFirst({
    where: { id: ruleId, organizationId: organization.id },
  })
  if (!rule) redirect(`${base}?status=not_found`)

  const actionValue = formData.get('_action')
  const action = typeof actionValue === 'string' ? actionValue : 'toggle'
  let status = 'updated'

  if (action === 'delete') {
    await prisma.agentIdentityRule.delete({ where: { id: rule.id } })
    status = 'deleted'
  } else {
    const enabled = formData.get('enabled') === 'true'
    await prisma.agentIdentityRule.update({
      where: { id: rule.id },
      data: { enabled },
    })
    status = enabled ? 'enabled' : 'disabled'
  }

  await prisma.auditEvent.create({
    data: {
      eventType: 'agent_identity_rule_changed',
      actor: organization.userName || organization.userEmail,
      summary: `${status[0].toUpperCase()}${status.slice(1)} agent identity rule for ${rule.agentSource.replaceAll('_', ' ')}`,
      metadata: { ruleId: rule.id, action },
      organizationId: organization.id,
    },
  })

  revalidatePath(base)
  redirect(`${base}?status=${status}`)
}
