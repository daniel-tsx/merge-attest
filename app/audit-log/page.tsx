import type { SearchParams } from 'nuqs/server'
import Link from 'next/link'
import { EmptyState, ResultSummary } from '@/components/app/empty-state'
import { PageHeader } from '@/components/app/page-header'
import { AuditLogFilters } from '@/app/audit-log/filters'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

export default async function AuditLogPage({ searchParams }: PageProps) {
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
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Immutable-style trail for repository syncs, risk calculations, rule triggers, approvals, and settings changes."
        actions={
          entitlements.features.auditExport ? (
            <Button asChild variant="secondary">
              <a href={exportHref}>Export CSV</a>
            </Button>
          ) : (
            <Button variant="secondary" disabled>
              Growth plan export
            </Button>
          )
        }
      />
      <Card>
        <CardContent className="space-y-4">
          <AuditLogFilters repositories={repositories} />
          <ResultSummary
            count={auditEvents.length}
            label="audit events"
            detail="Within your plan retention window"
          />
          <div className="overflow-x-auto">
            <Table>
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
                      <div className="text-xs text-muted-foreground">
                        {event.eventType.replaceAll('_', ' ')}
                      </div>
                    </TableCell>
                    <TableCell>{event.repositoryName}</TableCell>
                    <TableCell>
                      {event.pullRequestNumber && event.pullRequestId ? (
                        <Link
                          href={`/pull-requests/${event.pullRequestId}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          #{event.pullRequestNumber}
                        </Link>
                      ) : event.pullRequestNumber ? (
                        `#${event.pullRequestNumber}`
                      ) : (
                        'none'
                      )}
                    </TableCell>
                    <TableCell>{event.actor ?? 'system'}</TableCell>
                    <TableCell>{formatDate(event.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {auditEvents.length === 0 ? (
              <div className="border-t border-border p-4">
                <EmptyState
                  title="No audit events recorded yet"
                  description="Repository sync, approvals, billing changes, and webhook activity will appear here."
                />
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Saved audit exports
            </h2>
            <p className="text-sm text-muted-foreground">
              CSV exports are recorded for compliance traceability.
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
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
                      {item.fileName}
                    </TableCell>
                    <TableCell>{item.eventCount}</TableCell>
                    <TableCell>{item.createdBy ?? 'Unknown user'}</TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {savedExports.length === 0 ? (
              <div className="border-t border-border p-4">
                <EmptyState
                  title="No saved audit exports"
                  description="CSV export records will appear here after the first export."
                />
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
