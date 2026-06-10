import { Suspense } from 'react'
import type { SearchParams } from 'nuqs/server'
import Link from 'next/link'
import { Download, FileText, ListChecks } from 'lucide-react'
import { EmptyState, ResultSummary } from '@/components/app/empty-state'
import { PageHeader } from '@/components/app/page-header'
import { LogSkeleton } from '@/components/app/page-loading'
import { AuditLogFilters } from '@/app/audit-log/filters'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getAuditRetentionStart } from '@/lib/audit-export'
import {
  getCurrentOrganization,
  listAuditEvents,
  listAuditExports,
  listRepositories,
} from '@/lib/data/app-data'
import { getPlanEntitlements } from '@/lib/entitlements'
import { formatDate } from '@/lib/utils'
import {
  auditLogSearchParamsCache,
  serializeAuditLogSearchParams,
} from './search-params'

type PageProps = {
  searchParams: Promise<SearchParams>
}

function readDate(value: string) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export default function AuditLogPage({ searchParams }: PageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Review work"
        title="Audit log"
        description="Immutable trail for repository syncs, risk calculations, rule triggers, approvals, and settings changes."
      />
      <Suspense fallback={<LogSkeleton />}>
        <AuditLogContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function AuditLogContent({ searchParams }: PageProps) {
  const [params, organization] = await Promise.all([
    auditLogSearchParamsCache.parse(searchParams),
    getCurrentOrganization(),
  ])
  const filters = {
    ...params,
    from: readDate(params.from),
    to: readDate(params.to),
  }
  const entitlements = getPlanEntitlements(organization.planKey)
  const [auditEvents, repositories, savedExports] = await Promise.all([
    listAuditEvents(organization.id, {
      ...filters,
      since: getAuditRetentionStart(organization.planKey),
      take: 200,
    }),
    listRepositories(organization.id),
    listAuditExports(organization.id),
  ])
  const exportHref = `/api/audit-log/export${serializeAuditLogSearchParams(
    params,
  )}`

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle>Audit events</CardTitle>
          {entitlements.features.auditExport ? (
            <Button asChild variant="secondary" size="sm">
              <a href={exportHref}>
                <Download aria-hidden="true" />
                Export CSV
              </a>
            </Button>
          ) : (
            <Button variant="secondary" size="sm" disabled>
              <Download aria-hidden="true" />
              Export unavailable
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          <AuditLogFilters repositories={repositories} />
          <ResultSummary
            count={auditEvents.length}
            label="audit events"
            detail="Within your plan retention window"
          />
          <div className="-mx-5 overflow-x-auto">
            <Table>
              <caption className="sr-only">
                Audit events matching the current filters
              </caption>
              <TableHeader className="sticky top-0 z-10">
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Repository</TableHead>
                  <TableHead>PR</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="min-w-80">
                      <div className="font-medium text-foreground">
                        {event.summary}
                      </div>
                      <div className="mt-0.5 inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-subtle-foreground">
                        {event.eventType.replaceAll('_', ' ')}
                      </div>
                    </TableCell>
                    <TableCell>{event.repositoryName}</TableCell>
                    <TableCell>
                      {event.pullRequestNumber && event.pullRequestId ? (
                        <Link
                          href={`/pull-requests/${event.pullRequestId}`}
                          className="font-medium text-accent hover:underline"
                        >
                          #{event.pullRequestNumber}
                        </Link>
                      ) : event.pullRequestNumber ? (
                        `#${event.pullRequestNumber}`
                      ) : (
                        <span className="text-subtle-foreground">none</span>
                      )}
                    </TableCell>
                    <TableCell>{event.actor ?? 'system'}</TableCell>
                    <TableCell>{formatDate(event.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {auditEvents.length === 0 ? (
              <div className="border-t border-border p-5">
                <EmptyState
                  icon={ListChecks}
                  title="No audit events recorded yet"
                  description="Repository sync, approvals, billing changes, and webhook activity will appear here."
                />
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Saved audit exports</CardTitle>
          <p className="text-xs text-muted-foreground">
            CSV exports are recorded for compliance traceability.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <caption className="sr-only">
                Saved audit exports for compliance traceability
              </caption>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Created by</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedExports.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-foreground">
                      <span className="inline-flex items-center gap-2">
                        <FileText
                          className="size-3.5 text-subtle-foreground"
                          aria-hidden="true"
                        />
                        {item.fileName}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {item.eventCount}
                    </TableCell>
                    <TableCell>{item.createdBy ?? 'Unknown user'}</TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {savedExports.length === 0 ? (
              <div className="border-t border-border p-5">
                <EmptyState
                  icon={FileText}
                  title="No saved audit exports"
                  description="CSV export records will appear here after the first export."
                />
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
