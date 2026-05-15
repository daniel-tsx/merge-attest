'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import { canManageRules } from '@/lib/collaboration'
import { isFeatureAvailable } from '@/lib/plans'
import { getPrismaClient } from '@/lib/prisma'
import { getRuleTemplate } from '@/lib/rule-templates'
import type { AgentSource, RepoRule, RiskLevel } from '@/lib/types'

const triggerTypes: RepoRule['triggerType'][] = [
  'ai_assisted',
  'high_risk',
  'auth_changed',
  'billing_changed',
  'database_migration',
  'dependency_changed',
  'high_test_gap',
  'failing_ci',
]

const actionTypes: RepoRule['actionType'][] = [
  'warn',
  'require_approval',
  'block_merge',
  'request_tests',
  'request_security_review',
  'publish_github_check',
]

const severityTypes: RepoRule['severity'][] = [
  'low',
  'medium',
  'high',
  'critical',
]

const agentSources: AgentSource[] = [
  'cursor',
  'codex',
  'claude_code',
  'copilot',
  'devin',
  'manual',
  'unknown',
]

const riskLevels: RiskLevel[] = ['low', 'medium', 'high', 'critical']

function optionalText(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, 500) : null
}

function requiredText(value: FormDataEntryValue | null, fallback: string) {
  return optionalText(value) ?? fallback
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

function parseRuleForm(formData: FormData) {
  const agentSource = pickOption(
    formData.get('agentSource'),
    agentSources,
    'unknown',
  )
  const minimumRiskLevel =
    typeof formData.get('minimumRiskLevel') === 'string'
      ? pickOption(formData.get('minimumRiskLevel'), riskLevels, 'low')
      : null

  return {
    name: requiredText(formData.get('name'), 'Custom repository rule'),
    description: requiredText(
      formData.get('description'),
      'Custom policy managed from AgentGate.',
    ),
    triggerType: pickOption(
      formData.get('triggerType'),
      triggerTypes,
      'ai_assisted',
    ),
    actionType: pickOption(
      formData.get('actionType'),
      actionTypes,
      'require_approval',
    ),
    severity: pickOption(formData.get('severity'), severityTypes, 'medium'),
    branchPattern: optionalText(formData.get('branchPattern')),
    pathPattern: optionalText(formData.get('pathPattern')),
    labelPattern: optionalText(formData.get('labelPattern')),
    agentSource:
      formData.get('agentSource') === '' || agentSource === 'unknown'
        ? null
        : agentSource,
    minimumRiskLevel:
      formData.get('minimumRiskLevel') === '' ? null : minimumRiskLevel,
    codeOwnerHint: optionalText(formData.get('codeOwnerHint')),
  }
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
    : parseRuleForm(formData)

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
      data: parseRuleForm(formData),
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
