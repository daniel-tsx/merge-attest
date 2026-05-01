import { GitPullRequest } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentOrganization, listRepositories } from "@/lib/data/app-data";
import { getGitHubAppInstallUrl } from "@/lib/github";

const envVars = [
  "GITHUB_APP_ID",
  "GITHUB_APP_SLUG",
  "GITHUB_APP_PRIVATE_KEY",
  "GITHUB_WEBHOOK_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
];

export default async function GitHubSettingsPage() {
  const organization = await getCurrentOrganization();
  const repositories = await listRepositories(organization.id);
  const configured = envVars.every((key) => Boolean(process.env[key]));
  const installUrl = getGitHubAppInstallUrl();

  return (
    <div className="space-y-6">
      <PageHeader
        title="GitHub App"
        description="Installation settings, webhook endpoint, and demo-mode state for GitHub pull request sync."
        actions={
          installUrl ? (
            <Button variant="secondary" asChild>
              <a href={installUrl}>
                <GitPullRequest />
                Install GitHub App
              </a>
            </Button>
          ) : (
            <Button variant="secondary" disabled>
              <GitPullRequest />
              Set GITHUB_APP_SLUG
            </Button>
          )
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <div className="text-xs uppercase text-slate-500">Mode</div>
            <div className="mt-2">
              <Badge tone={configured ? "green" : "blue"}>{configured ? "configured" : "demo mode"}</Badge>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Webhook endpoint</div>
            <div className="mt-2 font-mono text-xs">/api/github/webhook</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Repositories</div>
            <div className="mt-2 font-semibold">
              {repositories.length} {organization.dataMode === "live" ? "synced" : "demo"} repositories
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Organization</div>
            <div className="mt-2 font-semibold">{organization.name}</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Manual Sync</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/api/github/sync/repositories" method="post" className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="redirectTo" value="/settings/github" />
            <Button type="submit">
              <GitPullRequest />
              Sync repositories now
            </Button>
            <p className="text-sm text-slate-600">
              Imports repositories and open pull requests from the connected GitHub installation.
            </p>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Required Environment Variables</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          {envVars.map((key) => (
            <div key={key} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
              <code className="text-xs">{key}</code>
              <Badge tone={process.env[key] ? "green" : "slate"}>{process.env[key] ? "set" : "missing"}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
