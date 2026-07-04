# Skill Spec: mergeattest-content-audit

**Status:** `current` spec (2026-07-04) — not yet converted to a skill.

**Purpose:** audit and fix every word users and the public read — landing, app microcopy, legal, metadata, discovery files — against MergeAttest's voice (operational, exact, mechanism-first) and hard claim rules (pre-customer, free early access, AI execution disabled).

**When to use:** periodic copy hygiene; after features ship (copy usually lags); before launch pushes; when the owner notices off-voice or stale text anywhere.

**When not to use:** repositioning work (that's a strategy conversation first); layout/section changes (landing redesign skill); legal rewrites (draft + human review only).

**Required inputs:** none mandatory; optional: surfaces to prioritize, known-bad strings.

**Required project docs:** `docs/agents/playbooks/product-content-audit.md` (the method), `PRODUCT.md`, `lib/site.ts`, `components/marketing/content.ts`, `docs/operations/AI_DISCOVERABILITY.md`, `docs/agents/PROJECT_QUALITY_BAR.md` copy section.

**Workflow:**

1. Audit in the playbook's surface order: `site.ts` spine → landing → FAQ → plan/billing copy → app microcopy (empty states, onboarding, toasts, errors) → legal/trust → SEO/JSON-LD → `llms*.txt`/`ai-discovery.json`.
2. Classify findings: wrong claim / stale / off-voice / inconsistent.
3. Enforce claim rules: no traction/testimonials/pricing; "supports EU AI Act / SOC2 **reviews**" never "certified"; no live-AI or paid-plan language; GitHub-only.
4. Fix at the source (`content.ts` / `site.ts` / page component); never fork strings.
5. Re-verify cross-surface parity (page ↔ metadata ↔ discovery files).

**Expected outputs:** findings table (surface, before → after, reason); fixed sources; parity confirmation.

**Files likely created/updated:** `components/marketing/content.ts`, `lib/site.ts`, page components' microcopy, `lib/seo/*`, `public/llms*.txt`, `public/ai-discovery.json`; drafts for `/privacy` `/terms` flagged, not finalized.

**Checks to run:** `pnpm lint && pnpm typecheck`; render affected pages both themes (copy-length overflow); scoped prettier.

**Safety boundaries:** copy only — no layout/route/behavior changes; no new claims without code truth; legal edits human-flagged; no pushes.

**Final report format:** findings table; claim-safety confirmation; surfaces verified clean; human-review flags; commit hash.

**Example invocation prompt:** "Run a MergeAttest content audit — focus on app microcopy and the FAQ; the attestation feature shipped changes last month and I suspect the copy lags."
