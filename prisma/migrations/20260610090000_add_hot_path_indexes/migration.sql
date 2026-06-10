-- DropIndex
DROP INDEX "PullRequest_organizationId_idx";

-- CreateIndex
CREATE INDEX "PullRequest_organizationId_updatedAt_idx" ON "PullRequest"("organizationId", "updatedAt");

-- CreateIndex
CREATE INDEX "PullRequestFile_pullRequestId_idx" ON "PullRequestFile"("pullRequestId");

-- CreateIndex
CREATE INDEX "RiskSignal_pullRequestId_idx" ON "RiskSignal"("pullRequestId");

-- CreateIndex
CREATE INDEX "TestGapSuggestion_testGapAnalysisId_idx" ON "TestGapSuggestion"("testGapAnalysisId");

-- CreateIndex
CREATE INDEX "RepoRule_repositoryId_idx" ON "RepoRule"("repositoryId");

-- CreateIndex
CREATE INDEX "RuleViolation_pullRequestId_idx" ON "RuleViolation"("pullRequestId");

-- CreateIndex
CREATE INDEX "RuleViolation_ruleId_idx" ON "RuleViolation"("ruleId");

-- CreateIndex
CREATE INDEX "Approval_pullRequestId_idx" ON "Approval"("pullRequestId");

-- CreateIndex
CREATE INDEX "AgentActivity_organizationId_timestamp_idx" ON "AgentActivity"("organizationId", "timestamp");

-- CreateIndex
CREATE INDEX "AgentActivity_repositoryId_idx" ON "AgentActivity"("repositoryId");

-- CreateIndex
CREATE INDEX "AgentActivity_pullRequestId_idx" ON "AgentActivity"("pullRequestId");

-- CreateIndex
CREATE INDEX "AuditEvent_organizationId_createdAt_idx" ON "AuditEvent"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_repositoryId_idx" ON "AuditEvent"("repositoryId");

-- CreateIndex
CREATE INDEX "AuditEvent_pullRequestId_idx" ON "AuditEvent"("pullRequestId");
