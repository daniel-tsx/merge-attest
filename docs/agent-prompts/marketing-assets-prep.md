# Prompt: Marketing Assets Prep

Copy/paste to prepare launch/marketing assets. Sonnet-tier for execution; Fable-tier if the narrative itself needs shaping. **Agents draft; humans publish.**

---

You are working in the MergeAttest repository — a GitHub-native control center governing AI-assisted pull requests. Audience: engineering leads and compliance owners who reward specificity and distrust hype. Stage: free early access, pre-customer — no traction numbers exist, and none may be implied.

**Goal:** produce a ready-to-use asset pack: screenshots, OG concept, social drafts, and blog angles — every claim mapped to shipped behavior.

**Required reading:** `docs/agents/playbooks/marketing-assets.md` (the method — follow it), `PRODUCT.md`, `lib/site.ts`, `docs/strategy/ENHANCEMENT_PLAN.md` (what's actually shipped). Claude agents: `eastbase-blog-post` skill for long-form drafts.

**Asset targets for this run:** <list what you need: e.g., Product Hunt set / X thread / LinkedIn post / blog outline — delete the rest>

**Scope boundaries:** drafts and captures only — no publishing, no account access, no posting anywhere, no changes to product code (except `app/opengraph-image.tsx` if an OG implementation is explicitly requested).

**Tasks:**

1. Screenshots: demo mode (empty `DATABASE_URL`), dark theme for the control-room signature; shot list per the playbook (dashboard, PR detail with attribution evidence, reports, rules, audit log, landing hero); target-spec dimensions; note that screenshot tooling on this machine can be unreliable — flag any capture a human must retake.
2. OG concept: blueprint palette, seal/GateScan mark, record/ledger visual — concept + layout description unless implementation was requested.
3. Social drafts: problem → mechanism → free-early-access invite; X (crisp claim + shot) and LinkedIn (short build-in-public narrative); zero hype adjectives, zero invented numbers, disclosure where relevant.
4. Blog angles: 3–5 product-led angles that are useful without buying (deterministic scoring vs. LLM judgment; how attribution evidence works; EU AI Act human-oversight for dev teams; building an attestation gate).
5. Assemble everything into `docs/design/MARKETING_ASSETS_<date>.md` (or attach as output) with per-asset claim notes.

**Quality bar:** copy rules from `docs/agents/PROJECT_QUALITY_BAR.md`; every asset survives the "would a skeptical engineer roll their eyes?" test.

**Safety:** never publish or post; no real user data in captures; no invented metrics/testimonials; flag all publishing steps as human-only.

**Checks:** claims cross-checked against `ENHANCEMENT_PLAN.md` shipped statuses; prettier on new docs.

**Git:** commit drafts as `docs: marketing asset pack (<date>)`. Do not push.

**Final report:** asset inventory (item, channel, claims used); claim-safety confirmation; captures needing human retakes; the human-only publishing checklist.
