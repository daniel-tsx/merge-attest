import { notFound } from 'next/navigation'
import type React from 'react'
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Info,
  MessageSquareText,
  ShieldCheck,
} from 'lucide-react'
import { PageHeader } from '@/components/app/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  getCurrentOrganization,
  getRepository,
  getRepositoryReviewSettings,
} from '@/lib/data/app-data'
import { canManageRules } from '@/lib/collaboration'
import { formatDate } from '@/lib/utils'
import { updateRepositoryAiSettings } from './actions'

const statusMessages: Record<
  string,
  { tone: 'success' | 'danger' | 'info'; message: string }
> = {
  updated: { tone: 'success', message: 'AI review settings updated.' },
  forbidden: {
    tone: 'danger',
    message:
      'Only organization owners and admins can manage AI review settings.',
  },
  auth_required: {
    tone: 'danger',
    message: 'Sign in is required to manage AI review settings.',
  },
  not_found: {
    tone: 'danger',
    message: 'Repository not found.',
  },
}

function formatLabel(value: string) {
  return value.replaceAll('_', ' ')
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

function StatusCallout({
  status,
}: {
  status: { tone: 'success' | 'danger' | 'info'; message: string }
}) {
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

function ToggleField({
  name,
  title,
  description,
  defaultChecked,
  disabled,
}: {
  name: string
  title: string
  description: string
  defaultChecked: boolean
  disabled?: boolean
}) {
  return (
    <div className="flex items-start gap-3 rounded-card border border-border bg-surface-muted/20 p-4">
      <Switch
        id={name}
        name={name}
        value="on"
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="mt-0.5"
      />
      <div className="min-w-0">
        <Label
          htmlFor={name}
          className="block text-sm font-medium text-foreground"
        >
          {title}
        </Label>
        <span className="mt-1 block text-sm text-muted-foreground">
          {description}
        </span>
      </div>
    </div>
  )
}

export default async function RepositoryAiSettingsPage({
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
  const repository = await getRepository(organization.id, id)
  if (!repository) notFound()

  const settings = await getRepositoryReviewSettings(organization.id, id)
  const status =
    typeof resolvedSearchParams?.status === 'string'
      ? resolvedSearchParams.status
      : undefined
  const canEdit = canManageRules(organization.role)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Bot className="size-3.5" aria-hidden="true" />
            {repository.name}
          </span>
        }
        title="AI review settings"
        description="Tune advisory AI reviews without changing deterministic MergeAttest rules or approval policy."
        actions={
          <Button asChild variant="secondary">
            <a href={`/repositories/${repository.id}/rules`}>
              <ShieldCheck aria-hidden="true" />
              Rules
            </a>
          </Button>
        }
      />

      {status && statusMessages[status] ? (
        <StatusCallout status={statusMessages[status]} />
      ) : null}

      {!canEdit ? (
        <StatusCallout
          status={{
            tone: 'info',
            message:
              'View-only access. Ask an owner or admin to change AI review settings.',
          }}
        />
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
              AI reviews
            </div>
            <div className="mt-2">
              <Badge
                tone={settings.aiReviewsEnabled ? 'green' : 'slate'}
                withDot
              >
                {settings.aiReviewsEnabled ? 'enabled' : 'disabled'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
              Review depth
            </div>
            <div className="mt-2 font-medium capitalize text-foreground">
              {formatLabel(settings.reviewDepth)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
              Last updated
            </div>
            <div className="mt-2 font-medium text-foreground">
              {formatDate(settings.updatedAt)}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <MessageSquareText className="size-3.5" aria-hidden="true" />
            Review controls
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            These settings apply to new review jobs and worker processing.
          </p>
        </CardHeader>
        <CardContent>
          <form
            action={updateRepositoryAiSettings.bind(null, repository.id)}
            className="space-y-6"
          >
            <ToggleField
              name="aiReviewsEnabled"
              title="Run AI reviews for this repository"
              description="When disabled, new pull request syncs will not enqueue AI review jobs and queued jobs will skip before provider execution."
              defaultChecked={settings.aiReviewsEnabled}
              disabled={!canEdit}
            />

            <div className="grid gap-4 md:grid-cols-3">
              {fieldLabel(
                'Review depth',
                <Select
                  name="reviewDepth"
                  defaultValue={settings.reviewDepth}
                  disabled={!canEdit}
                >
                  <option value="standard">Standard</option>
                  <option value="deep">Deep</option>
                </Select>,
              )}
              {fieldLabel(
                'Minimum severity',
                <Select
                  name="minimumSeverity"
                  defaultValue={settings.minimumSeverity}
                  disabled={!canEdit}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </Select>,
              )}
              {fieldLabel(
                'Model override',
                <Input
                  name="model"
                  placeholder="openai/gpt-5.1"
                  defaultValue={settings.model}
                  disabled={!canEdit}
                />,
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {fieldLabel(
                'Ignored paths',
                <Textarea
                  name="ignoredPaths"
                  defaultValue={settings.ignoredPaths.join('\n')}
                  placeholder={`docs/\n*.snap\ngenerated/`}
                  disabled={!canEdit}
                />,
              )}
              {fieldLabel(
                'Stack tags',
                <Textarea
                  name="stackTags"
                  defaultValue={settings.stackTags.join('\n')}
                  placeholder={`nextjs\nprisma\ngithub-app`}
                  disabled={!canEdit}
                />,
              )}
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <ToggleField
                name="publishInlineComments"
                title="Inline comments"
                description="Publish validated findings directly on changed GitHub diff lines."
                defaultChecked={settings.publishInlineComments}
                disabled={!canEdit}
              />
              <ToggleField
                name="publishManagedComment"
                title="Managed summary"
                description="Create or update one MergeAttest AI review summary comment per review job."
                defaultChecked={settings.publishManagedComment}
                disabled={!canEdit}
              />
              <ToggleField
                name="publishCheckRun"
                title="Check run"
                description="Publish an advisory MergeAttest AI Review check on the pull request head SHA."
                defaultChecked={settings.publishCheckRun}
                disabled={!canEdit}
              />
            </div>

            <Button type="submit" disabled={!canEdit}>
              Save AI review settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
