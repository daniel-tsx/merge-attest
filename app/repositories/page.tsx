import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { RiskBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentOrganization, listRepositories } from "@/lib/data/app-data";
import { formatDate, formatNumber } from "@/lib/utils";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function RepositoriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = {
    query: readParam(params, "query"),
    riskProfile: readParam(params, "riskProfile"),
    visibility: readParam(params, "visibility"),
  };
  const organization = await getCurrentOrganization();
  const [allRepositories, repositories] = await Promise.all([
    listRepositories(organization.id),
    listRepositories(organization.id, filters),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repositories"
        description="Connected GitHub repositories, rule coverage, usage, and risk profiles."
        actions={
          <form action="/api/github/sync/repositories" method="post">
            <input type="hidden" name="redirectTo" value="/repositories" />
            <Button variant="secondary" type="submit">
              <RefreshCw />
              Sync repositories
            </Button>
          </form>
        }
      />
      <Card>
        <CardContent className="space-y-4">
          {allRepositories.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 p-6 text-center">
              <h2 className="text-sm font-semibold text-slate-950">No repositories synced yet</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
                Connect the GitHub App, then sync repositories to import open pull requests and start applying AgentGate rules.
              </p>
              <div className="mt-4 flex justify-center">
                {organization.githubInstallationId ? (
                  <form action="/api/github/sync/repositories" method="post">
                    <input type="hidden" name="redirectTo" value="/repositories" />
                    <Button type="submit">
                      <RefreshCw />
                      Sync repositories
                    </Button>
                  </form>
                ) : (
                  <Button asChild>
                    <a href="/settings/github">Connect GitHub</a>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              <form className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
                <Input
                  name="query"
                  defaultValue={filters.query}
                  placeholder="Filter repositories"
                  aria-label="Filter repositories"
                />
                <select
                  name="riskProfile"
                  defaultValue={filters.riskProfile ?? "all"}
                  className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="all">All risk profiles</option>
                  <option value="high">High risk</option>
                  <option value="medium">Medium risk</option>
                  <option value="low">Low risk</option>
                </select>
                <select
                  name="visibility"
                  defaultValue={filters.visibility ?? "all"}
                  className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="all">All visibility</option>
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
                <Button type="submit" variant="secondary">
                  Apply
                </Button>
              </form>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rules</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Last synced</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repositories.map((repository) => (
                      <TableRow key={repository.id}>
                        <TableCell>
                          <a href={`/repositories/${repository.id}`} className="font-medium text-slate-950 hover:underline">
                            {repository.name}
                          </a>
                          <div className="text-xs text-slate-500">
                            {repository.provider} · {repository.defaultBranch} · {repository.visibility}
                          </div>
                        </TableCell>
                        <TableCell>{repository.owner}</TableCell>
                        <TableCell>{repository.connectedStatus}</TableCell>
                        <TableCell>{repository.activeRulesCount}</TableCell>
                        <TableCell>{formatNumber(repository.monthlyPrCheckUsage)} checks</TableCell>
                        <TableCell>
                          <RiskBadge level={repository.riskProfile} />
                        </TableCell>
                        <TableCell>{formatDate(repository.lastSyncedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {repositories.length === 0 ? (
                  <div className="border-t border-slate-200 p-4 text-sm text-slate-600">
                    No repositories match these filters.
                  </div>
                ) : null}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
