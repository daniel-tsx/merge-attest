import { GitPullRequest } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { repositories } from "@/lib/demo-data";

const envVars = [
  "GITHUB_APP_ID",
  "GITHUB_APP_PRIVATE_KEY",
  "GITHUB_WEBHOOK_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
];

export default function GitHubSettingsPage() {
  const configured = envVars.every((key) => Boolean(process.env[key]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="GitHub App"
        description="Installation settings, webhook endpoint, and demo-mode state for GitHub pull request sync."
        actions={
          <Button variant="secondary">
            <GitPullRequest />
            Install GitHub App
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
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
            <div className="mt-2 font-semibold">{repositories.length} demo repositories</div>
          </div>
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
