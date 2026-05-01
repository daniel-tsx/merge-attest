-- AlterEnum
ALTER TYPE "AuditEventType" ADD VALUE 'github_check_run_published';

-- AlterTable
ALTER TABLE "PullRequest"
ADD COLUMN "githubAgentGateCheckRunId" TEXT;
