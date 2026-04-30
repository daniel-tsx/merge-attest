import { PageHeader } from "@/components/app/page-header";
import { ApprovalBadge, CiBadge, RiskBadge, TestGapBadge } from "@/components/app/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pullRequests } from "@/lib/demo-data";
import { formatDate, formatNumber } from "@/lib/utils";

export default function PullRequestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pull Request Monitor"
        description="Scan AI-assisted pull requests by risk, test gap, CI state, and approval status."
      />
      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_160px_160px_180px]">
            <Input placeholder="Filter pull requests" aria-label="Filter pull requests" />
            <select className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm">
              <option>All risk</option>
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
            </select>
            <select className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm">
              <option>All agents</option>
              <option>Cursor</option>
              <option>Codex</option>
              <option>Claude Code</option>
            </select>
            <select className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm">
              <option>Approval status</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Risk accepted</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pull request</TableHead>
                  <TableHead>Repository</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>CI</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Diff</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pullRequests.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="min-w-80">
                      <a className="font-medium text-slate-950 hover:underline" href={`/pull-requests/${item.id}`}>
                        #{item.number} {item.title}
                      </a>
                      <div className="text-xs text-slate-500">
                        {item.author} · {item.branch} → {item.baseBranch}
                      </div>
                    </TableCell>
                    <TableCell>{item.repositoryName}</TableCell>
                    <TableCell>{item.aiAssisted === null ? "unknown" : item.agentSource.replace("_", " ")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <RiskBadge level={item.riskLevel} />
                        <span className="text-xs text-slate-500">{item.riskScore}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TestGapBadge status={item.testGapStatus} />
                    </TableCell>
                    <TableCell>
                      <CiBadge status={item.ciStatus} />
                    </TableCell>
                    <TableCell>
                      <ApprovalBadge status={item.approvalStatus} />
                    </TableCell>
                    <TableCell>
                      +{formatNumber(item.linesAdded)} / -{formatNumber(item.linesDeleted)}
                    </TableCell>
                    <TableCell>{formatDate(item.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
