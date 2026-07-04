# Skill Spec: mergeattest-blog-planner

**Status:** `current` spec (2026-07-04) — not yet converted to a skill.

**Purpose:** plan (and optionally draft) product-grounded blog series for MergeAttest — builder-notes writing that is useful even if the reader never installs the product, mined from the product's genuinely teachable mechanisms.

**When to use:** starting a content program; needing a 6–10 post series plan; turning a shipped feature into standalone-value writing.

**When not to use:** SEO keyword-stuffing content (never); marketing page copy (content-audit skill); posts about unshipped features presented as current; non-MergeAttest writing.

**Required inputs:** none mandatory; optional: series theme, post count, whether to draft post #1, target publication (default: Eastbase Lab — a human decision).

**Required project docs:** `docs/agent-prompts/blog-series-for-product.md` (the full brief), `PRODUCT.md`, `docs/features/AI_GOVERNANCE.md` (mechanism goldmine), `docs/strategy/ENHANCEMENT_PLAN.md` (shipped truth). Writing standard: the `eastbase-blog-post` skill — this spec layers product knowledge on top of it, never replaces it.

**Workflow:**

1. Mine teachable material: attribution signal weighting, deterministic risk scoring design, test-gap detection, attestation gates, EU AI Act human-oversight in practice, building for auditors.
2. Plan each post: specific working title; angle + thesis; target reader; standalone usefulness; product mechanism drawn on; honest-experience hook.
3. Sequence: standalone value first, product-adjacent later; mark repurposing candidates (X/LinkedIn).
4. Mark posts blocked on unshipped features.
5. Draft post #1 per the writing standard if requested.

**Expected outputs:** series plan doc; optionally a full first draft.

**Files likely created/updated:** `docs/design/BLOG_SERIES_<date>.md` (or task output only — this repo has no blog engine).

**Checks to run:** every product claim vs. `ENHANCEMENT_PLAN.md` shipped statuses; prettier on new docs.

**Safety boundaries:** drafts only, no publishing; no invented customer stories (our own build-in-public experience is fine, labeled as ours); no hype, no AI-writing tells.

**Final report format:** series at a glance (title + one-liner each); recommended order; blocked posts; repurposing notes.

**Example invocation prompt:** "Plan a 7-post MergeAttest blog series around 'governing AI-written code', and draft the first post."
