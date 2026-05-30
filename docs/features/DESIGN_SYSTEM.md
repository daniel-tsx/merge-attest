# AgentGate Design System Notes

**Status:** `current`
**Location:** `docs/features/DESIGN_SYSTEM.md`

Last reviewed: 2026-05-19

## Purpose

This document records the current UI foundation for AgentGate. The goal is a Linear-influenced operational interface: precise, compact, security-minded, and built for scanning pull request risk, approvals, policies, and audit evidence. Notion-style clarity is useful for docs and settings copy, but the product UI should feel closer to an engineering control room than a friendly workspace editor.

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

- Surfaces: `background`, `surface`, `surface-muted`, `surface-subtle`, `surface-hover`, and `surface-pressed`.
- Borders: `border` and `border-strong`.
- Text: `foreground`, `muted-foreground`, and `subtle-foreground`.
- Actions: `primary`, `primary-hover`, `primary-foreground`, `accent`, `accent-hover`, `accent-soft`, and `accent-foreground`.
- Status: `success`, `warning`, `attention`, `danger`, and `info`, each with soft and border variants where needed.
- Interaction: `focus` and `focus-ring`.
- Shape/elevation: `radius-control`, `radius-card`, `shadow-card`, and `shadow-card-hover`.

Current token strategy:

- Use cool near-white surfaces rather than warm cream.
- Use near-black product chrome for primary actions and shell identity.
- Use indigo only for selected states, focus, and high-priority accent actions.
- Keep semantic status colors clear but muted enough for dense tables.
- Keep shadows extremely shallow; borders carry most structure.
- Use `rounded-control` for 6px control radius and `rounded-card` for 8px cards.

## Component Rules

- Prefer semantic token utilities such as `bg-surface`, `text-foreground`, `border-border`, `ring-focus-ring`, and `shadow-card`.
- Avoid new raw palette classes in shared UI primitives unless a token is missing and the token is added first.
- Keep public primitive APIs stable. Phase 1 updates only changed internal styling for `Badge`, `Button`, `Card`, `Input`, and `Table`.
- Use `rounded-control` for compact interactive elements and `rounded-card` for larger surfaces.
- Use visible `focus-visible` rings on interactive controls.
- Use disabled semantics and clear disabled styling for controls.
- Keep motion subtle, token-aligned, and covered by the global reduced-motion rule.
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

## Future Primitive Guidance

When adding local wrappers for Select, Tabs, Dialog, Dropdown Menu, Toast, or Tooltip:

- Build on the same token names from `app/globals.css`.
- Preserve Radix accessibility semantics where Radix is used.
- Use `focus-visible:ring-2 focus-visible:ring-focus-ring`.
- Use `bg-surface`, `border-border`, `text-foreground`, and `text-muted-foreground` before direct palette classes.
- Ensure icon-only triggers have accessible labels.

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
