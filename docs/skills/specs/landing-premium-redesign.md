# Skill Spec: mergeattest-landing-redesign

**Status:** `current` spec (2026-07-04) — not yet converted to a skill.

**Purpose:** orchestrate a landing redesign the house way: positioning extraction → 3–5 named directions → owner choice → implementation at shipping quality, always inside the MergeAttest signature (blueprint palette, Paper-of-Record precedent, evidence-over-claims copy).

**When to use:** the owner asks to redesign, rework, or seriously refresh `/`; positioning shifted enough that the current landing undersells the mechanism.

**When not to use:** copy tweaks or a single-section fix (use `product-content-audit` or direct edits); app/dashboard UI (use `dashboard-polish`); when a direction is already chosen and documented — then skip straight to the implementation half.

**Required inputs:** redesign vs. polish intent; any owner constraints (sections to keep, launch deadline); the chosen direction (for the implementation half).

**Required project docs:** `docs/agents/playbooks/landing-redesign.md` (the method), `PRODUCT.md` (anti-references are hard constraints), `DESIGN.md`, `docs/features/DESIGN_SYSTEM.md`, `app/globals.css`, `lib/site.ts`, `docs/agents/PROJECT_QUALITY_BAR.md`; the `eastbase-premium-ui` skill for the shared method.

**Workflow:**

1. **Phase 1 — directions** (see `docs/agent-prompts/landing-design-directions.md`): positioning spine → 3–5 named directions differing in structure/metaphor, not palette → ranked recommendation → directions doc in `docs/design/`. **Stop for owner choice.**
2. **Phase 2 — implementation** (see `docs/agent-prompts/full-landing-redesign.md`): build the chosen direction in `app/page.tsx` + `components/marketing/**`; copy centralized in `content.ts`; serif ceremony via `display-font.ts`; near-static motion with one signature moment under the reduced-motion kill-switch; sync `lib/site.ts`, OG, JSON-LD, `llms*.txt` if positioning language changed.
3. Archive the directions doc to `docs/archive/design/`; update `docs/README.md`.

**Expected outputs:** phase 1: directions doc + recommendation; phase 2: shipped landing + verification matrix + copy-parity confirmation.

**Files likely created/updated:** `app/page.tsx`, `components/marketing/*`, `app/globals.css` (additive), `lib/site.ts`, `app/opengraph-image.tsx`, `lib/seo/*`, `public/llms*.txt`, `docs/design/*` → `docs/archive/design/*`.

**Checks to run:** `pnpm lint && pnpm typecheck`; browser at 380/768/1280px, both themes, keyboard focus pass, reduced-motion emulation; DOM-query text verification (not `innerText`); scoped prettier.

**Safety boundaries:** never skip the owner-choice gate between phases; no invented traction/pricing/certifications; no gradient backgrounds; no new dependencies; no pushes.

**Final report format:** phase-appropriate — directions summary + recommendation, or section-by-section before/after + verification matrix + commit hashes.

**Example invocation prompt:** "Redesign the MergeAttest landing. Phase 1 only for now — give me 3–4 directions with a recommendation; keep the FAQ section's content."
