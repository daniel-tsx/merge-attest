import { PageHeader } from "@/components/app/page-header";
import { RiskBadge } from "@/components/app/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { activityEvents } from "@/lib/demo-data";
import { formatDate } from "@/lib/utils";

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Agent Activity" description="Compact timeline of agent-originated and review-relevant repository events." />
      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_170px_170px_170px]">
            <Input placeholder="Filter activity" aria-label="Filter activity" />
            <select className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm">
              <option>All repositories</option>
              <option>billing-api</option>
              <option>auth-service</option>
            </select>
            <select className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm">
              <option>All agents</option>
              <option>Codex</option>
              <option>Cursor</option>
              <option>Claude Code</option>
            </select>
            <select className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm">
              <option>All event types</option>
              <option>Rule triggered</option>
              <option>CI failed</option>
            </select>
          </div>
          <div className="divide-y divide-slate-100">
            {activityEvents.map((event) => (
              <div key={event.id} className="grid gap-3 py-3 md:grid-cols-[180px_1fr_140px_120px] md:items-center">
                <div className="text-xs text-slate-500">{formatDate(event.timestamp)}</div>
                <div>
                  <div className="text-sm font-medium text-slate-950">{event.summary}</div>
                  <div className="text-xs text-slate-500">
                    {event.repositoryName} · PR #{event.pullRequestNumber} · {event.actor}
                  </div>
                </div>
                <div className="text-sm text-slate-700">{event.agentSource.replace("_", " ")}</div>
                <RiskBadge level={event.riskLevel} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
