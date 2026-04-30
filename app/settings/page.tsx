import { Bell, Database, GitPullRequest, KeyRound, Receipt, Users } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { organization, users } from "@/lib/demo-data";

const settings = [
  { href: "/settings/team", label: "Team members", icon: Users, value: `${users.length} users` },
  { href: "/settings/github", label: "GitHub app", icon: GitPullRequest, value: "demo mode" },
  { href: "/settings/billing", label: "Billing plan", icon: Receipt, value: organization.planKey },
  { href: "/settings/usage", label: "Usage", icon: Database, value: "337 checks" },
  { href: "/settings", label: "API keys", icon: KeyRound, value: "1 active" },
  { href: "/settings", label: "Notifications", icon: Bell, value: "email only" },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Organization profile, integration state, billing gates, usage, API keys, retention, and notifications." />
      <Card>
        <CardHeader>
          <CardTitle>Organization Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm md:grid-cols-3">
          <div>
            <div className="text-slate-500">Name</div>
            <div className="font-medium">{organization.name}</div>
          </div>
          <div>
            <div className="text-slate-500">Slug</div>
            <div className="font-medium">{organization.slug}</div>
          </div>
          <div>
            <div className="text-slate-500">Plan</div>
            <Badge tone="blue">{organization.planKey}</Badge>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {settings.map((item) => (
          <a key={item.label} href={item.href}>
            <Card className="h-full hover:border-slate-300">
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <item.icon className="size-5 text-slate-500" />
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-slate-500">{item.value}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
