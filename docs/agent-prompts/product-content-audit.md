# Prompt: Product Content Audit

Copy/paste to review and correct every word a user or the public reads. Sonnet-tier can execute; Fable/Opus-tier if positioning itself is in question.

---

You are working in the MergeAttest repository — a GitHub-native control center governing AI-assisted pull requests, aimed at skeptical engineering/compliance leads. Voice: operational, exact, governance-oriented; mechanisms over adjectives. Stage: free early access, pre-customer; AI review execution disabled; billing dormant.

**Goal:** audit all product copy for wrong claims, staleness, off-voice language, and cross-surface inconsistency — then fix it at the source.

**Required reading:** `docs/agents/playbooks/product-content-audit.md` (the method — follow its surface order and claim rules), `PRODUCT.md`, `lib/site.ts`, `components/marketing/content.ts`, `docs/operations/AI_DISCOVERABILITY.md`.

**Scope boundaries:** copy and metadata only — no layout changes, no new sections, no route changes. Fix strings in their **source** (`content.ts`, `site.ts`, page components); never fork a string into a second location. Substantive `/privacy` or `/terms` edits → draft + flag for human legal review, don't finalize.

**Tasks:**

1. Audit in the playbook's order: `lib/site.ts` spine → landing sections → FAQ → plan/billing copy → app microcopy (empty states, onboarding, toasts, errors) → legal/trust → SEO/JSON-LD → discovery files.
2. For each surface, record findings as: surface / current text / problem (wrong claim, stale, off-voice, inconsistent) / fix.
3. Apply the claim rules hard: no invented traction/testimonials/pricing; "supports EU AI Act / SOC2 **reviews**", never "certified/compliant"; no live-AI-review or paid-plan language; GitHub is the only SCM.
4. Fix and re-verify cross-surface parity (page ↔ metadata ↔ llms files).

**Quality bar:** copy section of `docs/agents/PROJECT_QUALITY_BAR.md`.

**Safety:** no production touches; no pushes; no new claims without code truth behind them; flag legal edits.

**Checks:** `pnpm lint && pnpm typecheck`; render affected pages in both themes to catch copy-length overflow; scoped prettier.

**Git:** commit as `copy: product content audit fixes (<date>)`. Do not push.

**Final report:** findings table (surface, before → after, reason); claim-safety confirmation; surfaces verified clean; human-review flags; commit hash.
