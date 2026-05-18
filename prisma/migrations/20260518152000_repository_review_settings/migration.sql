-- CreateEnum
CREATE TYPE "AiReviewDepth" AS ENUM ('standard', 'deep');

-- CreateTable
CREATE TABLE "RepositoryReviewSettings" (
    "id" TEXT NOT NULL,
    "aiReviewsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reviewDepth" "AiReviewDepth" NOT NULL DEFAULT 'standard',
    "minimumSeverity" "Severity" NOT NULL DEFAULT 'medium',
    "model" TEXT,
    "ignoredPaths" JSONB NOT NULL DEFAULT '[]',
    "stackTags" JSONB NOT NULL DEFAULT '[]',
    "publishInlineComments" BOOLEAN NOT NULL DEFAULT true,
    "publishManagedComment" BOOLEAN NOT NULL DEFAULT true,
    "publishCheckRun" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepositoryReviewSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RepositoryReviewSettings_repositoryId_key" ON "RepositoryReviewSettings"("repositoryId");

-- CreateIndex
CREATE INDEX "RepositoryReviewSettings_organizationId_idx" ON "RepositoryReviewSettings"("organizationId");

-- AddForeignKey
ALTER TABLE "RepositoryReviewSettings" ADD CONSTRAINT "RepositoryReviewSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositoryReviewSettings" ADD CONSTRAINT "RepositoryReviewSettings_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
