-- CreateTable
CREATE TABLE "GitHubWebhookDelivery" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "action" TEXT,
    "status" TEXT NOT NULL DEFAULT 'received',
    "message" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "GitHubWebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GitHubWebhookDelivery_deliveryId_key" ON "GitHubWebhookDelivery"("deliveryId");

-- CreateIndex
CREATE INDEX "GitHubWebhookDelivery_organizationId_idx" ON "GitHubWebhookDelivery"("organizationId");

-- CreateIndex
CREATE INDEX "GitHubWebhookDelivery_event_idx" ON "GitHubWebhookDelivery"("event");

-- CreateIndex
CREATE INDEX "GitHubWebhookDelivery_status_idx" ON "GitHubWebhookDelivery"("status");

-- AddForeignKey
ALTER TABLE "GitHubWebhookDelivery" ADD CONSTRAINT "GitHubWebhookDelivery_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
