import { notFound } from "next/navigation";
import { ApprovalActions } from "@/components/app/approval-actions";
import { PageHeader } from "@/components/app/page-header";
import { ApprovalBadge, CiBadge, RiskBadge, TestGapBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { activityEvents, auditEvents, getPullRequest } from "@/lib/demo-data";
import { formatDate, formatNumber } from "@/lib/utils";

export default async function PullRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pr = getPullRequest(id);
  if (!pr) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`#${pr.number} ${pr.title}`}
        description={`${pr.repositoryName} · ${pr.author} · ${pr.branch} → ${pr.baseBranch}`}
        actions={
          <Button variant="secondary" asChild>
            <a href="/api/github/comment">Post GitHub comment</a>
          </Button>
        }
      />
      <section className="grid gap-3 md:grid-cols-5">
        <Card>
          <CardContent>
            <div className="text-xs uppercase text-slate-500">Risk score</div>
            <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
              {pr.riskScore}
              <RiskBadge level={pr.riskLevel} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs uppercase text-slate-500">Test gap</div>
            <div className="mt-2">
              <TestGapBadge status={pr.testGapStatus} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs uppercase text-slate-500">CI</div>
            <div className="mt-2">
              <CiBadge status={pr.ciStatus} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs uppercase text-slate-500">Approval</div>
            <div className="mt-2">
              <ApprovalBadge status={pr.approvalStatus} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs uppercase text-slate-500">Diff</div>
            <div className="mt-2 text-lg font-semibold">
              +{formatNumber(pr.linesAdded)} / -{formatNumber(pr.linesDeleted)}
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pr.riskSignals.map((signal) => (
                <div key={signal.key} className="rounded-md border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-950">{signal.label}</div>
                    <div className="text-sm font-semibold">+{signal.score}</div>
                  </div>
                  {signal.filePaths.length ? <div className="mt-1 text-xs text-slate-500">{signal.filePaths.join(", ")}</div> : null}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Changed Files</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Path</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Additions</TableHead>
                    <TableHead>Deletions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pr.files.map((file) => (
                    <TableRow key={file.path}>
                      <TableCell className="font-mono text-xs">{file.path}</TableCell>
                      <TableCell>{file.changeType}</TableCell>
                      <TableCell>{file.additions}</TableCell>
                      <TableCell>{file.deletions}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Test Gap Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{pr.testGapAnalysis.summary}</p>
              <div>
                <div className="font-medium">Suggested test files</div>
                <ul className="mt-1 list-inside list-disc text-slate-600">
                  {pr.testGapAnalysis.suggestedTestFiles.map((item) => (
                    <li key={item} className="font-mono text-xs">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-medium">Suggested test cases</div>
                <ul className="mt-1 list-inside list-disc text-slate-600">
                  {pr.testGapAnalysis.suggestedTestCases.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approval Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovalActions prId={pr.id} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Rule Violations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pr.ruleViolations.map((violation) => (
                <div key={violation.id} className="rounded-md border border-slate-200 p-3">
                  <RiskBadge level={violation.severity} />
                  <div className="mt-2 text-sm font-medium">{violation.ruleName}</div>
                  <div className="text-xs text-slate-500">{violation.actionType.replaceAll("_", " ")}</div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pr.approvals.map((approval) => (
                <div key={approval.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <div className="font-medium">{approval.reviewer}</div>
                  <div className="text-slate-600">{approval.decision.replaceAll("_", " ")}</div>
                  <div className="text-xs text-slate-500">{approval.note}</div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Audit Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {auditEvents
                .filter((event) => event.pullRequestNumber === pr.number && event.repositoryName === pr.repositoryName)
                .map((event) => (
                  <div key={event.id} className="text-sm">
                    <div className="font-medium">{event.summary}</div>
                    <div className="text-xs text-slate-500">{formatDate(event.createdAt)}</div>
                  </div>
                ))}
              {activityEvents
                .filter((event) => event.pullRequestId === pr.id)
                .map((event) => (
                  <div key={event.id} className="text-sm">
                    <div className="font-medium">{event.summary}</div>
                    <div className="text-xs text-slate-500">{formatDate(event.timestamp)}</div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
