import {
  AlertTriangle,
  CheckCircle2,
  Fingerprint,
  Info,
  Sparkles,
} from 'lucide-react'
import { PageHeader } from '@/components/app/page-header'
import { SettingsNav } from '@/components/app/settings-nav'
import { AgentBadge } from '@/components/app/status-badge'
import { EmptyState } from '@/components/app/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  getCurrentOrganization,
  listAgentIdentityRules,
} from '@/lib/data/app-data'
import { canManageRules } from '@/lib/collaboration'
import { isFeatureAvailable } from '@/lib/plans'
import type { AgentIdentityMatchType, AgentSource } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { createAgentIdentityRule, mutateAgentIdentityRule } from './actions'
import { SubmitButton } from './submit-button'

const configurableAgents: AgentSource[] = [
  'cursor',
  'codex',
  'claude_code',
  'copilot',
  'devin',
  'unknown',
]

const matchTypes: AgentIdentityMatchType[] = [
  'commit_trailer',
  'bot_login',
  'email_domain',
  'branch_prefix',
  'label',
]

const matchTypeHints: Record<AgentIdentityMatchType, string> = {
  commit_trailer: 'noreply@anthropic.com',
  bot_login: 'devin-ai-integration',
  email_domain: 'cursor.sh',
  branch_prefix: 'cursor/',
  label: 'ai-generated',
}

const builtInDetections: Array<{ agent: AgentSource; signals: string }> = [
  {
    agent: 'claude_code',
    signals: 'Co-authored-by: Claude, @anthropic.com, claude/ branches',
  },
  {
    agent: 'copilot',
    signals: 'Copilot bot account, copilot@github.com, copilot/ branches',
  },
  {
    agent: 'cursor',
    signals: 'cursoragent account, @cursor.sh, cursor/ branches',
  },
  { agent: 'devin', signals: 'devin-ai-integration[bot], devin/ branches' },
  { agent: 'codex', signals: 'chatgpt-codex-connector, codex/ branches' },
]

type StatusEntry = { tone: 'success' | 'info' | 'danger'; message: string }

const statusMessages: Record<string, StatusEntry> = {
  created: { tone: 'success', message: 'Identity rule created.' },
  enabled: { tone: 'success', message: 'Identity rule enabled.' },
  disabled: { tone: 'info', message: 'Identity rule disabled.' },
  deleted: { tone: 'info', message: 'Identity rule deleted.' },
  forbidden: {
    tone: 'danger',
    message: 'Only organization owners and admins can manage identity rules.',
  },
  auth_required: {
    tone: 'danger',
    message: 'Sign in is required to manage identity rules.',
  },
  not_found: { tone: 'danger', message: 'Identity rule not found.' },
  invalid_form: {
    tone: 'danger',
    message: 'Check the rule fields and try again.',
  },
  upgrade_required: {
    tone: 'info',
    message: 'Custom identity rules require the Team plan or higher.',
  },
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
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

export default async function AgentRegistryPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const [params, organization] = await Promise.all([
    searchParams ?? Promise.resolve(undefined),
    getCurrentOrganization(),
  ])
  const status = typeof params?.status === 'string' ? params.status : undefined
  const rules = await listAgentIdentityRules(organization.id)
  const canManage = canManageRules(organization.role)
  const customRulesAvailable = isFeatureAvailable(
    organization.planKey,
    'customRules',
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Fingerprint className="size-3.5" aria-hidden="true" />
            Workspace
          </span>
        }
        title="Agent identity registry"
        description="Teach AgentGate which accounts, emails, branches, labels, and commit trailers map to each AI coding agent. Rules sharpen attribution on every synced pull request."
      />
      <SettingsNav />

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
                  Custom identity rules require the Team plan
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  Built-in detection runs on every plan. Upgrade to add your own
                  bot accounts, branch prefixes, and commit-trailer mappings.
                </div>
              </div>
            </div>
            <Button asChild>
              <a href="/settings/billing">View upgrade options</a>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Built-in detection</CardTitle>
          <p className="text-xs text-muted-foreground">
            These agents are recognized automatically from commit trailers, bot
            accounts, author emails, and branch prefixes — no setup required.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {builtInDetections.map((detection) => (
            <div
              key={detection.agent}
              className="flex flex-col gap-1.5 rounded-control border border-border bg-surface-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <AgentBadge agentSource={detection.agent} />
              <span className="font-mono text-[11px] text-subtle-foreground">
                {detection.signals}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add identity rule</CardTitle>
          <p className="text-xs text-muted-foreground">
            Map a signal to an agent. Custom rules are authoritative and
            override weaker built-in heuristics.
          </p>
        </CardHeader>
        <CardContent>
          <form action={createAgentIdentityRule} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1.5">
                <span className="block text-[11px] font-medium uppercase tracking-wider text-subtle-foreground">
                  Agent
                </span>
                <Select name="agentSource" defaultValue="claude_code">
                  {configurableAgents.map((agent) => (
                    <option key={agent} value={agent}>
                      {formatLabel(agent)}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="space-y-1.5">
                <span className="block text-[11px] font-medium uppercase tracking-wider text-subtle-foreground">
                  Match type
                </span>
                <Select name="matchType" defaultValue="commit_trailer">
                  {matchTypes.map((type) => (
                    <option key={type} value={type}>
                      {formatLabel(type)}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="space-y-1.5">
                <span className="block text-[11px] font-medium uppercase tracking-wider text-subtle-foreground">
                  Pattern
                </span>
                <Input
                  name="pattern"
                  placeholder={matchTypeHints.commit_trailer}
                  maxLength={200}
                  required
                />
              </label>
            </div>
            <SubmitButton
              disabled={!customRulesAvailable || !canManage}
              pendingChildren="Adding..."
            >
              Add rule
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom identity rules</CardTitle>
          <p className="text-xs text-muted-foreground">
            {rules.length
              ? `${rules.length} ${rules.length === 1 ? 'rule' : 'rules'} configured for this workspace.`
              : 'No custom identity rules yet.'}
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {rules.length ? (
            rules.map((rule) => (
              <div
                key={rule.id}
                className="flex flex-col gap-3 rounded-control border border-border bg-surface-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <AgentBadge agentSource={rule.agentSource} />
                    <Badge tone={rule.enabled ? 'green' : 'slate'} withDot>
                      {rule.enabled ? 'enabled' : 'disabled'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone="slate">
                      Match: {formatLabel(rule.matchType)}
                    </Badge>
                    <Badge tone="slate">Pattern: {rule.pattern}</Badge>
                  </div>
                  <div className="text-xs text-subtle-foreground">
                    Updated {formatDate(rule.updatedAt)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={mutateAgentIdentityRule.bind(null, rule.id)}>
                    <input type="hidden" name="_action" value="toggle" />
                    <input
                      type="hidden"
                      name="enabled"
                      value={rule.enabled ? 'false' : 'true'}
                    />
                    <SubmitButton
                      size="sm"
                      variant="secondary"
                      disabled={!customRulesAvailable || !canManage}
                      pendingChildren={
                        rule.enabled ? 'Disabling...' : 'Enabling...'
                      }
                    >
                      {rule.enabled ? 'Disable' : 'Enable'}
                    </SubmitButton>
                  </form>
                  <form action={mutateAgentIdentityRule.bind(null, rule.id)}>
                    <input type="hidden" name="_action" value="delete" />
                    <SubmitButton
                      size="sm"
                      variant="danger"
                      disabled={!customRulesAvailable || !canManage}
                      pendingChildren="Deleting..."
                    >
                      Delete
                    </SubmitButton>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={Fingerprint}
              title="No custom identity rules"
              description="Add a rule above to map your own accounts and branches to an agent."
              className="py-6"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
