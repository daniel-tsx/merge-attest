import { notFound } from 'next/navigation'
import type React from 'react'
import { PageHeader } from '@/components/app/page-header'
import { RiskBadge } from '@/components/app/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  getCurrentOrganization,
  getRepositoryPullRequests,
  getRepository,
  getRepositoryRules,
} from '@/lib/data/app-data'
import { ruleTemplates } from '@/lib/rule-templates'
import { evaluateRepoRules } from '@/lib/rules'
import { isFeatureAvailable } from '@/lib/plans'
import type { RepoRule } from '@/lib/types'
import { formatDate } from '@/lib/utils'

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

const agentSources = [
  '',
  'cursor',
  'codex',
  'claude_code',
  'copilot',
  'devin',
  'manual',
  'unknown',
]

const riskLevels = ['', 'low', 'medium', 'high', 'critical']

const statusMessages: Record<string, string> = {
  created: 'Rule created.',
  updated: 'Rule updated.',
  enabled: 'Rule enabled.',
  disabled: 'Rule disabled.',
  deleted: 'Rule deleted.',
  duplicated: 'Rule duplicated as a disabled draft.',
  template_applied: 'Template applied.',
  forbidden: 'Only organization owners and admins can manage rules.',
  auth_required: 'Sign in is required to manage rules.',
  not_found: 'Rule or repository not found.',
  upgrade_required: 'Custom repository rules require the Team plan or higher.',
}

function formatLabel(value: string) {
  return value ? value.replaceAll('_', ' ') : 'Any'
}

function fieldLabel(label: string, children: React.ReactNode) {
  return (
    <label className="space-y-1 text-xs font-medium text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  )
}

function RuleFields({ rule }: { rule?: RepoRule }) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        {fieldLabel(
          'Rule name',
          <Input name="name" defaultValue={rule?.name} required />,
        )}
        {fieldLabel(
          'Severity',
          <Select name="severity" defaultValue={rule?.severity ?? 'medium'}>
            {severityTypes.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </Select>,
        )}
      </div>
      {fieldLabel(
        'Description',
        <Textarea
          name="description"
          defaultValue={rule?.description}
          required
        />,
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {fieldLabel(
          'Trigger',
          <Select
            name="triggerType"
            defaultValue={rule?.triggerType ?? 'ai_assisted'}
          >
            {triggerTypes.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </Select>,
        )}
        {fieldLabel(
          'Action',
          <Select
            name="actionType"
            defaultValue={rule?.actionType ?? 'require_approval'}
          >
            {actionTypes.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </Select>,
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {fieldLabel(
          'Branch pattern',
          <Input
            name="branchPattern"
            placeholder="main, release/*"
            defaultValue={rule?.branchPattern}
          />,
        )}
        {fieldLabel(
          'Path pattern',
          <Input
            name="pathPattern"
            placeholder="auth, prisma/migrations"
            defaultValue={rule?.pathPattern}
          />,
        )}
        {fieldLabel(
          'PR label',
          <Input
            name="labelPattern"
            placeholder="security, billing"
            defaultValue={rule?.labelPattern}
          />,
        )}
        {fieldLabel(
          'Agent source',
          <Select name="agentSource" defaultValue={rule?.agentSource ?? ''}>
            {agentSources.map((source) => (
              <option key={source || 'any'} value={source}>
                {formatLabel(source)}
              </option>
            ))}
          </Select>,
        )}
        {fieldLabel(
          'Minimum risk',
          <Select
            name="minimumRiskLevel"
            defaultValue={rule?.minimumRiskLevel ?? ''}
          >
            {riskLevels.map((level) => (
              <option key={level || 'any'} value={level}>
                {formatLabel(level)}
              </option>
            ))}
          </Select>,
        )}
        {fieldLabel(
          'Suggested reviewer',
          <Input
            name="codeOwnerHint"
            placeholder="Security owner"
            defaultValue={rule?.codeOwnerHint}
          />,
        )}
      </div>
    </>
  )
}

export default async function RepositoryRulesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const status =
    typeof resolvedSearchParams?.status === 'string'
      ? resolvedSearchParams.status
      : undefined
  const organization = await getCurrentOrganization()
  const repository = await getRepository(organization.id, id)
  if (!repository) notFound()
  const [rules, pullRequests] = await Promise.all([
    getRepositoryRules(organization.id, id),
    getRepositoryPullRequests(organization.id, id),
  ])
  const customRulesAvailable = isFeatureAvailable(
    organization.planKey,
    'customRules',
  )
  const previewPullRequests = pullRequests.slice(0, 3).map((pullRequest) => ({
    pullRequest,
    violations: evaluateRepoRules(rules, {
      aiAssisted: pullRequest.aiAssisted,
      riskLevel: pullRequest.riskLevel,
      ciStatus: pullRequest.ciStatus,
      testGapStatus: pullRequest.testGapStatus,
      riskSignals: pullRequest.riskSignals,
      branch: pullRequest.branch,
      agentSource: pullRequest.agentSource,
      files: pullRequest.files,
      labels: [],
    }),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${repository.name} Rules`}
        description="Manage repository policy, scopes, actions, templates, and reviewer hints evaluated against every synced pull request."
      />

      {status && statusMessages[status] ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            {statusMessages[status]}
          </CardContent>
        </Card>
      ) : null}

      {!customRulesAvailable ? (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-medium text-foreground">
                Custom rules require the Team plan
              </div>
              <div className="text-sm text-muted-foreground">
                Upgrade to create templates, scoped policies, and rule actions
                for this repository.
              </div>
            </div>
            <Button asChild>
              <a href="/settings/billing">View upgrade options</a>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {ruleTemplates.map((template) => (
          <Card key={template.key}>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold text-foreground">
                    {template.name}
                  </h2>
                  <RiskBadge level={template.severity} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{formatLabel(template.triggerType)}</Badge>
                <Badge>{formatLabel(template.actionType)}</Badge>
                {template.pathPattern ? (
                  <Badge>{template.pathPattern}</Badge>
                ) : null}
              </div>
              <form action={`/api/repositories/${id}/rules`} method="post">
                <input type="hidden" name="_action" value="apply_template" />
                <input type="hidden" name="templateKey" value={template.key} />
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={!customRulesAvailable}
                >
                  Apply template
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Create custom rule
            </h2>
            <p className="text-sm text-muted-foreground">
              Scope policy by branch, path, agent, label, or minimum risk level.
            </p>
          </div>
          <form
            action={`/api/repositories/${id}/rules`}
            method="post"
            className="space-y-4"
          >
            <input type="hidden" name="_action" value="create" />
            <RuleFields />
            <Button type="submit" disabled={!customRulesAvailable}>
              Create rule
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Active policy
            </h2>
            <p className="text-sm text-muted-foreground">
              {rules.length
                ? `${rules.length} rules configured for this repository.`
                : 'No repository rules configured yet.'}
            </p>
          </div>
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-card border border-border p-4 shadow-card"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-foreground">
                        {rule.name}
                      </h3>
                      <RiskBadge level={rule.severity} />
                      <Badge tone={rule.enabled ? 'green' : 'slate'}>
                        {rule.enabled ? 'enabled' : 'disabled'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {rule.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{formatLabel(rule.triggerType)}</Badge>
                      <Badge>{formatLabel(rule.actionType)}</Badge>
                      {rule.branchPattern ? (
                        <Badge>Branch: {rule.branchPattern}</Badge>
                      ) : null}
                      {rule.pathPattern ? (
                        <Badge>Path: {rule.pathPattern}</Badge>
                      ) : null}
                      {rule.labelPattern ? (
                        <Badge>Label: {rule.labelPattern}</Badge>
                      ) : null}
                      {rule.agentSource ? (
                        <Badge>Agent: {formatLabel(rule.agentSource)}</Badge>
                      ) : null}
                      {rule.minimumRiskLevel ? (
                        <Badge>
                          Min risk: {formatLabel(rule.minimumRiskLevel)}
                        </Badge>
                      ) : null}
                      {rule.codeOwnerHint ? (
                        <Badge>Reviewer: {rule.codeOwnerHint}</Badge>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Updated {formatDate(rule.updatedAt)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form
                      action={`/api/repositories/${id}/rules/${rule.id}`}
                      method="post"
                    >
                      <input type="hidden" name="_action" value="toggle" />
                      <input
                        type="hidden"
                        name="enabled"
                        value={rule.enabled ? 'false' : 'true'}
                      />
                      <Button
                        type="submit"
                        size="sm"
                        variant="secondary"
                        disabled={!customRulesAvailable}
                      >
                        {rule.enabled ? 'Disable' : 'Enable'}
                      </Button>
                    </form>
                    <form
                      action={`/api/repositories/${id}/rules/${rule.id}`}
                      method="post"
                    >
                      <input type="hidden" name="_action" value="duplicate" />
                      <Button
                        type="submit"
                        size="sm"
                        variant="secondary"
                        disabled={!customRulesAvailable}
                      >
                        Duplicate
                      </Button>
                    </form>
                    <form
                      action={`/api/repositories/${id}/rules/${rule.id}`}
                      method="post"
                    >
                      <input type="hidden" name="_action" value="delete" />
                      <Button
                        type="submit"
                        size="sm"
                        variant="danger"
                        disabled={!customRulesAvailable}
                      >
                        Delete
                      </Button>
                    </form>
                  </div>
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-foreground">
                    Edit rule
                  </summary>
                  <form
                    action={`/api/repositories/${id}/rules/${rule.id}`}
                    method="post"
                    className="mt-4 space-y-4"
                  >
                    <input type="hidden" name="_action" value="update" />
                    <RuleFields rule={rule} />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!customRulesAvailable}
                    >
                      Save changes
                    </Button>
                  </form>
                </details>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Policy preview
            </h2>
            <p className="text-sm text-muted-foreground">
              Recent pull requests evaluated against the current enabled policy.
            </p>
          </div>
          <div className="space-y-3">
            {previewPullRequests.length ? (
              previewPullRequests.map(({ pullRequest, violations }) => (
                <div
                  key={pullRequest.id}
                  className="rounded-card border border-border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-foreground">
                        #{pullRequest.number} {pullRequest.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {pullRequest.branch} -{' '}
                        {formatLabel(pullRequest.agentSource)}
                      </div>
                    </div>
                    <Badge tone={violations.length ? 'orange' : 'green'}>
                      {violations.length
                        ? `${violations.length} rules fire`
                        : 'No rules fire'}
                    </Badge>
                  </div>
                  {violations.length ? (
                    <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                      {violations.map((violation) => (
                        <li key={violation.id}>{violation.summary}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-card border border-dashed border-border bg-surface-muted p-6 text-sm text-muted-foreground">
                Sync pull requests to preview policy impact.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
