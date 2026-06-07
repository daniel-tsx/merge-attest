# MergeAttest Design System Notes

**Status:** `current`
**Location:** `docs/features/DESIGN_SYSTEM.md`

Last reviewed: 2026-05-31

## Purpose

This document records the current UI foundation for MergeAttest. The goal is a Linear-influenced operational interface: precise, compact, security-minded, and built for scanning pull request risk, approvals, policies, and audit evidence. Notion-style clarity is useful for docs and settings copy, but the product UI should feel closer to an engineering control room than a friendly workspace editor.

For architecture, page composition, and the three-layer component model, read [`../SYSTEM_DESIGN.md`](../SYSTEM_DESIGN.md) first.

## Direction

- Primary reference: Linear-style product UI, with restrained color, crisp borders, compact controls, and sparse elevation.
- Secondary reference: Notion-style readability for educational copy, empty states, and long-form settings sections.
- Product tone: operational, exact, and governance-oriented.
- Avoid generic AI-product cues: decorative pills, colorful agent badges, purple gradients, oversized abstract cards, and labels that merely say "AI".
- Make deterministic controls feel primary. Advisory AI review is a supporting layer, not the visual center of the product.

## Token Source

The source of truth for runtime UI tokens is `app/globals.css`.

Token groups:

- Surfaces: `background`, `surface`, `surface-elevated`, `surface-muted`, `surface-subtle`, `surface-hover`, and `surface-pressed`.
- Borders: `border`, `border-strong`, `border-subtle`, and `divider`.
- Text: `foreground`, `muted-foreground`, and `subtle-foreground`.
- Actions: `primary`, `primary-hover`, `primary-foreground`, `accent`, `accent-hover`, `accent-soft`, and `accent-foreground`.
- Brand chrome: `brand-surface` / `brand-surface-foreground` (fixed deep-ink decorative panels) and `scrim` (modal/overlay dimmer) — these stay dark in **both** themes.
- Status: `success`, `warning`, `attention`, `danger`, and `info`, each with soft and border variants where needed.
- Interaction: `focus` and `focus-ring`.
- Shape/elevation: `radius-control`, `radius-card`, `shadow-card`, `shadow-card-hover`, and `shadow-overlay`.

Current token strategy:

- Use cool near-white surfaces rather than warm cream.
- Use near-black product chrome for primary actions and shell identity — `primary`
  **inverts to near-white in dark mode** for high-contrast buttons, so decorative
  dark panels (auth aside) and the modal scrim use `brand-surface` / `scrim`, not `primary`.
- Use indigo only for selected states, focus, and high-priority accent actions.
- Keep semantic status colors clear but muted enough for dense tables; in dark mode
  the `*-soft` fills go dark-tinted and the base/text tones brighten for contrast.
- Elevation is restrained but real (cards lift with a soft shadow; in dark, depth
  also comes from the surface lightness ramp). Borders still carry most structure.
- Use `rounded-control` for 6px control radius and `rounded-card` for 8px cards.

## Theming (light + dark)

- Light tokens live in `:root`; a tuned `.dark` scale overrides the same runtime
  variables. The `@theme inline` block maps `--color-* → var(--*)`, so toggling the
  `.dark` class re-themes every utility at runtime — **no per-component dark classes**.
- `@custom-variant dark (&:where(.dark, .dark *))` makes Tailwind's `dark:` variant
  follow the `.dark` class (set by `next-themes`), not OS `prefers-color-scheme`.
- Theme provider: `components/app/theme-provider.tsx` (`next-themes`, system / light /
  dark, FOUC-safe) wraps the app in `app/layout.tsx`; `<html suppressHydrationWarning>`.
- Theme toggle: `components/app/theme-toggle.tsx` (System/Light/Dark dropdown). Mounted
  in the app header **and** the public landing nav + auth shell.

## Typography utilities

- `text-display` (theme size) — page titles via `PageHeader` (size/leading/tracking/weight bundled).
- `text-eyebrow` (`@utility`) — the uppercase micro-label (11px / 500 / 0.08em) used by
  `PageHeader`, `MetricCard`, `Table` headers, and dashboard stat/compliance tiles.
- **Tailwind v4 note:** a plain `.text-*` author rule is dropped (name collides with the
  `text-` utility namespace); reusable text utilities must be declared with `@utility`.

## Component Rules

- Prefer semantic token utilities such as `bg-surface`, `text-foreground`, `border-border`, `ring-focus-ring`, and `shadow-card`.
- Avoid new raw palette classes in shared UI primitives unless a token is missing and the token is added first.
- Keep public primitive APIs stable. Phase 1 updates only changed internal styling for `Badge`, `Button`, `Card`, `Input`, and `Table`.
- Use `rounded-control` for compact interactive elements and `rounded-card` for larger surfaces.
- Use visible `focus-visible` rings on interactive controls.
- Use disabled semantics and clear disabled styling for controls.
- Keep motion subtle, token-aligned, and covered by the global reduced-motion rule.
- Scrollbars are themed project-wide in `app/globals.css`: the `tailwind-scrollbar` plugin styles the viewport scrollbar via utilities on `<html>`, and a `*` rule sets `scrollbar-width: thin` + `scrollbar-color: var(--border-strong) transparent` so inner scroll containers match too (scrollbar utilities neither inherit nor compose via `@apply`).
- Prefer flat bordered containers over shadow-heavy cards.
- Avoid colored side stripes on cards, metrics, alerts, and list items. Use a dot, icon, badge, or full border state instead.
- Use cards only for repeated items, framed tools, modals, and data panels. Do not turn every page section into a floating card.

## Status Tones

Current badge tone mapping:

- `slate`: neutral metadata and inactive states.
- `green`: success, passing, approved, or no issue.
- `yellow`: warning or pending state.
- `orange`: elevated attention, high risk, or needs review.
- `red`: danger, critical risk, failure, or rejection.
- `blue`: informational state, demo/live mode, or setup guidance.

Badges are metadata, not decoration. Keep them small, text-first, and close to the content they qualify.

## Primitive Library

The primitive set is shadcn-style (Radix UI behavior + `class-variance-authority`) but wired to the tokens above, not shadcn's default palette. `components.json` makes the shadcn CLI usable; re-tokenize anything `npx shadcn add` generates (notably `accent`, which is brand indigo here, and `surface-*` / `danger` / `focus-ring` in place of `card` / `popover` / `destructive` / `ring`).

**Shipped** (`components/ui/`): `Button`, `Badge`/`StatusDot`, `Card`, `Input`, `Textarea`, `Select` (native), `DatePicker` (`date-picker.tsx` — `Popover` + `react-day-picker` `Calendar`, hidden input submits `YYYY-MM-DD` for `FormData` forms), `Table`, `Skeleton`, `Sheet`, `Popover` (Radix), `Calendar` (react-day-picker, re-tokenized), `DropdownMenu`, `Tabs`, `Switch`, `Separator`, `Avatar`, `Progress`, `Label`, `Tooltip` (Radix), `Toast` (Sonner — `sonner.tsx`, theme-synced), and `Command` (cmdk — `command.tsx`, used by the ⌘K palette).

See [`../SYSTEM_DESIGN.md`](../SYSTEM_DESIGN.md) for the full primitive table and per-component usage.

**Deferred on purpose:**

- A richer **Radix Select** — current selects live in uncontrolled `FormData` forms where the native `<select>` (`Select`) is the correct, lowest-risk control. Radix Select's empty-string-value restriction and form-bubble indirection would add regression risk to team-role and AI-settings mutations for no user-facing gain. Keep `Select` native until a genuinely controlled, rich-content select is needed. The native popup is instead progressively enhanced (Chromium) via the **customizable select** (`appearance: base-select` + `::picker(select)`) so the open dropdown matches the design system — light `border`, rounded popup, `accent-soft` selected option. That CSS lives in a raw `<style>` in `app/layout.tsx`, **not** `globals.css`, because Tailwind v4's Lightning CSS strips the experimental `::picker`/`base-select` syntax — do not move it.
- **React `<ViewTransition>`** (Next `experimental.viewTransition`) — the component isn't in the stable React export (only Next's experimental channel) with uncertain typing; the reduced-motion-safe `route-enter` fade covers route arrival meanwhile. See `docs/strategy/UI_REVAMP_PLAN.md` Phase 7.
- **Table scan interactions** — shipped on the pull request monitor (sortable headers via `SortableHeader` + a `nuqs` sort/dir param, in-memory `sortPullRequests`, sticky first column). Rolling the same pattern out to the other scan tables (repositories, activity, approvals, audit log) is a follow-up; see `docs/strategy/UI_REVAMP_PLAN.md`.

When adding any new wrapper:

- Build on the same token names from `app/globals.css`.
- Preserve Radix accessibility semantics where Radix is used.
- Use `focus-visible:ring-2 focus-visible:ring-focus-ring`.
- Prefer `bg-surface`, `border-border`, `text-foreground`, and `text-muted-foreground` over direct palette classes.
- Ensure icon-only triggers have accessible labels, and prefer the primitive over inline Radix in pages.

## Shell And Navigation

The app shell lives in `components/app/app-shell.tsx`.

- Primary navigation is grouped by product task: overview, review work, and workspace.
- Active route state is derived from the current pathname and should set `aria-current="page"`.
- Desktop navigation is persistent at large breakpoints.
- Mobile navigation uses a Radix Dialog drawer with a visible close control and labelled trigger.
- The shell includes a skip-to-content link and focuses the main region after route changes.
- Header, sidebar, and drawer controls should keep a minimum 44px interaction target.
- Navigation copy should describe the task outcome, not just the destination name.
- Active navigation uses a selected row treatment and dark icon well, not a side stripe.
- Persistent shell copy should avoid generic "AI" labels. Prefer concrete language such as "Pull request control", "Review work", or "Policy coverage".

## URL State

List filters use `nuqs` so shareable list state is parsed consistently in Server Components and updated from Client Components.

- Route-level parser modules live beside the page as `search-params.ts`.
- Pages must call the route `createSearchParamsCache(...).parse(searchParams)` before using query values.
- Client filter controls should import the same parser map and update values with `useQueryStates`.
- Use `shallow: false` for filters that affect server-rendered data.
- Defaults should clear from the URL so reset states remain clean.
- Keep existing URL keys stable unless the API/export route is migrated at the same time.
- Audit-log filter keys must remain aligned with `/api/audit-log/export`.

## Core Page Patterns

Phase 4 standardizes page-level UX around a few shared patterns:

- Use `components/app/empty-state.tsx` for table, timeline, chart, and queue empty states.
- Use `ResultSummary` near filter toolbars so users can understand the current filtered result set before scanning data.
- URL filter forms show active filter chips and a clear-all affordance derived from the current `nuqs` values.
- List tables should use sticky token-backed headers where the page is primarily a scan-and-review workflow.
- Detail pages should use semantic feedback colors for success, info, and danger states rather than generic cards.
- PR references should link to pull request detail pages whenever the data already includes a local pull request ID.

## React And Streaming Patterns

Phase 5 keeps the app Server Component first while using React 19 hooks in small client islands:

- Use `useActionState` for client mutation islands that need serializable success/error state.
- Use `useOptimistic` only where rollback is clear and the server remains the source of truth after `router.refresh()`.
- Use `useFormStatus` in nested submit controls when a form uses a React action.
- Use `useTransition` for non-urgent refreshes after successful client mutations.
- Prefer route `loading.tsx` files for high-traffic pages that benefit from an instant skeleton while page data streams.
- Parallelize independent `params`, `searchParams`, organization lookup, and data reads with `Promise.all` when there is no authorization or data dependency between them.

## Performance Patterns

Phase 6 adds a few code-level performance rules:

- Request-scoped organization context should come through the cached `getCurrentOrganization()` helper so layout/page reads do not repeat session and membership work in the same render.
- Avoid duplicate full-list data reads when filters are applied in memory. Fetch once, then derive filtered views locally until DB-level filtering or pagination is introduced.
- Dashboard trend data should be derived from the already-loaded pull request list instead of issuing a second equivalent pull request query.
- Loading skeletons should reserve roughly the same structure as the final page; dashboard loading uses eight metric placeholders to match the dashboard grid.
- Keep Recharts isolated behind the dynamic chart client island unless a future profiling pass proves a different chart strategy is needed.
- `@tanstack/react-query` remains unused; remove it only after confirming no near-term client data-fetching provider is planned.

## Accessibility And Quality Patterns

Phase 7 makes the polish checks repeatable:

- Every form control needs a visible label. Use `aria-label` only for compact controls where a visible label would duplicate an adjacent heading.
- Filter forms should expose pending state with `aria-busy` and a polite live region so server-rendered filter updates are announced.
- Mutation feedback should use `role="status"` or `aria-live="polite"` with concise success/error copy.
- Decorative Lucide icons inside labeled buttons, badges, cards, and navigation should set `aria-hidden="true"`.
- Data tables should include a contextual `<caption className="sr-only">` when a visible card title already labels the table.
- Route search-param modules should export serializers alongside parser caches when the same filters are used by forms, tests, or export routes.
- URL-state tests should cover defaults, invalid enum fallbacks, and multi-filter serialization so bookmarkable filters do not regress silently.

## Verification Checklist

Before merging UI changes:

- Keyboard focus is visible.
- Text and status colors remain readable.
- Controls have clear hover, active, disabled, and pending states.
- Components do not rely on hover-only interactions.
- Form controls have visible labels or a deliberate accessible name.
- Tables have visible headings plus screen-reader captions when needed.
- Async success, error, and filter-pending states are announced politely.
- URL parser and serializer tests cover changed filter modules.
- Changed surfaces still render correctly at mobile and desktop widths.
