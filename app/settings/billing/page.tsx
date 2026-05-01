import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentOrganization } from "@/lib/data/app-data";
import { getPlanEntitlements, limitLabel } from "@/lib/entitlements";
import { getBillingMode, getPaddlePriceId, isPaidPlan } from "@/lib/billing";
import { plans } from "@/lib/plans";

export default async function BillingSettingsPage() {
  const organization = await getCurrentOrganization();
  const billingMode = getBillingMode();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description={`Plan gates are enforced server-side. Paddle billing mode: ${billingMode}.`}
      />
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const entitlements = getPlanEntitlements(plan.key);

          return (
            <Card key={plan.key} className={plan.key === organization.planKey ? "border-slate-950" : undefined}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.key === organization.planKey ? <Badge tone="blue">current</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-semibold">
                  {plan.priceMonthly}
                  <span className="text-sm font-normal text-slate-500">/month</span>
                </div>
                <div className="space-y-1 text-sm text-slate-600">
                  <div>{limitLabel(entitlements.repositoryLimit, "repositories")}</div>
                  <div>{limitLabel(entitlements.prCheckLimit, "PR checks/month")}</div>
                  <div>{entitlements.auditRetentionDays ? `${entitlements.auditRetentionDays}-day audit history` : "Custom audit retention"}</div>
                </div>
                <ul className="space-y-1 text-sm text-slate-700">
                  {plan.features.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
                {plan.key === organization.planKey ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Current plan
                  </Button>
                ) : isPaidPlan(plan.key) && billingMode === "live" && getPaddlePriceId(plan.key) ? (
                  <form action="/api/billing/checkout" method="post">
                    <input type="hidden" name="planKey" value={plan.key} />
                    <Button className="w-full" type="submit">
                      Start checkout
                    </Button>
                  </form>
                ) : (
                  <Button className="w-full" disabled>
                    {isPaidPlan(plan.key) ? "Configure Paddle price" : "Contact sales"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
