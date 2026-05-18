# Merge Mate Adoption Plan

Last reviewed: 2026-05-18

## Purpose

AgentGate should remain the primary product: a GitHub-native risk, approval, and audit layer for teams shipping AI-assisted code. Merge Mate has a narrower but useful review execution loop that AgentGate should adopt selectively.

This plan is intentionally implementation-only guidance. It does not require keeping Merge Mate as a second product, and it does not require moving AgentGate to Merge Mate's split frontend/backend architecture.

## Adopted Direction

Use AgentGate as the product shell, data model, governance layer, billing owner, and UI surface.

Adopt these Merge Mate capabilities into AgentGate:

- Durable PR review queue and worker lifecycle.
- OpenRouter bring-your-own-key review provider.
- AI review statuses: queued, in progress, blocked, skipped, completed, failed.
- Strong review idempotency by organization, repository, pull request number, and head SHA.
- Diff filtering for ignored paths, generated files, lockfiles, vendored files, and empty diffs.
- AI comment validation against real changed diff lines before posting to GitHub.
- Repository-level AI review settings: enabled, review depth, model override, minimum severity, ignored paths, and stack tags.
- Duplicate GitHub output protection through stored provider ids and managed comments/check runs.
- Admin diagnostics for queues, old jobs, failed reviews, and GitHub installation health.

Avoid adopting these Merge Mate traits unless a later decision requires them:

- Separate frontend and backend deployments as the default architecture.
- Duplicated database schema ownership.
- Per-user-only ownership for organization repositories.
- Product positioning as only an AI code reviewer.

## Assumptions

- AgentGate continues to use Next.js, Prisma, Better Auth, Paddle, and the existing organization model.
- GitHub remains the first and only provider for this adoption phase.
- AI review is advisory at first. Hard blocking should come later through GitHub check runs and customer-configured policy.
- AgentGate keeps deterministic risk scoring, test-gap detection, and rule evaluation as the source of trust. AI comments complement these signals, not replace them.

## Target Architecture

Add a worker boundary without splitting the product UI from the app by default.

Recommended shape:

- `lib/jobs/queue.ts`: queue client and job names.
- `lib/jobs/pr-review-worker.ts`: worker entry point for AI review jobs.
- `lib/jobs/pr-review-lifecycle.ts`: status transitions and idempotency helpers.
- `lib/ai/openrouter.ts`: OpenRouter client and key validation.
- `lib/ai/review.ts`: prompt construction, response schema, and review parsing.
- `lib/github/diff.ts`: diff fetching, parsing, commentable line detection, and filtering.
- `lib/github/output.ts`: managed GitHub comments, inline review comments, and check-run publishing.
- `app/api/jobs/pr-reviews/route.ts`: protected job runner only if using scheduled HTTP execution instead of a long-running worker.

The worker can run as one of these deployment modes:

- Long-running worker service with Redis/BullMQ for production.
- Scheduled protected job route for a small pilot.
- Local dev worker process started manually.

Prefer a real queue for pilot customers because PR review reliability is core product behavior.

## Data Model Additions

AgentGate already has `PullRequest`, `PullRequestFile`, `RiskSignal`, `TestGapAnalysis`, `RuleViolation`, `Approval`, `AgentActivity`, `AuditEvent`, and GitHub output ids. Add only the fields needed for AI review lifecycle.

Candidate additions:

- `AiReviewJob`
  - `id`
  - `organizationId`
  - `repositoryId`
  - `pullRequestId`
  - `reviewKey`
  - `provider`
  - `model`
  - `status`
  - `statusDetail`
  - `githubDeliveryId`
  - `queueJobId`
  - `githubReviewId`
  - `attemptCount`
  - `commentsCount`
  - `skippedCommentsCount`
  - `errorMessage`
  - `startedAt`
  - `completedAt`
  - `createdAt`
  - `updatedAt`

- `AiProviderCredential`
  - `id`
  - `organizationId`
  - `userId`
  - `provider`
  - `encryptedKey`
  - `lastVerifiedAt`
  - `createdAt`
  - `updatedAt`

- Extend `RepoRule` or add a dedicated `RepositoryReviewSettings`
  - `aiReviewsEnabled`
  - `reviewDepth`
  - `minimumSeverity`
  - `model`
  - `ignoredPaths`
  - `stackTags`
  - `publishInlineComments`
  - `publishManagedComment`
  - `publishCheckRun`

Use a unique review key:

```text
organizationId:repositoryId:pullNumber:headSha
```

This avoids double charging and duplicate comments across webhook replays, manual syncs, and worker retries.

## Phase 1: Queue And Review Lifecycle

Goal: one PR head SHA creates one durable review lifecycle record.

Status: implemented on 2026-05-18 with DB-backed `AiReviewJob` lifecycle records, deterministic queue job ids, sync-time enqueueing, a protected `/api/jobs/pr-reviews` runner, and diagnostics for queued, active, blocked, failed, and stale review jobs. After Phase 5, enqueueing respects repository AI review settings and disabled repositories do not create review jobs.

Tasks:

- Add AI review status types and transition helpers.
- Add `AiReviewJob` Prisma model and migration.
- Create queue enqueue helper with idempotent review key.
- Enqueue AI review jobs from GitHub PR sync only after the deterministic risk/test-gap/rule pipeline has updated the PR.
- Treat missing OpenRouter credentials as `blocked`, not `failed`.
- Store queue job id, GitHub delivery id, attempt count, start time, completion time, and error message.
- Add admin diagnostics for queued, active, blocked, failed, and stale jobs.

Verification:

- Duplicate webhook delivery creates no duplicate review job.
- Manual resync of the same head SHA creates no duplicate review job.
- New head SHA creates a new review job and can require reapproval.
- Missing OpenRouter key creates a blocked, user-actionable status.

## Phase 2: OpenRouter BYOK Provider

Goal: let organizations or users connect an OpenRouter key without exposing it in the UI or logs.

Status: implemented on 2026-05-18 for organization-level BYOK. AgentGate stores encrypted OpenRouter credentials, verifies keys against OpenRouter, exposes save/verify/replace/delete controls under `/settings/ai`, records audit events, and keeps deleted or missing keys as blocked review jobs. Key handling trims surrounding whitespace, rejects empty or oversized keys, caps verifier request bodies, and never returns plaintext keys. Early pilot precedence is organization key only; user fallback is intentionally deferred.

Tasks:

- Add encrypted OpenRouter key storage.
- Add settings UI for save, verify, replace, and delete.
- Add provider test route that returns validity and model count, never plaintext key.
- Add audit events for key added, verified, replaced, and deleted.
- Decide precedence: organization key first, user key fallback, or user key only for early pilot.

Verification:

- Plaintext keys are never returned to clients.
- Logs redact API keys and encrypted key fields.
- Deleted keys block future AI reviews with a clear status.

## Phase 3: Diff Filtering And AI Response Guardrails

Goal: only send useful diffs and only post comments on valid changed lines.

Status: implemented on 2026-05-18 for the worker guardrail boundary. AgentGate can fetch GitHub PR diffs, parse unified hunks into added commentable lines, filter ignored, generated, lockfile, vendored, binary, oversized, and empty-file diffs, and validate AI response comments through a strict Zod schema before GitHub output is published. Repository-level ignored path settings are now integrated from Phase 5 and list entries are capped before pattern matching.

Tasks:

- Parse GitHub diff hunks into commentable lines.
- Filter ignored paths from repository settings.
- Skip generated files, lockfiles, vendored files, binary files, and very large files.
- Add max diff size and max file count controls.
- Use a strict Zod schema for AI review responses.
- Include severity, category, confidence, file path, line number, and body in the response schema.
- Drop invalid inline comments and count them as skipped.
- Convert high-level findings with no valid line into a managed summary comment instead of failing the job.

Verification:

- AI comments outside changed lines are not posted.
- Ignored path settings remove matching file hunks.
- Empty filtered diffs mark the review as skipped.
- Invalid AI JSON marks the review failed with a clear diagnostic.

## Phase 4: GitHub Output

Goal: make GitHub feedback useful, idempotent, and plan-gated.

Status: implemented on 2026-05-18 for the publishing boundary. AgentGate now has AI-specific GitHub output helpers for inline PR reviews, managed summary comments, and advisory check runs, stores provider ids on `AiReviewJob`, gates publishing through the existing GitHub comments entitlement, sanitizes AI-authored markdown before GitHub output, and prevents duplicate inline review posting when a job already has a GitHub review id. The worker still waits for real AI model execution before calling this output boundary.

Tasks:

- Add repository settings for inline comments, managed summary comment, and check run publishing.
- Store GitHub review id for inline review comments.
- Store managed comment id for summary comments and update it instead of creating new comments.
- Reuse the existing AgentGate check-run path and gate it by entitlement.
- Include links back to AgentGate PR details.
- Keep deterministic risk, test gaps, rules, and approval status visible in GitHub output.

Verification:

- Worker retry after posting does not duplicate comments.
- Re-running a review updates the managed comment.
- Free or lower-tier plans do not receive paid GitHub output.
- GitHub output can be disabled per repository.

## Phase 5: Repository Review Settings

Goal: allow teams to tune AI review noise without weakening governance signals.

Status: implemented on 2026-05-18 with dedicated `RepositoryReviewSettings`, repository-scoped AI settings under `/repositories/[id]/ai`, owner/admin mutation checks, audit events for changes, disabled-by-default enqueue behavior, worker skip handling for disabled repositories, ignored path filtering, model persistence on processed jobs, and output toggles ready for the Phase 4 publisher.

Tasks:

- Add review settings section to repository rules/settings.
- Support enabled, review depth, minimum severity, model, ignored paths, stack tags, and output toggles.
- Apply settings during queue enqueue and worker processing.
- Audit every settings change.
- Keep deterministic rules separate from AI review settings.

Verification:

- Admins and owners can update settings.
- Members and viewers cannot update settings.
- Settings affect the next review job.
- Audit log records changed fields without storing secrets.

## Phase 6: Product Integration

Goal: make AI reviews feel native to AgentGate, not bolted on.

Status: implemented on 2026-05-18 with AI review status in pull request lists, repository pull request tables, pull request detail pages, review timeline entries, blocked/skipped/failed callouts, dashboard AI review metrics, and AI review output included in Growth/Enterprise review packets. The data layer now loads only the latest AI job for list views and five recent jobs for pull request detail pages. Audit exports continue to export audit events, including AI settings/output events when those events are recorded, while review packets omit raw GitHub provider ids.

Tasks:

- Add AI review status to pull request list and detail pages.
- Add review timeline entries for queued, blocked, skipped, completed, and failed states.
- Add blocked review callouts for missing credentials, inactive billing, over-limit usage, disabled repo, and empty diff.
- Add dashboard metrics for reviews completed, blocked, skipped, failed, comments posted, and comments filtered.
- Include AI review output in review packets and audit exports where plan permits.

Verification:

- A user can understand why a review did or did not run from the PR detail page.
- Support can trace a failed review by organization, repository, PR, head SHA, delivery id, and job id.
- Audit exports preserve review lifecycle evidence.

## Phase 7: Cutover From Merge Mate

Goal: avoid running two overlapping products.

Status: intentionally out of scope. The AgentGate adoption work is wrapped at Phase 6; no Merge Mate cutover/archive work is required for this project.

Tasks:

- Freeze Merge Mate feature development after the review engine is ported.
- Keep Merge Mate as a reference implementation until AgentGate has equivalent tests.
- Move only proven unit tests and fixtures that map cleanly to AgentGate.
- Archive Merge Mate once AgentGate has queue-backed AI reviews, BYOK provider settings, diff validation, and GitHub output idempotency.

Verification:

- AgentGate covers the complete review loop with tests.
- Merge Mate has no unique customer-facing capability left.
- Documentation clearly points future work to AgentGate.

## Implementation Hardening Notes

- OpenRouter key endpoints cap request size, reject oversized keys, and avoid echoing submitted secrets.
- GitHub AI output sanitizes model-authored markdown before publishing to reduce mention spam and hidden-comment abuse.
- Review packet serialization reports whether GitHub output was published instead of exposing raw provider ids.
- List views use bounded AI review includes to avoid loading full job history for every pull request.
- Repository ignored-path and stack-tag settings are capped before processing to keep pattern matching predictable.

## First Implementation Milestone

Implement the smallest complete loop:

1. A GitHub PR sync updates deterministic AgentGate risk/test-gap/rule data.
2. AgentGate enqueues one AI review job for that PR head SHA.
3. The worker loads review settings and OpenRouter credentials.
4. The worker fetches and filters the diff.
5. The worker validates AI comments against changed lines.
6. The worker posts GitHub output idempotently.
7. AgentGate records lifecycle status, audit events, usage, and dashboard visibility.

Out of scope for the first milestone:

- Multi-provider AI routing.
- Managed AI billing.
- Hard merge blocking.
- Slack or email notifications.
- Non-GitHub providers.

## Risks

- AI review noise can reduce trust. Keep deterministic AgentGate signals primary and make AI output configurable.
- Queue infrastructure adds operational burden. Add diagnostics and retry visibility before inviting pilots.
- BYOK keys are sensitive. Redaction, encryption, deletion, and audit behavior must be tested before launch.
- Split ownership between rules and review settings can confuse users. Keep policy enforcement separate from AI comment strictness.
- Billing disputes can happen if retries count as usage. Bill only unique review keys per period.

## Definition Of Done

For each adopted capability:

- It is organization-scoped.
- It is idempotent across webhook replay and worker retry.
- It has role checks for mutations.
- It writes audit events for customer-relevant state changes.
- It does not log secrets or raw private diffs.
- It has focused tests for duplicate handling, blocked states, and authorization.
- It fails with a visible status instead of silent background errors.
