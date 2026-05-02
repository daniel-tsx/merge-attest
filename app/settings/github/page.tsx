import { GitPullRequest } from 'lucide-react'
import { PageHeader } from '@/components/app/page-header'
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
        title="GitHub App"
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
      {syncStatus || backfillStatus || retryStatus || errorStatus ? (
        <Card>
          <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
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
              <p className="text-danger">
                GitHub setup failed: {errorMessage(errorStatus)}.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <div className="text-xs uppercase text-slate-500">Mode</div>
            <div className="mt-2">
              <Badge tone={configured ? 'green' : 'blue'}>
                {configured ? 'configured' : 'demo mode'}
              </Badge>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">
              Webhook endpoint
            </div>
            <div className="mt-2 font-mono text-xs">/api/github/webhook</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Repositories</div>
            <div className="mt-2 font-semibold">
              {repositories.length}{' '}
              {organization.dataMode === 'live' ? 'synced' : 'demo'}{' '}
              repositories
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Organization</div>
            <div className="mt-2 font-semibold">{organization.name}</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Manual Sync</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action="/api/github/sync/repositories"
            method="post"
            className="flex flex-wrap items-center gap-3"
          >
            <input type="hidden" name="redirectTo" value="/settings/github" />
            <Button type="submit">
              <GitPullRequest aria-hidden="true" />
              Sync repositories now
            </Button>
            <p className="text-sm text-slate-600">
              Imports repositories and open pull requests from the connected
              GitHub installation.
            </p>
          </form>
          <div className="mt-4 flex flex-wrap gap-3">
            <form action="/api/github/backfill" method="post">
              <Button type="submit" variant="secondary">
                Backfill stale repositories
              </Button>
            </form>
            <form action="/api/github/webhook/retry" method="post">
              <Button type="submit" variant="secondary">
                Retry failed webhooks
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Sync Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-xs uppercase text-slate-500">
                Recent webhook deliveries
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {webhookDiagnostics.length}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-500">
                Failed deliveries
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {failedDeliveries}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-500">
                Last delivery
              </div>
              <div className="mt-2 text-sm font-medium">
                {webhookDiagnostics[0]
                  ? formatDate(webhookDiagnostics[0].createdAt)
                  : 'none yet'}
              </div>
            </div>
          </div>
          <div className="divide-y divide-slate-100 rounded-md border border-slate-200">
            {webhookDiagnostics.map((delivery) => (
              <div
                key={delivery.id}
                className="grid gap-2 p-3 text-sm md:grid-cols-[1fr_120px_90px_160px]"
              >
                <div>
                  <div className="font-medium text-slate-950">
                    {delivery.event}
                    {delivery.action ? `.${delivery.action}` : ''}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
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
                  >
                    {delivery.status}
                  </Badge>
                </div>
                <div className="text-slate-600">
                  {delivery.attemptCount} attempts
                </div>
                <div className="text-xs text-slate-500">
                  {delivery.nextRetryAt
                    ? `Retry ${formatDate(delivery.nextRetryAt)}`
                    : delivery.processedAt
                      ? `Processed ${formatDate(delivery.processedAt)}`
                      : `Received ${formatDate(delivery.createdAt)}`}
                </div>
              </div>
            ))}
            {webhookDiagnostics.length === 0 ? (
              <div className="p-4 text-sm text-slate-600">
                No webhook deliveries have been recorded for this workspace yet.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Required Environment Variables</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          {envVars.map((key) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
            >
              <code className="text-xs">{key}</code>
              <Badge tone={process.env[key] ? 'green' : 'slate'}>
                {process.env[key] ? 'set' : 'missing'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
