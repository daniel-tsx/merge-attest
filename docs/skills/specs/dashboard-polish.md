# Skill Spec: mergeattest-dashboard-polish

**Status:** `current` spec (2026-07-04) — not yet converted to a skill.

**Purpose:** bring a named MergeAttest app surface or flow to the project quality bar — the control-room signature, complete states, responsiveness, accessibility — without changing behavior or data contracts.

**When to use:** a surface looks generic/unfinished; empty/loading/error states are missing or mismatched; after a feature lands functionally-complete but visually rough; periodic polish sweeps.

**When not to use:** new features or behavior changes; landing/marketing pages (landing skill); performance investigation (separate task); when the surface needs _rethinking_ — flag that instead of polishing a wrong design.

**Required inputs:** target route(s)/flow(s) (required); known complaints if any.

**Required project docs:** `docs/agent-prompts/feature-polish.md` (the full brief), `docs/SYSTEM_DESIGN.md` (UI layer model), `docs/features/DESIGN_SYSTEM.md`, `app/globals.css`, `docs/agents/PROJECT_QUALITY_BAR.md`. The `eastbase-premium-ui` skill is **required** before writing any UI — this spec is its MergeAttest application.

**Workflow:**

1. Audit the surface against the quality bar: tokens/type/density signature, empty state, skeleton parity, error state, 380/768/1280px, both themes, focus rings, reduced motion, `aria-hidden` decorative icons.
2. Fix in place matching `components/app/**` patterns and `components/ui/**` primitives; server components stay server-side.
3. Empty states designed (what + next action, product voice); skeletons updated **with** layout changes; microcopy operational; numbers mono `tabular-nums`.
4. Confirm no new data paths — reads stay org-scoped through `lib/data/app-data.ts`.
5. Verify in browser (demo mode for populated states, fresh org for empty ones).

**Expected outputs:** polished surface passing the bar; verification matrix; defects found-not-fixed reported.

**Files likely created/updated:** page components, `loading.tsx`, `components/app/*`, `app/globals.css` (additive tokens only).

**Checks to run:** `pnpm lint && pnpm typecheck`; relevant `pnpm exec vitest run tests/<area>.test.ts`; browser matrix; scoped prettier.

**Safety boundaries:** behavior-preserving; no schema/API/dependency changes; no client-side-only access checks; no raw palette classes — add tokens instead; no pushes.

**Final report format:** per-surface before/after; states covered; verification matrix; defects deferred; commit hash.

**Example invocation prompt:** "Polish the MergeAttest `/reports` page and its empty states to the quality bar — the scorecard section looks stock-shadcn."
