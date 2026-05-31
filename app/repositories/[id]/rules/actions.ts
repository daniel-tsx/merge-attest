'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import { canManageRules } from '@/lib/collaboration'
import { isFeatureAvailable } from '@/lib/plans'
import { getPrismaClient } from '@/lib/prisma'
import { getRuleTemplate } from '@/lib/rule-templates'
import type { AgentSource, RepoRule, RiskLevel } from '@/lib/types'

const triggerTypes = [
  'ai_assisted',
  'high_risk',
  'auth_changed',
  'billing_changed',
  'database_migration',
  'dependency_changed',
  'high_test_gap',
  'failing_ci',
] as const satisfies readonly RepoRule['triggerType'][]

const actionTypes = [
  'warn',
  'require_approval',
  'block_merge',
  'request_tests',
  'request_security_review',
  'publish_github_check',
] as const satisfies readonly RepoRule['actionType'][]

const severityTypes = [
  'low',
  'medium',
  'high',
  'critical',
] as const satisfies readonly RepoRule['severity'][]

const agentSources = [
  'cursor',
  'codex',
  'claude_code',
  'copilot',
  'devin',
  'manual',
  'unknown',
] as const satisfies readonly AgentSource[]

const riskLevels = [
  'low',
  'medium',
  'high',
  'critical',
] as const satisfies readonly RiskLevel[]

const optionalString = z
  .string()
  .trim()
  .max(500)
  .transform((value) => (value ? value : null))

const ruleFormSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500),
  triggerType: z.enum(triggerTypes),
  actionType: z.enum(actionTypes),
  severity: z.enum(severityTypes),
  branchPattern: optionalString,
  pathPattern: optionalString,
  labelPattern: optionalString,
  agentSource: z
    .union([z.enum(agentSources), z.literal('')])
    .transform((value) => (value && value !== 'unknown' ? value : null)),
  minimumRiskLevel: z
    .union([z.enum(riskLevels), z.literal('')])
    .transform((value) => (value ? value : null)),
  codeOwnerHint: optionalString,
})

function optionalText(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, 500) : null
}

function stringValue(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

function parseRuleForm(formData: FormData, base: string) {
  const parsed = ruleFormSchema.safeParse({
    name: stringValue(formData, 'name'),
    description: stringValue(formData, 'description'),
    triggerType: stringValue(formData, 'triggerType'),
    actionType: stringValue(formData, 'actionType'),
    severity: stringValue(formData, 'severity'),
    branchPattern: stringValue(formData, 'branchPattern'),
    pathPattern: stringValue(formData, 'pathPattern'),
    labelPattern: stringValue(formData, 'labelPattern'),
    agentSource: stringValue(formData, 'agentSource'),
    minimumRiskLevel: stringValue(formData, 'minimumRiskLevel'),
    codeOwnerHint: stringValue(formData, 'codeOwnerHint'),
  })
  if (!parsed.success) {
    redirect(`${base}?status=invalid_form`)
  }

  return parsed.data
}

async function syncActiveRulesCount(repositoryId: string) {
  const prisma = getPrismaClient()
  if (!prisma) return
  const activeRulesCount = await prisma.repoRule.count({
    where: { repositoryId, enabled: true },
  })
  await prisma.repository.update({
    where: { id: repositoryId },
    data: { activeRulesCount },
  })
}

export async function createRule(repositoryId: string, formData: FormData) {
  const base = `/repositories/${repositoryId}/rules`
  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()
  if (!organization || !prisma) redirect(`${base}?status=auth_required`)
  if (!canManageRules(organization.role)) redirect(`${base}?status=forbidden`)
  if (!isFeatureAvailable(organization.planKey, 'customRules')) {
    redirect(`${base}?status=upgrade_required`)
  }

  const repository = await prisma.repository.findFirst({
    where: { id: repositoryId, organizationId: organization.id },
  })
  if (!repository) redirect(`${base}?status=not_found`)

  const templateKey = optionalText(formData.get('templateKey'))
  const template =
    formData.get('_action') === 'apply_template'
      ? getRuleTemplate(templateKey ?? '')
      : null
  const ruleData = template
    ? {
        name: template.name,
        description: template.description,
        triggerType: template.triggerType,
        actionType: template.actionType,
        severity: template.severity,
        branchPattern: template.branchPattern ?? null,
        pathPattern: template.pathPattern ?? null,
        labelPattern: template.labelPattern ?? null,
        agentSource: template.agentSource ?? null,
        minimumRiskLevel: template.minimumRiskLevel ?? null,
        codeOwnerHint: template.codeOwnerHint ?? null,
      }
    : parseRuleForm(formData, base)

  const rule = await prisma.repoRule.create({
    data: {
      ...ruleData,
      enabled: true,
      repositoryId: repository.id,
      organizationId: organization.id,
    },
  })
  await syncActiveRulesCount(repository.id)
  await prisma.auditEvent.create({
    data: {
      eventType: 'settings_changed',
      actor: organization.userName || organization.userEmail,
      summary: `${template ? 'Applied rule template' : 'Created repository rule'}: ${rule.name}`,
      metadata: {
        ruleId: rule.id,
        templateKey,
        triggerType: rule.triggerType,
        actionType: rule.actionType,
      },
      organizationId: organization.id,
      repositoryId: repository.id,
    },
  })

  revalidatePath(base)
  redirect(`${base}?status=${template ? 'template_applied' : 'created'}`)
}

export async function mutateRule(
  repositoryId: string,
  ruleId: string,
  formData: FormData,
) {
  const base = `/repositories/${repositoryId}/rules`
  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()
  if (!organization || !prisma) redirect(`${base}?status=auth_required`)
  if (!canManageRules(organization.role)) redirect(`${base}?status=forbidden`)
  if (!isFeatureAvailable(organization.planKey, 'customRules')) {
    redirect(`${base}?status=upgrade_required`)
  }

  const rule = await prisma.repoRule.findFirst({
    where: { id: ruleId, repositoryId, organizationId: organization.id },
  })
  if (!rule) redirect(`${base}?status=not_found`)

  const actionValue = formData.get('_action')
  const action = typeof actionValue === 'string' ? actionValue : 'update'
  let auditSummary = `Updated repository rule: ${rule.name}`
  let status = 'updated'

  if (action === 'delete') {
    await prisma.repoRule.delete({ where: { id: rule.id } })
    auditSummary = `Deleted repository rule: ${rule.name}`
    status = 'deleted'
  } else if (action === 'toggle') {
    const enabled = formData.get('enabled') === 'true'
    await prisma.repoRule.update({
      where: { id: rule.id },
      data: { enabled },
    })
    auditSummary = `${enabled ? 'Enabled' : 'Disabled'} repository rule: ${rule.name}`
    status = enabled ? 'enabled' : 'disabled'
  } else if (action === 'duplicate') {
    await prisma.repoRule.create({
      data: {
        name: `${rule.name} copy`,
        description: rule.description,
        enabled: false,
        triggerType: rule.triggerType,
        actionType: rule.actionType,
        severity: rule.severity,
        branchPattern: rule.branchPattern,
        pathPattern: rule.pathPattern,
        labelPattern: rule.labelPattern,
        agentSource: rule.agentSource,
        minimumRiskLevel: rule.minimumRiskLevel,
        codeOwnerHint: rule.codeOwnerHint,
        repositoryId: rule.repositoryId,
        organizationId: organization.id,
      },
    })
    auditSummary = `Duplicated repository rule: ${rule.name}`
    status = 'duplicated'
  } else {
    await prisma.repoRule.update({
      where: { id: rule.id },
      data: parseRuleForm(formData, base),
    })
  }

  await syncActiveRulesCount(repositoryId)
  await prisma.auditEvent.create({
    data: {
      eventType: 'settings_changed',
      actor: organization.userName || organization.userEmail,
      summary: auditSummary,
      metadata: { ruleId: rule.id, action },
      organizationId: organization.id,
      repositoryId,
    },
  })

  revalidatePath(base)
  redirect(`${base}?status=${status}`)
}
