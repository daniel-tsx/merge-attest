import { PageHeader } from "@/components/app/page-header";
import { RiskBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentOrganization, listActivityEvents, listRepositories } from "@/lib/data/app-data";
import { formatDate } from "@/lib/utils";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function ActivityPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = {
    query: readParam(params, "query"),
    repositoryId: readParam(params, "repositoryId"),
    agentSource: readParam(params, "agentSource"),
    eventType: readParam(params, "eventType"),
  };
  const organization = await getCurrentOrganization();
  const [repositories, activityEvents] = await Promise.all([
    listRepositories(organization.id),
    listActivityEvents(organization.id, filters),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Agent Activity" description="Compact timeline of agent-originated and review-relevant repository events." />
      <Card>
        <CardContent className="space-y-4">
          <form className="grid gap-3 md:grid-cols-[1fr_170px_170px_170px_auto]">
            <Input name="query" defaultValue={filters.query} placeholder="Filter activity" aria-label="Filter activity" />
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
              name="agentSource"
              defaultValue={filters.agentSource ?? "all"}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="all">All agents</option>
              <option value="cursor">Cursor</option>
              <option value="codex">Codex</option>
              <option value="claude_code">Claude Code</option>
              <option value="copilot">Copilot</option>
              <option value="devin">Devin</option>
              <option value="manual">Manual</option>
            </select>
            <select
              name="eventType"
              defaultValue={filters.eventType ?? "all"}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="all">All event types</option>
              <option value="pr_opened">PR opened</option>
              <option value="files_changed">Files changed</option>
              <option value="rule_triggered">Rule triggered</option>
              <option value="ci_failed">CI failed</option>
              <option value="ci_passed">CI passed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="merged">Merged</option>
            </select>
            <Button type="submit" variant="secondary">
              Apply
            </Button>
          </form>
          <div className="divide-y divide-slate-100">
            {activityEvents.map((event) => (
              <div key={event.id} className="grid gap-3 py-3 md:grid-cols-[180px_1fr_140px_120px] md:items-center">
                <div className="text-xs text-slate-500">{formatDate(event.timestamp)}</div>
                <div>
                  <div className="text-sm font-medium text-slate-950">{event.summary}</div>
                  <div className="text-xs text-slate-500">
                    {event.repositoryName} · {event.pullRequestNumber ? `PR #${event.pullRequestNumber}` : "No PR"} · {event.actor}
                  </div>
                </div>
                <div className="text-sm text-slate-700">{event.agentSource.replace("_", " ")}</div>
                <RiskBadge level={event.riskLevel} />
              </div>
            ))}
            {activityEvents.length === 0 ? (
              <div className="py-6 text-sm text-slate-600">
                No activity matches these filters. Sync repositories or clear the filters to see more events.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
