-- CreateEnum
CREATE TYPE "AiReviewStatus" AS ENUM ('queued', 'in_progress', 'blocked', 'skipped', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "AiReviewProvider" AS ENUM ('openrouter');

-- CreateTable
CREATE TABLE "AiReviewJob" (
    "id" TEXT NOT NULL,
    "reviewKey" TEXT NOT NULL,
    "provider" "AiReviewProvider" NOT NULL DEFAULT 'openrouter',
    "model" TEXT,
    "status" "AiReviewStatus" NOT NULL DEFAULT 'queued',
    "statusDetail" TEXT,
    "githubDeliveryId" TEXT,
    "queueJobId" TEXT,
    "githubReviewId" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCommentsCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "pullRequestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiReviewJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiReviewJob_reviewKey_key" ON "AiReviewJob"("reviewKey");

-- CreateIndex
CREATE INDEX "AiReviewJob_organizationId_status_idx" ON "AiReviewJob"("organizationId", "status");

-- CreateIndex
CREATE INDEX "AiReviewJob_repositoryId_status_idx" ON "AiReviewJob"("repositoryId", "status");

-- CreateIndex
CREATE INDEX "AiReviewJob_pullRequestId_idx" ON "AiReviewJob"("pullRequestId");

-- CreateIndex
CREATE INDEX "AiReviewJob_status_createdAt_idx" ON "AiReviewJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AiReviewJob_githubDeliveryId_idx" ON "AiReviewJob"("githubDeliveryId");

-- AddForeignKey
ALTER TABLE "AiReviewJob" ADD CONSTRAINT "AiReviewJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiReviewJob" ADD CONSTRAINT "AiReviewJob_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiReviewJob" ADD CONSTRAINT "AiReviewJob_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "PullRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
