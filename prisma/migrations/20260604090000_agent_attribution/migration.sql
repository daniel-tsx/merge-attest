-- AlterEnum
ALTER TYPE "AuditEventType" ADD VALUE 'agent_identity_rule_changed';

-- CreateEnum
CREATE TYPE "AgentIdentityMatchType" AS ENUM ('bot_login', 'email_domain', 'branch_prefix', 'label', 'commit_trailer');

-- AlterTable
ALTER TABLE "PullRequest"
ADD COLUMN "attributionConfidence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "attributionEvidence" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "AgentIdentityRule" (
    "id" TEXT NOT NULL,
    "agentSource" "AgentSource" NOT NULL,
    "matchType" "AgentIdentityMatchType" NOT NULL,
    "pattern" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentIdentityRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentIdentityRule_organizationId_idx" ON "AgentIdentityRule"("organizationId");

-- AddForeignKey
ALTER TABLE "AgentIdentityRule" ADD CONSTRAINT "AgentIdentityRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
