import { PageHeader } from "@/components/app/page-header";
import { ApprovalActions } from "@/components/app/approval-actions";
import { ApprovalBadge, CiBadge, RiskBadge, TestGapBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentOrganization, listPullRequests, listRepositories } from "@/lib/data/app-data";
import { formatDate } from "@/lib/utils";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function ApprovalsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const approvalStatus = readParam(params, "approvalStatus");
  const filters = {
    query: readParam(params, "query"),
    repositoryId: readParam(params, "repositoryId"),
    approvalStatus,
  };
  const organization = await getCurrentOrganization();
  const [repositories, pullRequests] = await Promise.all([
    listRepositories(organization.id),
    listPullRequests(organization.id, filters),
  ]);
  const pending = approvalStatus && approvalStatus !== "all"
    ? pullRequests
    : pullRequests.filter((pr) => pr.approvalStatus === "pending" || pr.testGapStatus === "high");

  return (
    <div className="space-y-6">
      <PageHeader title="Approvals" description="Human review queue for risky, AI-assisted, or test-gap pull requests." />
      <Card>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[1fr_200px_180px_auto]">
            <Input name="query" defaultValue={filters.query} placeholder="Filter approvals" aria-label="Filter approvals" />
            <select
              name="repositoryId"
              defaultValue={filters.repositoryId ?? "all"}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="all">All repositories</option>
              {repositories.map((repository) => (
                <option key={repository.id} value={repository.id}>
                  {repository.name}
                </option>
              ))}
            </select>
            <select
              name="approvalStatus"
              defaultValue={filters.approvalStatus ?? "all"}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="all">Needs review</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="risk_accepted">Risk accepted</option>
            </select>
            <Button type="submit" variant="secondary">
              Apply
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        {pending.map((pr) => (
          <Card key={pr.id}>
            <CardHeader>
              <CardTitle>
                <a href={`/pull-requests/${pr.id}`} className="hover:underline">
                  #{pr.number} {pr.title}
                </a>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <RiskBadge level={pr.riskLevel} />
                <TestGapBadge status={pr.testGapStatus} />
                <CiBadge status={pr.ciStatus} />
                <ApprovalBadge status={pr.approvalStatus} />
              </div>
              <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                <div>{pr.repositoryName}</div>
                <div>Updated {formatDate(pr.updatedAt)}</div>
                <div>{pr.filesChangedCount} files changed</div>
                <div>{pr.ruleViolations.length} rule violations</div>
              </div>
              <ApprovalActions prId={pr.id} />
            </CardContent>
          </Card>
        ))}
      </div>
      {pending.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-slate-600">
            No approval items match these filters. New high-risk, AI-assisted, or test-gap pull requests will appear here.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
