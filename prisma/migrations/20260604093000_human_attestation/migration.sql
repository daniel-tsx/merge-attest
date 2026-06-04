-- AlterEnum
ALTER TYPE "RuleActionType" ADD VALUE 'require_human_attestation';

-- AlterEnum
ALTER TYPE "AuditEventType" ADD VALUE 'human_attestation_recorded';

-- CreateTable
CREATE TABLE "Attestation" (
    "id" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "agentSource" "AgentSource" NOT NULL,
    "attributionConfidence" INTEGER NOT NULL DEFAULT 0,
    "headSha" TEXT,
    "reviewerId" TEXT,
    "pullRequestId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attestation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attestation_pullRequestId_idx" ON "Attestation"("pullRequestId");

-- CreateIndex
CREATE INDEX "Attestation_organizationId_idx" ON "Attestation"("organizationId");

-- AddForeignKey
ALTER TABLE "Attestation" ADD CONSTRAINT "Attestation_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attestation" ADD CONSTRAINT "Attestation_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "PullRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attestation" ADD CONSTRAINT "Attestation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
