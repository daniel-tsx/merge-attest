ALTER TABLE "Organization"
ADD COLUMN "lemonSqueezyCustomerId" TEXT,
ADD COLUMN "lemonSqueezySubscriptionId" TEXT,
ADD COLUMN "lemonSqueezySubscriptionStatus" TEXT,
ADD COLUMN "lemonSqueezyVariantId" TEXT,
ADD COLUMN "lemonSqueezyPriceId" TEXT;

ALTER TABLE "Organization"
DROP COLUMN "paddleCustomerId",
DROP COLUMN "paddleSubscriptionId",
DROP COLUMN "paddleSubscriptionStatus",
DROP COLUMN "paddlePriceId";

DROP TABLE "PaddleWebhookEvent";

CREATE TABLE "BillingWebhookEvent" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "message" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "BillingWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingWebhookEvent_deliveryId_key" ON "BillingWebhookEvent"("deliveryId");
CREATE INDEX "BillingWebhookEvent_organizationId_idx" ON "BillingWebhookEvent"("organizationId");
CREATE INDEX "BillingWebhookEvent_eventName_idx" ON "BillingWebhookEvent"("eventName");
CREATE INDEX "BillingWebhookEvent_status_idx" ON "BillingWebhookEvent"("status");
CREATE INDEX "BillingWebhookEvent_createdAt_idx" ON "BillingWebhookEvent"("createdAt");

ALTER TABLE "BillingWebhookEvent" ADD CONSTRAINT "BillingWebhookEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
