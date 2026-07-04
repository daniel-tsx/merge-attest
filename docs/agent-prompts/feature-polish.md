# Prompt: Feature / Dashboard Polish

Copy/paste to polish an app surface or user flow to the house standard. Sonnet-tier with the docs below; Fable/Opus-tier if the surface needs rethinking rather than polishing.

---

You are working in the MergeAttest repository — a GitHub-native control center governing AI-assisted pull requests. The app UI is an engineering control room: instrument-cluster density, blueprint OKLCH neutrals, hairline borders, Geist Mono `tabular-nums`, semantic status tones, no gradients.

**Target surface(s):** <name the route(s)/flow(s), e.g. `/reports`, the approvals flow, onboarding checklist>

**Goal:** bring the target surface to `PROJECT_QUALITY_BAR.md` standard — visual signature, states, responsiveness, accessibility — without changing its behavior or data contracts.

**Required reading:** `docs/SYSTEM_DESIGN.md` (UI layer model), `docs/features/DESIGN_SYSTEM.md`, `app/globals.css`, `DESIGN.md`, `docs/agents/PROJECT_QUALITY_BAR.md`. Claude agents: the `eastbase-premium-ui` skill is **required** before writing any UI.

**Scope boundaries:** the named surfaces and their shared components only; no schema/API changes; no new dependencies; no auth/billing behavior changes; behavior-preserving unless a defect is found (report those). Design tokens over custom colors — if a token is missing, add it to `globals.css` rather than hardcoding.

**Tasks:**

1. Audit the surface against the quality bar: signature (tokens, type, density), empty state, `loading.tsx` skeleton parity, error state, responsive (380/768/1280px), both themes, focus rings, reduced motion, `aria-hidden` on decorative icons.
2. Fix in place: match existing component patterns in `components/app/**` and primitives in `components/ui/**`; keep server components server-side, client islands minimal.
3. Empty states are designed surfaces: what the surface will show + the concrete next action, in product voice.
4. If the layout changed, update the matching skeleton **in the same change**.
5. Microcopy: operational and exact; numbers in mono `tabular-nums`.
6. Verify data stays org-scoped through `lib/data/app-data.ts` — polishing never introduces a new data path.

**Quality bar:** app/dashboard + states + accessibility + performance sections of `docs/agents/PROJECT_QUALITY_BAR.md`.

**Safety:** no production touches; no client-side-only access checks; no pushes.

**Checks:** `pnpm lint && pnpm typecheck`; relevant `pnpm exec vitest run tests/<area>.test.ts`; browser verification (both themes, three widths, keyboard pass, demo mode for populated states); scoped prettier.

**Git:** commit as `polish: <surface> to quality bar`. Do not push.

**Final report:** outcome first; per-surface before/after notes; states covered (empty/loading/error); verification matrix results; defects found but not fixed; commit hash.
