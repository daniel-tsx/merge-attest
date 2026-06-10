# MergeAttest UI Revamp Plan

**Status:** `shipped` — phases 1–9 delivered on the `ui-revamp` branch; Phase 6b
(table scan interactions) and React `<ViewTransition>` deferred (see notes).
**Location:** `docs/strategy/UI_REVAMP_PLAN.md`
**Created:** 2026-05-31

## Goal

Elevate MergeAttest from a polished operational UI to a premium, enterprise-grade
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
- _Dev note:_ self-registered `dev@mergeattest.test` in the local dev DB (email
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

### Phase 6 — Mutation feedback via toasts ✅ shipped (table interactions → 6b)

- Added `components/app/mutation-toasts.tsx`: reads the `assignment` / `comment`
  result params on PR detail, fires themed Sonner toasts, and strips the params
  via `router.replace` so they don't re-fire on refresh/back. Replaced the inline
  feedback banners (and removed the now-dead `feedbackToneStyles` + param parsing).
- `ApprovalActions` now also fires a success/error toast on each decision result
  (keeps the persistent inline status line for a11y/record).
- _Verified:_ toast fires from `?assignment=assigned` and the param is cleared
  from the URL; PR detail renders correctly in dark; typecheck + lint + 220 tests.

### Phase 6b — Table scan interactions (deferred)

- Sortable headers bound to a new `nuqs` sort/dir param (in-memory sort after the
  single fetch), sticky first column, and keyboard row navigation on the scan
  tables. Split out of Phase 6: it adds new URL-state params and carries more
  list-query regression risk, so it's better as its own focused change. Keep
  server-side filtering authoritative and URL keys export-route-compatible.

### Phase 7 — Motion & route transitions ✅ shipped (View Transitions deferred)

- Added a reduced-motion-safe `route-enter` animation (subtle fade + 6px rise),
  applied to a `key={pathname}` content wrapper in the app shell so page content
  arrives gracefully on each route change. Uses `backwards` fill (not `both`) so
  **no transform is retained** after the animation — keeps the sticky table
  headers / detail sidebar working.
- Button press (Phase 3) + table-row/card hover states already cover the
  micro-interaction layer.
- React `<ViewTransition>` (Next `experimental.viewTransition`) is deferred: the
  component isn't in the stable React export (only Next's experimental channel),
  with uncertain typing and no easy visual verification — not worth the build
  risk now. The `route-enter` fade delivers the premium arrival feel meanwhile.
- _Verified:_ navigation animates content in; wrapper `transform` is `none` after
  the animation (sticky-safe); no console errors; typecheck + lint + 220 tests.

### Phase 8 — Marketing + auth elevation ✅ shipped (focused)

- Added the theme toggle to the public surfaces: the landing header nav and a
  top-right control on the auth shell, so visitors aren't stuck on system pref.
- The marketing landing + auth already re-theme via the token system (verified
  back in Phase 1). The landing deliberately uses a **monospace** eyebrow
  aesthetic distinct from the app's `text-eyebrow`, so it was intentionally NOT
  folded into the app type scale. The auth panel uses the stable `brand-surface`
  (stays deep ink in both themes; the form column + primary button adapt).
- _Verified:_ auth page renders in dark + light via the new public toggle (brand
  panel stays ink, form/button adapt); toggle tooltip works; typecheck + lint.
- Deeper hero/visual rework left as optional polish — the existing
  border-beam / scan-panel hero already reads well in both themes.

### Phase 9 — QA, a11y, docs ✅ shipped

- Updated `features/DESIGN_SYSTEM.md` (theming, dark scale, `brand-surface`/`scrim`,
  elevation, `text-display`/`text-eyebrow` + the Tailwind v4 `@utility` note,
  Tooltip/Toast/Command primitives, re-scoped deferred list) and `SYSTEM_DESIGN.md`
  (layout providers + primitive table + theming note).
- Spot-checked responsiveness (dashboard at mobile; landing/auth at mobile/desktop)
  and both themes across dashboard, PR list, PR detail, auth; reduced-motion is
  honored by `route-enter`, count-up, and charts.
- `pnpm lint` + `pnpm typecheck` + `pnpm test` (220) green throughout. `next build`
  compiles + passes TypeScript; a full production build additionally requires the
  GitHub App env vars (pre-existing fail-closed env validation, not a revamp change).

### Phase 6b — Table scan interactions ✅ shipped (pull request monitor)

- Added `sort` + `dir` to `app/pull-requests/search-params.ts` and a tested pure
  `sortPullRequests` helper (`app/pull-requests/sort.ts`, in-memory after the
  single fetch — no data-layer change). Comparators rank risk/test/CI/approval so
  a descending sort surfaces the rows that need attention first.
- `components/app/sortable-header.tsx` — client header button bound to the `nuqs`
  sort/dir state (`shallow: false`), with an active direction chevron; default
  `updated`/`desc` clears from the URL.
- Sticky first column (PR title) with `group-hover` background coordination, and a
  bumped header z-index so the sticky corner sits above both axes.
- Keyboard nav: rows are reachable via the focusable PR-title and Review links with
  visible focus rings; explicit arrow-key roving left as an optional later add.
- _Verified:_ clicking a header sorts + toggles direction (URL `?sort=risk` /
  `&dir=asc`), the sticky column pins while scrolling at tablet width, and the
  parser/serializer/sort tests pass (225 total).

## Deferred follow-ups

- Apply the same sort/sticky pattern to the other scan tables (repositories,
  activity, approvals, audit log) if desired.
- **React `<ViewTransition>`** — once it stabilizes outside Next's experimental channel.
- Verify the few app-only flows that are entitlement-gated
  (approval-decision toast) with a non-free org when paid plans return.

## Sequencing

Phase 1 first (gating). Then: **1 → 3 → 2 → 5 → 4 → 6 → 7 → 8 → 9**.

## New dependencies (verify latest at implementation time)

- Theming: `next-themes` or a minimal custom provider.
- `@radix-ui/react-tooltip`, `sonner` (or `@radix-ui/react-toast`), `cmdk`.
- Note: `@tanstack/react-query` was removed (2026-06-10, unused) — out of scope here.
