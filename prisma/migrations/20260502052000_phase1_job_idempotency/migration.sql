-- AlterTable
ALTER TABLE "UsageRecord"
ADD COLUMN "sourceKey" TEXT;

-- CreateTable
CREATE TABLE "PaddleWebhookEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "message" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "PaddleWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaddleWebhookEvent_eventId_key" ON "PaddleWebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX "PaddleWebhookEvent_organizationId_idx" ON "PaddleWebhookEvent"("organizationId");

-- CreateIndex
CREATE INDEX "PaddleWebhookEvent_eventType_idx" ON "PaddleWebhookEvent"("eventType");

-- CreateIndex
CREATE INDEX "PaddleWebhookEvent_status_idx" ON "PaddleWebhookEvent"("status");

-- CreateIndex
CREATE INDEX "PaddleWebhookEvent_createdAt_idx" ON "PaddleWebhookEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UsageRecord_organizationId_metric_periodStart_sourceKey_key" ON "UsageRecord"("organizationId", "metric", "periodStart", "sourceKey");

-- CreateIndex
CREATE INDEX "UsageRecord_organizationId_metric_periodStart_idx" ON "UsageRecord"("organizationId", "metric", "periodStart");

-- AddForeignKey
ALTER TABLE "PaddleWebhookEvent" ADD CONSTRAINT "PaddleWebhookEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
