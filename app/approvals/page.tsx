import { PageHeader } from "@/components/app/page-header";
import { ApprovalActions } from "@/components/app/approval-actions";
import { ApprovalBadge, CiBadge, RiskBadge, TestGapBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pullRequests } from "@/lib/demo-data";
import { formatDate } from "@/lib/utils";

export default function ApprovalsPage() {
  const pending = pullRequests.filter((pr) => pr.approvalStatus === "pending" || pr.testGapStatus === "high");

  return (
    <div className="space-y-6">
      <PageHeader title="Approvals" description="Human review queue for risky, AI-assisted, or test-gap pull requests." />
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
    </div>
  );
}
