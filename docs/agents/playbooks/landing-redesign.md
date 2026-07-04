# Playbook: Landing Redesign / Polish

**Status:** `current` (2026-07-04)
**Current landing:** "Paper of Record" register, shipped 2026-07 (`app/page.tsx`; history in `docs/archive/design/FABLE_LANDING_DIRECTIONS*.md`). A polish pass refines it; a redesign replaces it — confirm which one the owner wants before demolishing a shipped direction.

## Read First

1. `PRODUCT.md` — users, purpose, brand personality, **anti-references** (these are hard constraints)
2. `DESIGN.md` + `docs/features/DESIGN_SYSTEM.md` + `app/globals.css` — tokens, type, motion rules
3. `app/page.tsx` + `components/marketing/content.ts` + `lib/site.ts` — current structure and canonical copy
4. `docs/agents/PROJECT_QUALITY_BAR.md` — landing pass/fail line
5. Claude agents: the `eastbase-premium-ui` skill (method), then apply this project's signature

## Understand the Positioning Before Designing

The buyer is a skeptical engineering/compliance lead drowning in agent-authored PRs. The product's proof is **deterministic mechanics** — attribution evidence, risk signals, attestations, audit trail. Every section must show a mechanism, not claim a benefit. The page itself must feel audited: exact copy, no hype adjectives, no invented numbers. Launch posture is free early access — CTAs are "install / start free", never pricing.

## Creating Design Directions (redesign only)

- Produce 3–5 named directions as static prototypes or structured written concepts (use `docs/agent-prompts/landing-design-directions.md`).
- Each direction: name, concept metaphor, section list, hero treatment, type/motion plan, and what it deliberately rejects.
- All directions must stay inside the system: blueprint palette, Geist + Fraunces, no gradient backgrounds, evidence-over-claims copy. Divergence is in **structure and metaphor**, not palette.
- Park direction docs under `docs/archive/design/` once one ships (follow the FABLE_LANDING_DIRECTIONS precedent).

## Implementing

- Build in `app/page.tsx` with marketing copy centralized in `components/marketing/content.ts`; serif ceremony via `components/marketing/display-font.ts`.
- Keep the section contract unless deliberately changing it: hero + attestation seal, `#record`, `#method`, `#live`, `#evidence`, `#faq`, footer — anchor IDs are used by in-page nav.
- Motion: near-static; staggered `[data-intro]` hero rise plus at most one signature moment (currently `.attest-draw`). Everything under the `prefers-reduced-motion` kill-switch. Nothing loops.
- Server-render everything; no client JS beyond what interaction requires.

## Preserve SEO & Metadata

- Titles/descriptions/keywords come from `lib/site.ts` — update there, not inline.
- Keep `app/sitemap.ts` routes, `app/opengraph-image.tsx`, and JSON-LD in `lib/seo/**` consistent with new copy.
- If positioning language changes, update `public/llms.txt` / `llms-full.txt` / `ai-discovery.json` in the same pass (see `../playbooks/ai-agent-discoverability.md`).

## Avoiding Generic SaaS Sections

Banned outright (from `PRODUCT.md` anti-references): centered icon-card feature grids, hero metrics/logo walls/social proof (pre-customer), decorative AI pills and purple gradients, testimonial carousels, "trusted by" strips. If a section idea would look at home on a template marketplace, replace it with a real product surface (scan, ledger, evidence packet).

## Verify

- `pnpm lint && pnpm typecheck`; scoped prettier on touched files.
- Browser: 380px / 768px / 1280px, both themes, keyboard-only pass (focus rings), reduced-motion emulation.
- Preview quirks on this machine: verify text via DOM queries (`textContent`, not `innerText`); screenshots may be unavailable — use `preview_eval` + accessibility snapshot instead.
- Confirm copy parity: page ↔ `lib/site.ts` ↔ OG image ↔ llms files.

## Output

Changed files, before/after section map, claims-check confirmation ("no invented traction/pricing"), verification results per viewport, and any archived direction docs — per `docs/agent-prompts/handoff-after-major-task.md`.
