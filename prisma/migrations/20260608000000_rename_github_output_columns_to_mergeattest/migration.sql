-- MergeAttest rebrand: keep GitHub output identifiers aligned with the
-- product name while preserving existing check/comment ids.
ALTER TABLE "PullRequest" RENAME COLUMN "githubAuteurCommentId" TO "githubMergeAttestCommentId";
ALTER TABLE "PullRequest" RENAME COLUMN "githubAuteurCheckRunId" TO "githubMergeAttestCheckRunId";
