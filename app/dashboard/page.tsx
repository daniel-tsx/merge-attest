import { Activity, AlertTriangle, Boxes, CheckCircle2, GitPullRequest, ListChecks, ShieldAlert, TestTube2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { CiBadge, RiskBadge, TestGapBadge } from "@/components/app/status-badge";
import { TrendChart } from "@/components/charts/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { activityEvents, getDashboardMetrics, pullRequests, trendData } from "@/lib/demo-data";
import { formatDate, formatNumber } from "@/lib/utils";

const metricIcons = [Boxes, GitPullRequest, ShieldAlert, TestTube2, CheckCircle2, AlertTriangle, Activity, ListChecks];

export default function DashboardPage() {
  const metrics = getDashboardMetrics();
  const metricCards = [
    ["Repositories", metrics.repositoriesConnected],
    ["AI PRs this week", metrics.aiPrsThisWeek],
    ["High-risk PRs", metrics.highRiskPrs],
    ["PRs with test gaps", metrics.prsWithTestGaps],
    ["Pending approvals", metrics.pendingApprovals],
    ["Failed CI checks", metrics.failedCiChecks],
    ["Average risk score", metrics.averageRiskScore],
    ["Rule violations", metrics.ruleViolations],
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Operational view of AI-assisted pull requests, test gaps, approval pressure, and risky changes."
      />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map(([label, value], index) => {
          const Icon = metricIcons[index];
          return (
            <Card key={label}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{formatNumber(value)}</p>
                </div>
                <Icon className="size-5 text-slate-500" />
              </CardContent>
            </Card>
          );
        })}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Risk Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={trendData} metric="risk" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Test Gap Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={trendData} metric="testGaps" />
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>High Attention Pull Requests</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PR</TableHead>
                  <TableHead>Repo</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>CI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pullRequests
                  .filter((item) => item.riskScore >= 45 || item.testGapStatus !== "none")
                  .slice(0, 7)
                  .map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="min-w-72">
                        <a className="font-medium text-slate-950 hover:underline" href={`/pull-requests/${item.id}`}>
                          #{item.number} {item.title}
                        </a>
                        <div className="text-xs text-slate-500">{item.author}</div>
                      </TableCell>
                      <TableCell>{item.repositoryName}</TableCell>
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
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Agent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityEvents.slice(0, 8).map((event) => (
              <div key={event.id} className="rounded-md border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-slate-950">{event.repositoryName}</div>
                  <RiskBadge level={event.riskLevel} />
                </div>
                <p className="mt-1 text-sm text-slate-700">{event.summary}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {event.agentSource.replace("_", " ")} by {event.actor} · {formatDate(event.timestamp)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
