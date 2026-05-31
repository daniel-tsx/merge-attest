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

### Phase 2 — Typographic & spacing system ✅ shipped
- Added a `--text-display` theme size (size/leading/tracking/weight bundled) for
  page titles; `PageHeader` title now uses `text-display` instead of `text-[26px]`.
- Added a single `@utility text-eyebrow` (11px / 500 / uppercase / 0.08em) for the
  uppercase micro-label that previously varied (10/11/12px, 0.05/0.08/0.12em)
  across components. Applied in `PageHeader`, `MetricCard`, `Table` header, and
  the dashboard `StatPanel` + compliance tiles — so every page inherits the
  consistent label through shared components.
- **Tailwind v4 gotcha:** a plain `.text-eyebrow` author rule is dropped (name
  collides with the `text-` utility namespace). Must use `@utility`. See memory
  `tailwind-v4-custom-utility`.
- Existing spacing rhythm (`space-y-6/8`, card `p-5`) was already consistent — no
  changes needed.
- _Verified:_ dashboard title + all eyebrows render at the formalized size in the
  live app; typecheck + lint + 219 tests green. (PR-detail/sidebar labels still
  use their own treatment — candidate for the Phase 9 polish pass.)

### Phase 3 — Primitive depth & state polish + Tooltip/Toast ✅ shipped
- Added `components/ui/tooltip.tsx` (tokenized Radix tooltip, `surface-elevated`
  chip, dark-aware) + a single root `TooltipProvider` in the layout.
- Added `components/ui/sonner.tsx` (Sonner `Toaster`, theme-synced via
  `next-themes`, mapped to our tokens via Sonner CSS vars) mounted once in the
  layout. Visual toast usage lands in Phase 6 (wired to mutations).
- First real tooltip usage: the header theme toggle icon button.
- Button press polish: `active:translate-y-px` for tactile feedback.
- Card/MetricCard/Section/Table/Badge already pick up the Phase 1 elevation +
  dark tokens (verified on the live dashboard in both themes); deeper table
  interaction work (sort/density/sticky) stays in Phase 6.
- _Verified:_ real dashboard in dark + light; "Change theme" tooltip renders
  themed; toggle menu (Light/Dark/System) persists; Toaster mounted; no console
  errors; typecheck + lint + 219 tests green.
- _Dev note:_ self-registered `dev@agentgate.test` in the local dev DB (email
  delivery not configured, so no verification needed) to verify in-app surfaces.

### Phase 4 — Command palette (⌘K) ✅ shipped
- Added `components/ui/command.tsx`: tokenized `cmdk` wrapper (Command,
  CommandDialog via Radix Dialog, Input/List/Empty/Group/Item/Separator),
  dark-aware, with an `sr-only` dialog title.
- Added `components/app/command-palette.tsx`: global palette with route
  navigation (all sidebar routes) + theme actions; ⌘K / Ctrl+K toggle listener;
  a header "Search… ⌘K" affordance button. Mounted once in the app-shell header.
- _Verified:_ opens via button click and ⌘K; fuzzy filter narrows groups;
  selecting an action runs it and closes the palette; renders in light + dark;
  typecheck + lint + 220 tests green. (Quick actions like "jump to PR by number"
  can be layered on later.)

### Phase 5 — Dashboard as a command center ✅ shipped
- Added `buildSignalTrends` (`lib/reporting.ts`, unit-tested): per-signal 7-day
  daily series (bucketed by `updatedAt`) + trend direction, derived from the
  already-loaded PR list — no extra query.
- Hero metric cards now show a tone-colored inline-SVG `Sparkline` + 7-day trend
  arrow (`MetricTrend`) and a reduced-motion-safe count-up (`AnimatedNumber`).
  (No fabricated WoW % — the demo window is too short for honest week-over-week.)
- Charts recolor on theme toggle: `TrendChartInner` re-reads the token palette
  keyed on `resolvedTheme` (was captured once at mount).
- Skeletons realigned to the real layout (4 hero cards incl. sparkline height +
  2 stat panels + 2 charts + table) — no layout shift on load.
- Gotcha fixed: a function prop (`formatNumber`) can't cross the server→client
  boundary; `AnimatedNumber` formats internally instead.
- _Verified:_ live dashboard (seeded demo data) in dark + light; sparklines +
  count-up render; charts recolor on toggle without reload; new skeleton matches;
  typecheck + lint + 220 tests green.

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
