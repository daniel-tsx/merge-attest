# Skill Spec: mergeattest-marketing-assets

**Status:** `current` spec (2026-07-04) — not yet converted to a skill.

**Purpose:** produce claim-safe launch/marketing assets for MergeAttest — screenshots from real product surfaces, OG concepts, social drafts, blog angles — for an audience (engineering/compliance leads) that rewards specificity and punishes hype. Agents draft; humans publish.

**When to use:** preparing a Product Hunt/directory launch, an announcement, or a content push; refreshing stale assets after UI changes.

**When not to use:** actually publishing anything (human-only, always); long-form writing (that's `blog-series-planner` / the `eastbase-blog-post` skill); paid-plan store assets while billing is dormant.

**Required inputs:** asset targets for the run (PH set / X / LinkedIn / blog outline / OG); channel specs if unusual.

**Required project docs:** `docs/agents/playbooks/marketing-assets.md` (the method, incl. shot list and Reddit-safe rules), `PRODUCT.md`, `lib/site.ts`, `docs/strategy/ENHANCEMENT_PLAN.md` (shipped truth).

**Workflow:**

1. Screenshots: demo mode (empty `DATABASE_URL`), dark theme; playbook shot list (dashboard, PR detail with attribution evidence, reports, rules, audit log, landing hero); target dimensions; flag captures a human must retake if tooling is unreliable.
2. OG concept: blueprint palette, seal/GateScan mark, record/ledger visual — concept-level unless implementation requested.
3. Social drafts: problem → mechanism → free-early-access invite; zero hype adjectives, zero invented numbers; disclosure on discussion-style posts.
4. Blog angles: 3–5 product-led, useful-without-buying.
5. Assemble into `docs/design/MARKETING_ASSETS_<date>.md` with per-asset claim notes.

**Expected outputs:** asset pack with every claim mapped to shipped behavior; human-only publishing checklist.

**Files likely created/updated:** `docs/design/MARKETING_ASSETS_*.md`, image captures; `app/opengraph-image.tsx` only if explicitly requested.

**Checks to run:** claims vs. `ENHANCEMENT_PLAN.md` statuses; prettier on new docs.

**Safety boundaries:** never publish/post/access accounts; no real user data in captures; no invented metrics/testimonials/logos; free-early-access posture in every asset.

**Final report format:** asset inventory (item, channel, claims used); claim-safety confirmation; captures needing human retakes; publishing checklist.

**Example invocation prompt:** "Prep MergeAttest marketing assets: a Product Hunt screenshot set (dark theme) and an X announcement draft. We announce in two weeks."
