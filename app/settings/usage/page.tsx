import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { repositories } from "@/lib/demo-data";
import { formatNumber } from "@/lib/utils";

export default function UsageSettingsPage() {
  const totalUsage = repositories.reduce((sum, repository) => sum + repository.monthlyPrCheckUsage, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Usage" description="Monthly PR check consumption by repository." />
      <Card>
        <CardHeader>
          <CardTitle>Current Billing Period</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-3xl font-semibold">{formatNumber(totalUsage)} checks</div>
          <div className="space-y-3">
            {repositories.map((repository) => (
              <div key={repository.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{repository.name}</span>
                  <span>{formatNumber(repository.monthlyPrCheckUsage)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-slate-800"
                    style={{ width: `${Math.max(8, (repository.monthlyPrCheckUsage / totalUsage) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
