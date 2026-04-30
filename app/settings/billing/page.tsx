import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { organization } from "@/lib/demo-data";
import { plans } from "@/lib/plans";

export default function BillingSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Billing" description="Plan gates are implemented in code; Paddle checkout is mocked until credentials are configured." />
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.key} className={plan.key === organization.planKey ? "border-slate-950" : undefined}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{plan.name}</CardTitle>
                {plan.key === organization.planKey ? <Badge tone="blue">current</Badge> : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-2xl font-semibold">{plan.priceMonthly}<span className="text-sm font-normal text-slate-500">/month</span></div>
              <div className="space-y-1 text-sm text-slate-600">
                <div>{plan.repositoryLimit}</div>
                <div>{plan.prCheckLimit}</div>
                <div>{plan.auditRetention}</div>
              </div>
              <ul className="space-y-1 text-sm text-slate-700">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              <Button variant={plan.key === organization.planKey ? "secondary" : "default"} className="w-full">
                {plan.key === organization.planKey ? "Current plan" : "Mock checkout"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
