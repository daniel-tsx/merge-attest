-- AlterEnum
ALTER TYPE "RuleActionType" ADD VALUE 'publish_github_check';

-- AlterTable
ALTER TABLE "RepoRule"
ADD COLUMN "branchPattern" TEXT,
ADD COLUMN "pathPattern" TEXT,
ADD COLUMN "labelPattern" TEXT,
ADD COLUMN "agentSource" "AgentSource",
ADD COLUMN "minimumRiskLevel" "RiskLevel",
ADD COLUMN "codeOwnerHint" TEXT;
