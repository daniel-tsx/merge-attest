import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { plans } from "@/lib/plans";
import type { PlanKey } from "@/lib/types";

const paidPlanPriceEnv: Partial<Record<PlanKey, string>> = {
  starter: "PADDLE_STARTER_PRICE_ID",
  team: "PADDLE_TEAM_PRICE_ID",
  growth: "PADDLE_GROWTH_PRICE_ID",
};

export function getPaddleClient() {
  if (!process.env.PADDLE_API_KEY) return null;

  return new Paddle(process.env.PADDLE_API_KEY, {
    environment: process.env.PADDLE_ENVIRONMENT === "production" ? Environment.production : Environment.sandbox,
  });
}

export function getBillingMode() {
  return getPaddleClient() ? "live" : "mock";
}

export function getPaddleWebhookSecret() {
  return process.env.PADDLE_WEBHOOK_SECRET?.trim() || null;
}

export function isPaidPlan(planKey: PlanKey) {
  return planKey === "starter" || planKey === "team" || planKey === "growth";
}

export function getPaddlePriceId(planKey: PlanKey) {
  const envKey = paidPlanPriceEnv[planKey];
  return envKey ? process.env[envKey]?.trim() || null : null;
}

export function getPlanKeyForPaddlePriceId(priceId: string | null | undefined): PlanKey | null {
  if (!priceId) return null;

  for (const [planKey, envKey] of Object.entries(paidPlanPriceEnv) as Array<[PlanKey, string]>) {
    if (process.env[envKey]?.trim() === priceId) return planKey;
  }

  return null;
}

export async function createCheckoutTransaction(input: {
  organizationId: string;
  planKey: PlanKey;
  customerId?: string | null;
}) {
  const paddle = getPaddleClient();
  const priceId = getPaddlePriceId(input.planKey);

  if (!paddle || !priceId) return null;

  return paddle.transactions.create({
    items: [{ priceId, quantity: 1 }],
    customerId: input.customerId ?? undefined,
    customData: {
      organizationId: input.organizationId,
      planKey: input.planKey,
    },
  });
}

export { plans };
