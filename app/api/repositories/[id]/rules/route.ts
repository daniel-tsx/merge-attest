import { NextRequest, NextResponse } from 'next/server'
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

function redirectToRules(
  request: NextRequest,
  repositoryId: string,
  status: string,
) {
  const url = new URL(`/repositories/${repositoryId}/rules`, request.url)
  url.searchParams.set('status', status)
  return NextResponse.redirect(url)
}

function optionalText(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, 500) : null
}

function requiredText(value: FormDataEntryValue | null, fallback: string) {
  const trimmed = optionalText(value)
  return trimmed ?? fallback
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()
  const { id } = await params

  if (!organization || !prisma) {
    return redirectToRules(request, id, 'auth_required')
  }

  if (!canManageRules(organization.role)) {
    return redirectToRules(request, id, 'forbidden')
  }

  if (!isFeatureAvailable(organization.planKey, 'customRules')) {
    return redirectToRules(request, id, 'upgrade_required')
  }

  const repository = await prisma.repository.findFirst({
    where: { id, organizationId: organization.id },
  })

  if (!repository) return redirectToRules(request, id, 'not_found')

  const formData = await request.formData()
  const action = formData.get('_action')
  const templateKey = optionalText(formData.get('templateKey'))
  const template =
    action === 'apply_template' ? getRuleTemplate(templateKey ?? '') : null
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

  const activeRulesCount = await prisma.repoRule.count({
    where: { repositoryId: repository.id, enabled: true },
  })

  await prisma.repository.update({
    where: { id: repository.id },
    data: { activeRulesCount },
  })

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

  return redirectToRules(request, id, template ? 'template_applied' : 'created')
}
