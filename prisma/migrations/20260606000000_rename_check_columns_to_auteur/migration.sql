-- Auteur rebrand: rename PullRequest check-run/comment columns to drop the
-- legacy "AgentGate" name. RENAME preserves existing values (Prisma's default
-- diff would emit DROP + ADD COLUMN, which would lose stored GitHub IDs).
ALTER TABLE "PullRequest" RENAME COLUMN "githubAgentGateCommentId" TO "githubAuteurCommentId";
ALTER TABLE "PullRequest" RENAME COLUMN "githubAgentGateCheckRunId" TO "githubAuteurCheckRunId";
