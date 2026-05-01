-- AlterTable
ALTER TABLE "GitHubWebhookDelivery"
ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastAttemptAt" TIMESTAMP(3),
ADD COLUMN "nextRetryAt" TIMESTAMP(3),
ADD COLUMN "lastError" TEXT;

-- CreateIndex
CREATE INDEX "GitHubWebhookDelivery_nextRetryAt_idx" ON "GitHubWebhookDelivery"("nextRetryAt");
