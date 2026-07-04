# Prompt: Landing Design Directions

Copy/paste to generate 3–5 project-specific landing directions **before** committing to a redesign. High-judgment model strongly recommended (Fable-tier).

---

You are working in the MergeAttest repository. MergeAttest is a GitHub-native control center governing AI-assisted pull requests (agent attribution with evidence, deterministic risk scoring, test-gap detection, rules, approvals/attestations, compliance evidence export). Audience: skeptical engineering leads and compliance owners who distrust AI-washing. Stage: free early access, pre-customer — no pricing, no social proof exists.

**Goal:** produce 3–5 named, genuinely distinct landing page design directions for the owner to choose from. Directions only — do not modify `app/page.tsx` in this task.

**Required reading:** `PRODUCT.md` (personality + anti-references — hard constraints), `DESIGN.md`, `docs/features/DESIGN_SYSTEM.md`, `app/globals.css`, current `app/page.tsx` + `components/marketing/content.ts`, `docs/agents/playbooks/landing-redesign.md`, `docs/archive/design/FABLE_LANDING_DIRECTIONS.md` (the precedent — the shipped "Paper of Record" direction came from this process). Claude agents: also the `eastbase-premium-ui` skill.

**Scope boundaries:** deliver a directions document (and optionally static HTML prototypes under a scratch folder or `docs/` — no new dependencies, no changes to shipped routes). Divergence between directions lives in **structure, narrative, and metaphor** — all directions stay on the blueprint palette, Geist + Fraunces, no gradient backgrounds, evidence-over-claims copy.

**Tasks:**

1. Extract the positioning spine: who, pain (agent PR volume outpacing review; auditors asking for AI-authorship evidence), mechanism, proof surfaces (scan, record, ledger, evidence packet).
2. For each direction (3–5): name; one-sentence concept metaphor; hero treatment (headline draft + visual); full section list with what each section _shows_ (real mechanism, not claims); type/motion plan (near-static + at most one signature moment); what this direction deliberately rejects; risk/effort note.
3. Make the directions truly different — e.g., different narrative spines (audit artifact vs. control room vs. ledger vs. field manual), not the same page with different heroes.
4. Rank them with a recommendation and rationale against the audience's skepticism.
5. Write the result to `docs/design/LANDING_DIRECTIONS_<date>.md` (create `docs/design/` if needed) and note in the doc that it moves to `docs/archive/design/` once a direction ships.

**Quality bar:** each direction implementable within the current token/component system; zero invented traction or pricing in any copy draft; anti-references respected (no icon-card grids, no logo walls, no AI-pill decoration).

**Safety:** no production touches; no pushes; drafts only.

**Checks:** prettier on the new doc; links resolve.

**Git:** commit as `docs: add landing design directions (<date>)`. Do not push.

**Final report:** the directions summarized in 2–3 lines each, your recommendation and why, and what the owner must decide before implementation starts.
