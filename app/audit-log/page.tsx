import { PageHeader } from '@/components/app/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  const params = await searchParams
  const filters = {
    query: readParam(params, 'query'),
    eventType: readParam(params, 'eventType'),
    actor: readParam(params, 'actor'),
    repositoryId: readParam(params, 'repositoryId'),
    pullRequestNumber: readParam(params, 'pullRequestNumber'),
    severity: readParam(params, 'severity'),
    from: readParam(params, 'from')
      ? new Date(String(readParam(params, 'from')))
      : undefined,
    to: readParam(params, 'to')
      ? new Date(String(readParam(params, 'to')))
      : undefined,
  }
  const organization = await getCurrentOrganization()
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
  const exportParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    const item = Array.isArray(value) ? value[0] : value
    if (item) exportParams.set(key, item)
  }
  const exportHref = `/api/audit-log/export${
    exportParams.size ? `?${exportParams.toString()}` : ''
  }`

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
          <p className="text-sm text-slate-600">
            Showing the latest {auditEvents.length} events within your plan
            retention window.
          </p>
          <form className="grid gap-3 md:grid-cols-[1fr_180px_180px_140px] lg:grid-cols-[1fr_180px_180px_140px_140px_140px_auto]">
            <Input
              name="query"
              defaultValue={filters.query}
              placeholder="Filter audit events"
              aria-label="Filter audit events"
            />
            <Input
              name="actor"
              defaultValue={filters.actor}
              placeholder="Actor"
              aria-label="Filter by actor"
            />
            <select
              name="repositoryId"
              defaultValue={filters.repositoryId ?? 'all'}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="all">All repositories</option>
              {repositories.map((repository) => (
                <option key={repository.id} value={repository.id}>
                  {repository.name}
                </option>
              ))}
            </select>
            <Input
              name="pullRequestNumber"
              defaultValue={filters.pullRequestNumber}
              placeholder="PR #"
              aria-label="Filter by pull request number"
            />
            <select
              name="eventType"
              defaultValue={filters.eventType ?? 'all'}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="all">All event types</option>
              <option value="repository_connected">Repository connected</option>
              <option value="pr_synced">PR synced</option>
              <option value="risk_score_calculated">
                Risk score calculated
              </option>
              <option value="test_gap_detected">Test gap detected</option>
              <option value="rule_triggered">Rule triggered</option>
              <option value="approval_requested">Approval requested</option>
              <option value="pr_approved">PR approved</option>
              <option value="pr_rejected">PR rejected</option>
              <option value="risk_accepted">Risk accepted</option>
              <option value="github_comment_posted">
                GitHub comment posted
              </option>
              <option value="settings_changed">Settings changed</option>
            </select>
            <select
              name="severity"
              defaultValue={filters.severity ?? 'all'}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="all">All severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <Input
              type="date"
              name="from"
              defaultValue={readParam(params, 'from')}
              aria-label="Start date"
            />
            <Input
              type="date"
              name="to"
              defaultValue={readParam(params, 'to')}
              aria-label="End date"
            />
            <Button type="submit" variant="secondary">
              Apply
            </Button>
          </form>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
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
                      <div className="font-medium text-slate-950">
                        {event.summary}
                      </div>
                      <div className="text-xs text-slate-500">
                        {event.eventType.replaceAll('_', ' ')}
                      </div>
                    </TableCell>
                    <TableCell>{event.repositoryName}</TableCell>
                    <TableCell>
                      {event.pullRequestNumber
                        ? `#${event.pullRequestNumber}`
                        : 'none'}
                    </TableCell>
                    <TableCell>{event.actor ?? 'system'}</TableCell>
                    <TableCell>{formatDate(event.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {auditEvents.length === 0 ? (
              <div className="border-t border-slate-200 p-4 text-sm text-slate-600">
                No audit events have been recorded yet. Repository sync,
                approvals, billing changes, and webhook activity will appear
                here.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Saved audit exports
            </h2>
            <p className="text-sm text-slate-500">
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
                    <TableCell className="font-medium text-slate-950">
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
              <div className="border-t border-slate-200 p-4 text-sm text-slate-600">
                No audit exports have been saved yet.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
