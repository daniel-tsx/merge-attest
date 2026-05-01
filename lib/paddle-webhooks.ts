import { getPaddleClient, getPaddleWebhookSecret, getPlanKeyForPaddlePriceId } from "@/lib/billing";
import { getPrismaClient } from "@/lib/prisma";
import type { PlanKey } from "@/lib/types";

type PaddleSubscriptionData = {
  id?: string;
  status?: string;
  customerId?: string;
  customData?: Record<string, unknown> | null;
  items?: Array<{ price?: { id?: string } | null }>;
};

type PaddleEvent = {
  eventType: string;
  eventId?: string;
  data: PaddleSubscriptionData;
};

const subscriptionEvents = new Set([
  "subscription.created",
  "subscription.activated",
  "subscription.updated",
  "subscription.trialing",
  "subscription.resumed",
  "subscription.paused",
  "subscription.past_due",
  "subscription.canceled",
]);

function asPaddleEvent(value: unknown): PaddleEvent {
  const event = value as { eventType?: unknown; eventId?: unknown; data?: unknown };
  const data = event.data as PaddleSubscriptionData | undefined;

  if (typeof event.eventType !== "string" || !data || typeof data !== "object") {
    throw new Error("Unsupported Paddle webhook event payload.");
  }

  return {
    eventType: event.eventType,
    eventId: typeof event.eventId === "string" ? event.eventId : undefined,
    data,
  };
}

export function getPlanKeyFromSubscriptionData(data: PaddleSubscriptionData): PlanKey | null {
  const customPlanKey = data.customData?.planKey;
  if (
    customPlanKey === "free" ||
    customPlanKey === "starter" ||
    customPlanKey === "team" ||
    customPlanKey === "growth" ||
    customPlanKey === "enterprise"
  ) {
    return customPlanKey;
  }

  const priceId = data.items?.find((item) => item.price?.id)?.price?.id;
  return getPlanKeyForPaddlePriceId(priceId);
}

function getOrganizationLookup(data: PaddleSubscriptionData) {
  const organizationId = data.customData?.organizationId;

  if (typeof organizationId === "string" && organizationId) {
    return { id: organizationId };
  }

  if (data.id) return { paddleSubscriptionId: data.id };
  if (data.customerId) return { paddleCustomerId: data.customerId };

  return null;
}

export async function processPaddleSubscriptionEvent(event: PaddleEvent) {
  const prisma = getPrismaClient();
  if (!prisma || !subscriptionEvents.has(event.eventType)) {
    return { processed: false, message: "Paddle event ignored." };
  }

  const organizationLookup = getOrganizationLookup(event.data);
  if (!organizationLookup) {
    return { processed: false, message: "Paddle event did not include organization or subscription identifiers." };
  }

  const planKey = getPlanKeyFromSubscriptionData(event.data);
  const isCanceled = event.eventType === "subscription.canceled";
  const organization = await prisma.organization.findFirst({ where: organizationLookup });

  if (!organization) {
    return { processed: false, message: "No organization matched this Paddle subscription event." };
  }

  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      planKey: isCanceled ? "free" : planKey ?? organization.planKey,
      paddleCustomerId: event.data.customerId ?? organization.paddleCustomerId,
      paddleSubscriptionId: event.data.id ?? organization.paddleSubscriptionId,
      paddleSubscriptionStatus: event.data.status ?? event.eventType,
      paddlePriceId: event.data.items?.find((item) => item.price?.id)?.price?.id ?? organization.paddlePriceId,
    },
  });

  await prisma.auditEvent.create({
    data: {
      eventType: "settings_changed",
      actor: "Paddle",
      summary: `Paddle ${event.eventType} processed`,
      metadata: {
        eventId: event.eventId,
        subscriptionId: event.data.id,
        customerId: event.data.customerId,
        planKey: isCanceled ? "free" : planKey,
      },
      organizationId: organization.id,
    },
  });

  return { processed: true, message: `Paddle ${event.eventType} processed.` };
}

export async function unmarshalPaddleWebhook(rawBody: string, signature: string | null) {
  const paddle = getPaddleClient();
  const secret = getPaddleWebhookSecret();

  if (!paddle || !secret || !signature) {
    throw new Error("Paddle webhook credentials are not configured.");
  }

  return asPaddleEvent(await paddle.webhooks.unmarshal(rawBody, secret, signature));
}
