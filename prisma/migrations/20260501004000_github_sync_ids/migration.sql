-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "githubAccountId" TEXT,
ADD COLUMN "githubAccountLogin" TEXT;

-- AlterTable
ALTER TABLE "Repository" ADD COLUMN "githubRepositoryId" TEXT,
ADD COLUMN "githubNodeId" TEXT,
ADD COLUMN "url" TEXT;

-- AlterTable
ALTER TABLE "PullRequest" ADD COLUMN "githubPullRequestId" TEXT,
ADD COLUMN "githubNodeId" TEXT,
ADD COLUMN "url" TEXT,
ADD COLUMN "headSha" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Repository_organizationId_githubRepositoryId_key" ON "Repository"("organizationId", "githubRepositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "PullRequest_repositoryId_githubPullRequestId_key" ON "PullRequest"("repositoryId", "githubPullRequestId");
