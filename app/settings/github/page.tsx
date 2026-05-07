import { GitPullRequest, RefreshCw } from 'lucide-react'
import { EmptyState } from '@/components/app/empty-state'
import { PageHeader } from '@/components/app/page-header'
import { SettingsNav } from '@/components/app/settings-nav'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getCurrentOrganization,
  listGitHubWebhookDiagnostics,
  listRepositories,
} from '@/lib/data/app-data'
import { createGitHubInstallationState } from '@/lib/github-installation-state'
import { getGitHubAppInstallUrl } from '@/lib/github'
import { formatDate } from '@/lib/utils'

const envVars = [
  'GITHUB_APP_ID',
  'GITHUB_APP_SLUG',
  'GITHUB_APP_PRIVATE_KEY',
  'GITHUB_WEBHOOK_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'JOB_RUNNER_SECRET',
]

const syncMessages: Record<string, string> = {
  live: 'GitHub sync completed against the connected installation.',
  demo: 'GitHub sync could not run because the workspace is not fully connected.',
}

const backfillMessages: Record<string, string> = {
  live: 'Backfill completed for stale connected repositories.',
  demo: 'Backfill could not run because GitHub is not fully connected.',
}

function retryMessage(value: string) {
  const processed = Number(value)
  if (!Number.isFinite(processed)) return undefined
  return `Webhook retry processed ${processed} queued deliver${processed === 1 ? 'y' : 'ies'}.`
}

function errorMessage(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/^\w/, (letter) => letter.toUpperCase())
}

function readParam(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const value = params?.[key]
  return Array.isArray(value) ? value[0] : value
}

export default async function GitHubSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = searchParams ? await searchParams : undefined
  const syncStatus = readParam(params, 'sync')
  const backfillStatus = readParam(params, 'backfill')
  const retryStatus = readParam(params, 'retry')
  const errorStatus = readParam(params, 'error')
  const organization = await getCurrentOrganization()
  const [repositories, webhookDiagnostics] = await Promise.all([
    listRepositories(organization.id),
    listGitHubWebhookDiagnostics(organization.id),
  ])
  const configured = envVars.every((key) => Boolean(process.env[key]))
  const installUrl = getGitHubAppInstallUrl(
    createGitHubInstallationState(organization.id),
  )
  const failedDeliveries = webhookDiagnostics.filter(
    (delivery) => delivery.status === 'failed',
  ).length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="GitHub app"
        description="Installation settings, webhook endpoint, and demo-mode state for GitHub pull request sync."
        actions={
          installUrl ? (
            <Button variant="secondary" asChild>
              <a href={installUrl}>
                <GitPullRequest aria-hidden="true" />
                Install GitHub App
              </a>
            </Button>
          ) : (
            <Button variant="secondary" disabled>
              <GitPullRequest aria-hidden="true" />
              Set GITHUB_APP_SLUG
            </Button>
          )
        }
      />
      <SettingsNav />
      {syncStatus || backfillStatus || retryStatus || errorStatus ? (
        <Card
          className={
            errorStatus
              ? 'border-danger-border bg-danger-soft/40'
              : 'border-info-border bg-info-soft/40'
          }
        >
          <CardContent
            className={`space-y-1.5 text-sm ${errorStatus ? 'text-danger' : 'text-info'}`}
          >
            {syncStatus && syncMessages[syncStatus] ? (
              <p>{syncMessages[syncStatus]}</p>
            ) : null}
            {backfillStatus && backfillMessages[backfillStatus] ? (
              <p>{backfillMessages[backfillStatus]}</p>
            ) : null}
            {retryStatus && retryMessage(retryStatus) ? (
              <p>{retryMessage(retryStatus)}</p>
            ) : null}
            {errorStatus ? (
              <p>GitHub setup failed: {errorMessage(errorStatus)}.</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Integration status</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="rounded-control border border-border bg-surface-muted/30 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
              Mode
            </div>
            <div className="mt-2">
              <Badge tone={configured ? 'green' : 'blue'} withDot>
                {configured ? 'configured' : 'demo mode'}
              </Badge>
            </div>
          </div>
          <div className="rounded-control border border-border bg-surface-muted/30 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
              Webhook endpoint
            </div>
            <div className="mt-2 break-all rounded-control bg-surface px-2 py-1 font-mono text-xs">
              /api/github/webhook
            </div>
          </div>
          <div className="rounded-control border border-border bg-surface-muted/30 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
              Repositories
            </div>
            <div className="mt-2 text-sm font-semibold">
              {repositories.length}{' '}
              <span className="font-normal text-muted-foreground">
                {organization.dataMode === 'live' ? 'synced' : 'demo'}
              </span>
            </div>
          </div>
          <div className="rounded-control border border-border bg-surface-muted/30 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
              Organization
            </div>
            <div className="mt-2 text-sm font-semibold">
              {organization.name}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Manual sync</CardTitle>
          <p className="text-xs text-muted-foreground">
            Imports repositories and open pull requests from the connected
            GitHub installation.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action="/api/github/sync/repositories"
            method="post"
            className="flex flex-wrap items-center gap-3"
          >
            <input type="hidden" name="redirectTo" value="/settings/github" />
            <Button type="submit">
              <RefreshCw aria-hidden="true" />
              Sync repositories now
            </Button>
          </form>
          <div className="flex flex-wrap gap-2 border-t border-divider pt-4">
            <form action="/api/github/backfill" method="post">
              <Button type="submit" variant="secondary" size="sm">
                Backfill stale repositories
              </Button>
            </form>
            <form action="/api/github/webhook/retry" method="post">
              <Button type="submit" variant="secondary" size="sm">
                Retry failed webhooks
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Sync diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-control border border-border bg-surface-muted/30 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                Recent deliveries
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
                {webhookDiagnostics.length}
              </div>
            </div>
            <div className="rounded-control border border-border bg-surface-muted/30 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                Failed deliveries
              </div>
              <div
                className={`mt-2 text-2xl font-semibold tabular-nums tracking-tight ${failedDeliveries > 0 ? 'text-danger' : 'text-foreground'}`}
              >
                {failedDeliveries}
              </div>
            </div>
            <div className="rounded-control border border-border bg-surface-muted/30 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                Last delivery
              </div>
              <div className="mt-2 text-sm font-medium">
                {webhookDiagnostics[0]
                  ? formatDate(webhookDiagnostics[0].createdAt)
                  : 'none yet'}
              </div>
            </div>
          </div>
          <div className="divide-y divide-divider rounded-control border border-border">
            {webhookDiagnostics.map((delivery) => (
              <div
                key={delivery.id}
                className="grid gap-2 p-3 text-sm md:grid-cols-[1fr_120px_90px_160px] md:items-center"
              >
                <div>
                  <div className="font-medium text-foreground">
                    <span className="font-mono">{delivery.event}</span>
                    {delivery.action ? (
                      <span className="font-mono text-subtle-foreground">
                        .{delivery.action}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 text-xs text-subtle-foreground">
                    {delivery.message ??
                      delivery.lastError ??
                      delivery.deliveryId}
                  </div>
                </div>
                <div>
                  <Badge
                    tone={
                      delivery.status === 'processed'
                        ? 'green'
                        : delivery.status === 'failed'
                          ? 'red'
                          : delivery.status === 'processing'
                            ? 'yellow'
                            : 'slate'
                    }
                    withDot
                  >
                    {delivery.status}
                  </Badge>
                </div>
                <div className="text-xs tabular-nums text-muted-foreground">
                  {delivery.attemptCount} attempts
                </div>
                <div className="text-xs text-subtle-foreground">
                  {delivery.nextRetryAt
                    ? `Retry ${formatDate(delivery.nextRetryAt)}`
                    : delivery.processedAt
                      ? `Processed ${formatDate(delivery.processedAt)}`
                      : `Received ${formatDate(delivery.createdAt)}`}
                </div>
              </div>
            ))}
            {webhookDiagnostics.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="No webhook deliveries yet"
                  description="Deliveries will appear here once the GitHub installation sends events."
                />
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Required environment variables</CardTitle>
          <p className="text-xs text-muted-foreground">
            These must be present for live GitHub sync to work.
          </p>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          {envVars.map((key) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-control border border-border bg-surface-muted/30 px-3 py-2"
            >
              <code className="font-mono text-xs text-foreground">{key}</code>
              <Badge tone={process.env[key] ? 'green' : 'slate'} withDot>
                {process.env[key] ? 'set' : 'missing'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
