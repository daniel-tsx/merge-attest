# Prompt: Full Landing Redesign

Copy/paste to implement a **chosen** landing direction. Prerequisite: the owner has picked a direction (see `landing-design-directions.md`). Fable/Opus-tier work.

---

You are working in the MergeAttest repository. MergeAttest is a GitHub-native control center governing AI-assisted pull requests, for skeptical engineering/compliance leads. Free early access, pre-customer. The current landing is the "Paper of Record" register in `app/page.tsx`.

**Chosen direction:** <paste the direction name + its section from the directions doc here>

**Goal:** replace/rework the landing page to fully realize the chosen direction at shipping quality.

**Required reading:** `docs/agents/playbooks/landing-redesign.md` (the method — follow it), `PRODUCT.md`, `DESIGN.md`, `docs/features/DESIGN_SYSTEM.md`, `app/globals.css`, `lib/site.ts`, `components/marketing/content.ts`, `docs/agents/PROJECT_QUALITY_BAR.md`. Claude agents: `eastbase-premium-ui` skill first.

**Scope boundaries:** `app/page.tsx`, `components/marketing/**`, `app/globals.css` (additive tokens/utilities only), `lib/site.ts` and SEO surfaces if positioning language changes. Do not touch app/dashboard surfaces, auth flows, or add dependencies. Keep marketing copy centralized in `components/marketing/content.ts`.

**Tasks:**

1. Map the chosen direction's sections onto the page; keep or deliberately migrate the anchor IDs (`#record`, `#method`, `#live`, `#evidence`, `#faq`) — update in-page nav if they change.
2. Build server-rendered sections showing real product mechanics; client islands only where interaction demands.
3. Type: Fraunces for marketing ceremony headlines, mono uppercase eyebrows, Geist for body; tabular numerals on any figures.
4. Motion: `[data-intro]` hero stagger + at most one signature moment; everything under the `prefers-reduced-motion` kill-switch; nothing loops.
5. Copy: exact, mechanism-first, claim-safe (no traction/pricing/certification claims). Sync `lib/site.ts`, OG image, JSON-LD, and `public/llms*.txt` if positioning language changed.
6. Update skeletons/error surfaces only if the landing gained streamed content.
7. Archive the directions doc to `docs/archive/design/` and update `docs/README.md` per house convention.

**Quality bar:** the landing section of `docs/agents/PROJECT_QUALITY_BAR.md` — the page reads like an audited record; anti-references absent; both themes; 380/768/1280px clean.

**Safety:** no production touches; no unsupported claims; no gradient backgrounds; no pushes.

**Checks:** `pnpm lint && pnpm typecheck`; browser verification at 380/768/1280px, both themes, keyboard-only focus pass, reduced-motion emulation; verify text via DOM queries (preview `innerText` under-reports streamed content — use `textContent`); scoped prettier.

**Git:** commit(s) as `feat: ship <direction name> landing redesign`. Do not push.

**Final report:** outcome first; section-by-section before/after; copy-parity confirmation (page ↔ site.ts ↔ OG ↔ llms); verification matrix results; archived docs; commit hashes; anything deferred.
