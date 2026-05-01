import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAuditRetentionStart } from "@/lib/audit-export";
import { getCurrentOrganization, listAuditEvents } from "@/lib/data/app-data";
import { getPlanEntitlements } from "@/lib/entitlements";
import { formatDate } from "@/lib/utils";

export default async function AuditLogPage() {
  const organization = await getCurrentOrganization();
  const entitlements = getPlanEntitlements(organization.planKey);
  const auditEvents = await listAuditEvents(organization.id, {
    since: getAuditRetentionStart(organization.planKey),
    take: 200,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Immutable-style trail for repository syncs, risk calculations, rule triggers, approvals, and settings changes."
        actions={
          entitlements.features.auditExport ? (
            <Button asChild variant="secondary">
              <a href="/api/audit-log/export">Export CSV</a>
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
            Showing the latest {auditEvents.length} events within your plan retention window.
          </p>
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <Input placeholder="Filter audit events" aria-label="Filter audit events" />
            <select className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm">
              <option>All event types</option>
              <option>Risk score calculated</option>
              <option>Rule triggered</option>
              <option>Approval requested</option>
            </select>
          </div>
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
                      <div className="font-medium text-slate-950">{event.summary}</div>
                      <div className="text-xs text-slate-500">{event.eventType.replaceAll("_", " ")}</div>
                    </TableCell>
                    <TableCell>{event.repositoryName}</TableCell>
                    <TableCell>{event.pullRequestNumber ? `#${event.pullRequestNumber}` : "none"}</TableCell>
                    <TableCell>{event.actor ?? "system"}</TableCell>
                    <TableCell>{formatDate(event.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {auditEvents.length === 0 ? (
              <div className="border-t border-slate-200 p-4 text-sm text-slate-600">
                No audit events have been recorded yet. Repository sync, approvals, billing changes, and webhook activity will appear here.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
