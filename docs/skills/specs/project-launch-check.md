# Skill Spec: mergeattest-launch-check

**Status:** `current` spec (2026-07-04) — not yet converted to a skill.

**Purpose:** run the MergeAttest-specific launch readiness gate: product-surface sweep + posture-honesty checks that the studio-level `eastbase-launch-check` skill can't know about this repo.

**When to use:** before announcing, driving traffic, submitting to directories, or flipping any launch-posture flag; after large pre-launch change batches; when the owner asks "is it ready?".

**When not to use:** ordinary feature work, routine polish (use `dashboard-polish`), pure security review (use `security-readiness-review`), or when the question is about a single surface.

**Required inputs:** none mandatory; optional: target announce date, channels planned, and whether production env access exists (it usually doesn't — then env checks are report-only).

**Required project docs:** `docs/agents/playbooks/final-launch-polish.md` (the method), `docs/operations/PRODUCTION_CHECKLIST.md`, `docs/agents/PROJECT_QUALITY_BAR.md`, `docs/AGENT_START_HERE.md` (launch posture).

**Workflow:**

1. Invoke `eastbase-launch-check` (studio gate) if available; this skill adds the MergeAttest layer, not a replacement.
2. Execute the playbook sweep: landing → auth (port 3000) → app fresh-org walkthrough → empty/loading/error states (demo mode + fresh org) → legal/support/footer → billing-surface honesty vs. `lib/entitlements.ts` → SEO/OG/discovery vs. never-invent list → assets.
3. Posture-honesty checks unique to this product: no paid-plan language while `ENABLE_PAID_BILLING` is off; no live-AI-review claims while the worker skips; free-plan limits stated correctly; `support@mergeattest.com` everywhere product-facing.
4. Fix safe P0/P1s; log everything with severity.
5. Run: `pnpm lint && pnpm typecheck && pnpm test`; `pnpm build` with `GITHUB_*` placeholders.
6. Produce verdict + human-only checklist.

**Expected outputs:** verdict (ready / ready-with-caveats / not ready / needs manual verification); findings by severity, fixed vs. deferred; manual production checklist.

**Files likely created/updated:** touched surface files (copy/state fixes), possibly `docs/operations/PRODUCTION_CHECKLIST.md` if a gate is missing; no new docs unless a finding demands one.

**Checks to run:** full CI-equivalent set (above) + browser verification of every touched surface.

**Safety boundaries:** local/dev only; never touch production services/data/webhooks; never flip `ENABLE_PAID_BILLING` or AI execution; legal edits flagged for human review; no publishing.

**Final report format:** verdict first; blocker/follow-up tables (severity, surface, finding, status); checks + real results; verified vs. assumed; human-only list; commit hashes.

**Example invocation prompt:** "Run the MergeAttest launch check — we want to announce on X and Product Hunt next week. Production env is not accessible from here; report those checks as manual items."
