import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { RiskBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentOrganization, listRepositories } from "@/lib/data/app-data";
import { formatDate, formatNumber } from "@/lib/utils";

export default async function RepositoriesPage() {
  const organization = await getCurrentOrganization();
  const repositories = await listRepositories(organization.id);

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
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <Input placeholder="Filter repositories" aria-label="Filter repositories" />
            <select className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm">
              <option>All risk profiles</option>
              <option>High risk</option>
              <option>Medium risk</option>
              <option>Low risk</option>
            </select>
            <select className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm">
              <option>All visibility</option>
              <option>Private</option>
              <option>Public</option>
            </select>
          </div>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
