# AgentGate UI Revamp Plan

**Status:** `planned` (in progress — phases marked as they ship)
**Location:** `docs/strategy/UI_REVAMP_PLAN.md`
**Created:** 2026-05-31

## Goal

Elevate AgentGate from a polished operational UI to a premium, enterprise-grade
control center — without breaking the disciplined, flat, Linear-influenced
design DNA documented in [`../features/DESIGN_SYSTEM.md`](../features/DESIGN_SYSTEM.md).

## Direction decisions (confirmed with owner)

- **Visual direction:** add _tasteful depth & richness_ — a deliberate elevation
  scale and more intentional use of raised surfaces. No gradient backgrounds;
  glass stays restrained to chrome.
- **Dark mode:** full dark theme + toggle (system / light / dark), first-class
  and token-driven.
- **Scope of work:** visual polish **and** premium UX features (command palette,
  toast + tooltip, richer dashboard analytics, table interactions).
- **Surfaces:** everything — marketing, auth, and the full authenticated app.

## Guiding principles

- Evolve `app/globals.css` tokens; do **not** break the public APIs of
  `components/ui/*` primitives.
- Depth comes from an elevation scale + `surface-elevated`, not decoration.
- Premium features ship as small client islands; the server stays authoritative.
- Preserve accessibility and `prefers-reduced-motion` on every new surface.
- Verify latest package versions at implementation time (project rule).

## Phases

Each phase is independently shippable after Phase 1.

### Phase 0 — Baseline & guardrails
- Capture before-screenshots of every key surface (light).
- Confirm `pnpm lint / typecheck / test / build` green as the regression baseline.
- _Verify:_ baseline green; surfaces inventoried.

### Phase 1 — Theming foundation: dark mode + elevation scale ✅ shipped
- Added a tuned `.dark` token scale in `globals.css`; `@theme inline` indirection
  lets the `.dark` class re-theme every utility at runtime.
- Enriched the light + dark elevation scale (`--shadow-card`/`-hover`) for real
  depth instead of a flat 1px line.
- Added stable `--brand-surface` / `--scrim` tokens so inverting `--primary` to
  near-white (premium high-contrast buttons) does not turn the auth panel white
  or lighten the modal scrim. `primary` inverts; `brand-surface`/`scrim` stay deep.
- Registered `@custom-variant dark (&:where(.dark, .dark *))` so Tailwind's
  `dark:` variant follows the class, not OS `prefers-color-scheme`.
- Added `next-themes` provider (system / light / dark, FOUC-safe) +
  `components/app/theme-toggle.tsx` in the app header; `suppressHydrationWarning`
  on `<html>`.
- _Verified:_ landing (light unchanged, dark good), sign-in dark (brand panel +
  inverted button), mobile dark; computed tokens correct; no hydration errors;
  typecheck + lint + 219 tests green.
- _Not yet eyes-on:_ authenticated app surfaces (auth-gated, no login) — they
  inherit the token system so they re-theme, but should be visually checked once
  credentials are available (matters most before Phases 5–6).

### Phase 2 — Typographic & spacing system
- Formalize a type scale (display / title / heading / body / caption / mono);
  replace ad-hoc sizes in `PageHeader` and metrics. Codify spacing rhythm.
- _Verify:_ headings/metrics consistent; no one-off sizes; diff acceptable.

### Phase 3 — Primitive depth & state polish + Tooltip/Toast
- Refine `Card`, `MetricCard`, `Section`, `Table`, `Button`, `Badge`, inputs for
  the elevation scale + dark mode.
- Add tokenized, dark-aware **Tooltip** and **Toast** primitives + root providers.
- _Verify:_ primitives render in both themes; tooltip/toast accessible.

### Phase 4 — Command palette (⌘K)
- Global palette in the app shell: fuzzy route nav, quick actions, recents;
  ⌘K / Ctrl+K + header search affordance; focus-trapped, labeled.
- _Verify:_ opens via shortcut + click, keyboard-navigable, both themes, a11y.

### Phase 5 — Dashboard as a command center
- `MetricCard` deltas (WoW) + sparklines from already-loaded trend data (no new
  queries); reduced-motion-safe count-up; dark-aware charts.
- _Verify:_ deltas/sparklines correct, zero extra queries, charts themed in dark.

### Phase 6 — Table & list interactions
- Sort affordances bound to `nuqs` `sort`, density toggle, sticky first column,
  row keyboard nav; migrate mutation feedback to toasts (server authoritative).
- _Verify:_ sorting reflects URL, keyboard nav works, toasts fire, a11y intact.

### Phase 7 — Motion & route transitions
- Subtle micro-interactions; View Transitions for route changes; reduced-motion safe.
- _Verify:_ smooth, disabled under reduced-motion, no layout shift.

### Phase 8 — Marketing + auth elevation
- Apply elevation scale, dark mode, type scale to landing + split auth; polish
  existing border-beam/dot-grid hero moments.
- _Verify:_ both themes, responsive, motion safe.

### Phase 9 — QA, a11y, docs
- Full a11y + contrast pass in both themes; responsive at 375/768/1024/1440.
- Update `DESIGN_SYSTEM.md` + `SYSTEM_DESIGN.md`; mark this plan `shipped`.
- `lint/typecheck/test/build` green; tests for theme persistence + palette.

## Sequencing

Phase 1 first (gating). Then: **1 → 3 → 2 → 5 → 4 → 6 → 7 → 8 → 9**.

## New dependencies (verify latest at implementation time)

- Theming: `next-themes` or a minimal custom provider.
- `@radix-ui/react-tooltip`, `sonner` (or `@radix-ui/react-toast`), `cmdk`.
- Note: `@tanstack/react-query` is installed but unused — out of scope here.
