import { NextRequest, NextResponse } from 'next/server'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import { getPrismaClient } from '@/lib/prisma'
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

function canManageRules(role: string) {
  return role === 'owner' || role === 'admin'
}

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

async function updateActiveRulesCount(repositoryId: string) {
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> },
) {
  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()
  const { id, ruleId } = await params

  if (!organization || !prisma) {
    return redirectToRules(request, id, 'auth_required')
  }

  if (!canManageRules(organization.role)) {
    return redirectToRules(request, id, 'forbidden')
  }

  const rule = await prisma.repoRule.findFirst({
    where: {
      id: ruleId,
      repositoryId: id,
      organizationId: organization.id,
    },
  })

  if (!rule) return redirectToRules(request, id, 'not_found')

  const formData = await request.formData()
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

  await updateActiveRulesCount(id)

  await prisma.auditEvent.create({
    data: {
      eventType: 'settings_changed',
      actor: organization.userName || organization.userEmail,
      summary: auditSummary,
      metadata: {
        ruleId: rule.id,
        action,
      },
      organizationId: organization.id,
      repositoryId: id,
    },
  })

  return redirectToRules(request, id, status)
}
