import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type React from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { PageHeader } from '@/components/app/page-header'
import { RiskBadge } from '@/components/app/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
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
import { createRule, mutateRule } from './actions'
import { SubmitButton } from './submit-button'

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

type StatusEntry = { tone: 'success' | 'info' | 'danger'; message: string }

const statusMessages: Record<string, StatusEntry> = {
  created: { tone: 'success', message: 'Rule created.' },
  updated: { tone: 'success', message: 'Rule updated.' },
  enabled: { tone: 'success', message: 'Rule enabled.' },
  disabled: { tone: 'info', message: 'Rule disabled.' },
  deleted: { tone: 'info', message: 'Rule deleted.' },
  duplicated: {
    tone: 'info',
    message: 'Rule duplicated as a disabled draft.',
  },
  template_applied: { tone: 'success', message: 'Template applied.' },
  forbidden: {
    tone: 'danger',
    message: 'Only organization owners and admins can manage rules.',
  },
  auth_required: {
    tone: 'danger',
    message: 'Sign in is required to manage rules.',
  },
  not_found: { tone: 'danger', message: 'Rule or repository not found.' },
  invalid_form: {
    tone: 'danger',
    message: 'Check the rule fields and try again.',
  },
  upgrade_required: {
    tone: 'info',
    message: 'Custom repository rules require the Team plan or higher.',
  },
}

function formatLabel(value: string) {
  return value ? value.replaceAll('_', ' ') : 'Any'
}

function fieldLabel(label: string, children: React.ReactNode) {
  return (
    <label className="space-y-1.5">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-subtle-foreground">
        {label}
      </span>
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
          <Input
            name="name"
            defaultValue={rule?.name}
            maxLength={120}
            required
          />,
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
          maxLength={500}
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
            maxLength={500}
          />,
        )}
        {fieldLabel(
          'Path pattern',
          <Input
            name="pathPattern"
            placeholder="auth, prisma/migrations"
            defaultValue={rule?.pathPattern}
            maxLength={500}
          />,
        )}
        {fieldLabel(
          'PR label',
          <Input
            name="labelPattern"
            placeholder="security, billing"
            defaultValue={rule?.labelPattern}
            maxLength={500}
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
            maxLength={500}
          />,
        )}
      </div>
    </>
  )
}

function StatusCallout({ status }: { status: StatusEntry }) {
  const Icon =
    status.tone === 'success'
      ? CheckCircle2
      : status.tone === 'danger'
        ? AlertTriangle
        : Info
  const tone =
    status.tone === 'success'
      ? 'border-success-border bg-success-soft text-success-strong'
      : status.tone === 'danger'
        ? 'border-danger-border bg-danger-soft text-danger'
        : 'border-info-border bg-info-soft text-info'
  return (
    <div
      role="status"
      className={`flex items-start gap-2.5 rounded-card border px-4 py-3 text-sm ${tone}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {status.message}
    </div>
  )
}

export default async function RepositoryRulesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ id }, resolvedSearchParams, organization] = await Promise.all([
    params,
    searchParams ?? Promise.resolve(undefined),
    getCurrentOrganization(),
  ])
  const status =
    typeof resolvedSearchParams?.status === 'string'
      ? resolvedSearchParams.status
      : undefined
  const repository = await getRepository(organization.id, id)
  if (!repository) notFound()
  const customRulesAvailable = isFeatureAvailable(
    organization.planKey,
    'customRules',
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            {repository.name}
          </span>
        }
        title="Repository rules"
        description="Manage policy, scopes, actions, templates, and reviewer hints evaluated against every synced pull request."
      />

      {status && statusMessages[status] ? (
        <StatusCallout status={statusMessages[status]} />
      ) : null}

      {!customRulesAvailable ? (
        <Card className="border-info-border bg-info-soft/40">
          <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-control bg-info-soft text-info">
                <Sparkles className="size-4" aria-hidden="true" />
              </div>
              <div>
                <div className="font-semibold text-foreground">
                  Custom rules require the Team plan
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  Upgrade to create templates, scoped policies, and rule actions
                  for this repository.
                </div>
              </div>
            </div>
            <Button asChild>
              <a href="/settings/billing">View upgrade options</a>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Rule templates
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Apply curated policies in one click.
            </p>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {ruleTemplates.map((template) => (
            <Card
              key={template.key}
              className="transition-shadow hover:shadow-card-hover"
            >
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold tracking-tight text-foreground">
                      {template.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {template.description}
                    </p>
                  </div>
                  <RiskBadge level={template.severity} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone="slate">
                    Trigger: {formatLabel(template.triggerType)}
                  </Badge>
                  <Badge tone="slate">
                    Action: {formatLabel(template.actionType)}
                  </Badge>
                  {template.pathPattern ? (
                    <Badge tone="slate">Path: {template.pathPattern}</Badge>
                  ) : null}
                </div>
                <form action={createRule.bind(null, id)}>
                  <input type="hidden" name="_action" value="apply_template" />
                  <input
                    type="hidden"
                    name="templateKey"
                    value={template.key}
                  />
                  <SubmitButton
                    variant="secondary"
                    size="sm"
                    disabled={!customRulesAvailable}
                    pendingChildren="Applying..."
                  >
                    Apply template
                  </SubmitButton>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Create custom rule</CardTitle>
          <p className="text-xs text-muted-foreground">
            Scope policy by branch, path, agent, label, or minimum risk level.
          </p>
        </CardHeader>
        <CardContent>
          <form
            action={createRule.bind(null, id)}
            className="space-y-4"
          >
            <input type="hidden" name="_action" value="create" />
            <RuleFields />
            <SubmitButton
              disabled={!customRulesAvailable}
              pendingChildren="Creating..."
            >
              Create rule
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Suspense fallback={<RulesPolicySkeleton />}>
        <RulesPolicySections
          repositoryId={id}
          organizationId={organization.id}
          customRulesAvailable={customRulesAvailable}
        />
      </Suspense>
    </div>
  )
}

async function RulesPolicySections({
  repositoryId,
  organizationId,
  customRulesAvailable,
}: {
  repositoryId: string
  organizationId: string
  customRulesAvailable: boolean
}) {
  const [rules, pullRequests] = await Promise.all([
    getRepositoryRules(organizationId, repositoryId),
    getRepositoryPullRequests(organizationId, repositoryId),
  ])
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
    <>
      <Card>
        <CardHeader>
          <CardTitle>Active policy</CardTitle>
          <p className="text-xs text-muted-foreground">
            {rules.length
              ? `${rules.length} ${rules.length === 1 ? 'rule' : 'rules'} configured for this repository.`
              : 'No repository rules configured yet.'}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="rounded-card border border-border bg-surface-muted/20 p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {rule.name}
                    </h3>
                    <RiskBadge level={rule.severity} />
                    <Badge tone={rule.enabled ? 'green' : 'slate'} withDot>
                      {rule.enabled ? 'enabled' : 'disabled'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {rule.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone="slate">
                      Trigger: {formatLabel(rule.triggerType)}
                    </Badge>
                    <Badge tone="slate">
                      Action: {formatLabel(rule.actionType)}
                    </Badge>
                    {rule.branchPattern ? (
                      <Badge tone="slate">Branch: {rule.branchPattern}</Badge>
                    ) : null}
                    {rule.pathPattern ? (
                      <Badge tone="slate">Path: {rule.pathPattern}</Badge>
                    ) : null}
                    {rule.labelPattern ? (
                      <Badge tone="slate">Label: {rule.labelPattern}</Badge>
                    ) : null}
                    {rule.agentSource ? (
                      <Badge tone="slate">
                        Agent: {formatLabel(rule.agentSource)}
                      </Badge>
                    ) : null}
                    {rule.minimumRiskLevel ? (
                      <Badge tone="slate">
                        Min risk: {formatLabel(rule.minimumRiskLevel)}
                      </Badge>
                    ) : null}
                    {rule.codeOwnerHint ? (
                      <Badge tone="slate">
                        Reviewer: {rule.codeOwnerHint}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-xs text-subtle-foreground">
                    Updated {formatDate(rule.updatedAt)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={mutateRule.bind(null, repositoryId, rule.id)}>
                    <input type="hidden" name="_action" value="toggle" />
                    <input
                      type="hidden"
                      name="enabled"
                      value={rule.enabled ? 'false' : 'true'}
                    />
                    <SubmitButton
                      size="sm"
                      variant="secondary"
                      disabled={!customRulesAvailable}
                      pendingChildren={
                        rule.enabled ? 'Disabling...' : 'Enabling...'
                      }
                    >
                      {rule.enabled ? 'Disable' : 'Enable'}
                    </SubmitButton>
                  </form>
                  <form action={mutateRule.bind(null, repositoryId, rule.id)}>
                    <input type="hidden" name="_action" value="duplicate" />
                    <SubmitButton
                      size="sm"
                      variant="secondary"
                      disabled={!customRulesAvailable}
                      pendingChildren="Duplicating..."
                    >
                      Duplicate
                    </SubmitButton>
                  </form>
                  <form action={mutateRule.bind(null, repositoryId, rule.id)}>
                    <input type="hidden" name="_action" value="delete" />
                    <SubmitButton
                      size="sm"
                      variant="danger"
                      disabled={!customRulesAvailable}
                      pendingChildren="Deleting..."
                    >
                      Delete
                    </SubmitButton>
                  </form>
                </div>
              </div>
              <details className="group mt-4 border-t border-divider pt-3">
                <summary className="cursor-pointer text-xs font-medium uppercase tracking-wider text-subtle-foreground hover:text-foreground">
                  Edit rule
                </summary>
                <form
                  action={mutateRule.bind(null, repositoryId, rule.id)}
                  className="mt-4 space-y-4"
                >
                  <input type="hidden" name="_action" value="update" />
                  <RuleFields rule={rule} />
                  <SubmitButton
                    size="sm"
                    disabled={!customRulesAvailable}
                    pendingChildren="Saving..."
                  >
                    Save changes
                  </SubmitButton>
                </form>
              </details>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Policy preview</CardTitle>
          <p className="text-xs text-muted-foreground">
            Recent pull requests evaluated against the current enabled policy.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {previewPullRequests.length ? (
            previewPullRequests.map(({ pullRequest, violations }) => (
              <div
                key={pullRequest.id}
                className="rounded-card border border-border bg-surface-muted/20 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      #{pullRequest.number} {pullRequest.title}
                    </div>
                    <div className="mt-0.5 text-xs text-subtle-foreground">
                      <span className="font-mono">{pullRequest.branch}</span> ·{' '}
                      <span className="capitalize">
                        {formatLabel(pullRequest.agentSource)}
                      </span>
                    </div>
                  </div>
                  <Badge
                    tone={violations.length ? 'orange' : 'green'}
                    withDot
                  >
                    {violations.length
                      ? `${violations.length} ${violations.length === 1 ? 'rule' : 'rules'} fire`
                      : 'No rules fire'}
                  </Badge>
                </div>
                {violations.length ? (
                  <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    {violations.map((violation) => (
                      <li
                        key={violation.id}
                        className="flex gap-2 text-xs text-muted-foreground"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-1.5 size-1 shrink-0 rounded-full bg-attention"
                        />
                        {violation.summary}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-card border border-dashed border-border bg-surface-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
              Sync pull requests to preview policy impact.
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function RulesPolicySkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading repository policy">
      {Array.from({ length: 2 }).map((_, card) => (
        <Card key={card}>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-4 w-32" />
            {Array.from({ length: 3 }).map((_, row) => (
              <Skeleton key={row} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      ))}
      <span className="sr-only">Loading repository policy</span>
    </div>
  )
}
