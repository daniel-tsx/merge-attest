import { Suspense } from 'react'
import { AdminNav } from '@/components/app/admin-nav'
import { EmptyState } from '@/components/app/empty-state'
import { MetricCard } from '@/components/app/metric-card'
import { PageHeader } from '@/components/app/page-header'
import { TableSkeleton } from '@/components/app/page-loading'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getAdminSystem } from '@/lib/admin/admin-data'
import type { DiagnosticStatus } from '@/lib/diagnostics'
import { formatDate, formatNumber } from '@/lib/utils'

const STATUS_TONE: Record<DiagnosticStatus, 'green' | 'yellow' | 'red'> = {
  ok: 'green',
  warning: 'yellow',
  error: 'red',
}

const AI_REVIEW_LABELS: Array<{ key: string; label: string }> = [
  { key: 'queued', label: 'Queued' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'skipped', label: 'Skipped' },
  { key: 'completed', label: 'Completed' },
  { key: 'failed', label: 'Failed' },
]

export default function AdminSystemPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="System health"
        description="Integration status, webhook delivery queue, billing events, and AI review job health across the platform."
      />
      <AdminNav />
      <Suspense fallback={<TableSkeleton label="Loading system status" />}>
        <AdminSystemContent />
      </Suspense>
    </div>
  )
}

async function AdminSystemContent() {
  const system = await getAdminSystem()
  if (!system) {
    return (
      <EmptyState
        title="System data unavailable"
        description="A database connection is required to load platform health."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Webhooks pending"
          value={system.webhooks.pending}
          description="Received, queued, or processing"
          tone={system.webhooks.pending > 0 ? 'warning' : 'neutral'}
        />
        <MetricCard
          label="Webhooks failed"
          value={system.webhooks.failed}
          description="Need attention"
          tone={system.webhooks.failed > 0 ? 'danger' : 'success'}
        />
        <MetricCard
          label="Webhooks processed"
          value={system.webhooks.processed}
          description="Processed or ignored"
          tone="neutral"
        />
        <MetricCard
          label="Overall status"
          value={
            system.summary === 'ok'
              ? 'Healthy'
              : system.summary === 'warning'
                ? 'Warnings'
                : 'Errors'
          }
          tone={
            system.summary === 'ok'
              ? 'success'
              : system.summary === 'warning'
                ? 'warning'
                : 'danger'
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integration checks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {system.checks.map((check) => (
            <div
              key={check.name}
              className="flex items-start justify-between gap-3 rounded-control border border-border bg-surface-muted/30 px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium capitalize text-foreground">
                  {check.name.replace(/_/g, ' ')}
                </div>
                <p className="text-xs text-muted-foreground">{check.message}</p>
              </div>
              <Badge tone={STATUS_TONE[check.status]} withDot>
                {check.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>AI review jobs</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3">
            {AI_REVIEW_LABELS.map((entry) => (
              <div key={entry.key} className="bg-surface-elevated p-4">
                <p className="text-eyebrow text-subtle-foreground">
                  {entry.label}
                </p>
                <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight text-foreground">
                  {formatNumber(
                    system.aiReviews[
                      entry.key as keyof typeof system.aiReviews
                    ],
                  )}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent billing events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {system.billingEvents.length ? (
              system.billingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between gap-3 rounded-control border border-border bg-surface-muted/30 px-3 py-2.5 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {event.eventName}
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge tone={event.status === 'failed' ? 'red' : 'slate'}>
                      {event.status}
                    </Badge>
                    <span className="whitespace-nowrap text-xs text-subtle-foreground">
                      {formatDate(event.createdAt)}
                    </span>
                  </span>
                </div>
              ))
            ) : (
              <EmptyState
                title="No billing events yet"
                description="Lemon Squeezy webhook events will appear here."
                className="py-6"
              />
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent webhook failures</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <caption className="sr-only">
                Most recent failed GitHub webhook deliveries
              </caption>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead className="text-right">Attempts</TableHead>
                  <TableHead>Last error</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {system.webhooks.recentFailures.map((failure) => (
                  <TableRow key={failure.deliveryId}>
                    <TableCell className="font-medium text-foreground">
                      {failure.event}
                      {failure.action ? (
                        <span className="text-subtle-foreground">
                          {' '}
                          · {failure.action}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-subtle-foreground">
                      {failure.deliveryId}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {failure.attemptCount}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                      {failure.lastError ?? '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(failure.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {system.webhooks.recentFailures.length === 0 ? (
              <div className="border-t border-border p-5">
                <EmptyState
                  title="No webhook failures"
                  description="The GitHub webhook delivery queue is healthy."
                />
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
