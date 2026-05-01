import { notFound } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ApprovalBadge, CiBadge, RiskBadge, TestGapBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getCurrentOrganization,
  getRepository,
  getRepositoryPullRequests,
  getRepositoryRules,
  listAuditEvents,
} from "@/lib/data/app-data";
import { formatDate, formatNumber } from "@/lib/utils";

export default async function RepositoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const organization = await getCurrentOrganization();
  const repository = await getRepository(organization.id, id);
  if (!repository) notFound();

  const prs = await getRepositoryPullRequests(organization.id, id);
  const rules = await getRepositoryRules(organization.id, id);
  const auditEvents = await listAuditEvents(organization.id, { repositoryId: id, take: 8 });

  return (
    <div className="space-y-6">
      <PageHeader
        title={repository.name}
        description={`${repository.owner}/${repository.name} · ${repository.visibility} · default branch ${repository.defaultBranch}`}
        actions={
          <>
            <form action={`/api/github/sync/repositories/${repository.id}`} method="post">
              <input type="hidden" name="redirectTo" value={`/repositories/${repository.id}`} />
              <Button variant="secondary" type="submit">
                <RefreshCw />
                Sync repository
              </Button>
            </form>
            <Button asChild>
              <a href={`/repositories/${repository.id}/rules`}>Rules</a>
            </Button>
          </>
        }
      />
      <section className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent>
            <div className="text-xs uppercase text-slate-500">Connection</div>
            <div className="mt-2 text-lg font-semibold">{repository.connectedStatus}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs uppercase text-slate-500">Active rules</div>
            <div className="mt-2 text-lg font-semibold">{rules.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs uppercase text-slate-500">Monthly usage</div>
            <div className="mt-2 text-lg font-semibold">{formatNumber(repository.monthlyPrCheckUsage)} checks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs uppercase text-slate-500">Risk profile</div>
            <div className="mt-2">
              <RiskBadge level={repository.riskProfile} />
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pull Requests</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PR</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>CI</TableHead>
                  <TableHead>Approval</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prs.map((pr) => (
                  <TableRow key={pr.id}>
                    <TableCell className="min-w-72">
                      <a href={`/pull-requests/${pr.id}`} className="font-medium text-slate-950 hover:underline">
                        #{pr.number} {pr.title}
                      </a>
                      <div className="text-xs text-slate-500">{formatDate(pr.updatedAt)}</div>
                    </TableCell>
                    <TableCell>
                      <RiskBadge level={pr.riskLevel} />
                    </TableCell>
                    <TableCell>
                      <TestGapBadge status={pr.testGapStatus} />
                    </TableCell>
                    <TableCell>
                      <CiBadge status={pr.ciStatus} />
                    </TableCell>
                    <TableCell>
                      <ApprovalBadge status={pr.approvalStatus} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Audit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {auditEvents.map((event) => (
                <div key={event.id} className="rounded-md border border-slate-200 p-3">
                  <div className="text-sm font-medium">{event.summary}</div>
                  <div className="mt-1 text-xs text-slate-500">{formatDate(event.createdAt)}</div>
                </div>
              ))}
          </CardContent>
        </Card>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-3">
          <div>
            <div className="text-slate-500">Provider</div>
            <div className="font-medium">{repository.provider}</div>
          </div>
          <div>
            <div className="text-slate-500">Created</div>
            <div className="font-medium">{formatDate(repository.createdAt)}</div>
          </div>
          <div>
            <div className="text-slate-500">Updated</div>
            <div className="font-medium">{formatDate(repository.updatedAt)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
