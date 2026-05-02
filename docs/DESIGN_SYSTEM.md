# AgentGate Design System Notes

Last reviewed: 2026-05-02

## Purpose

This document records the current UI foundation for AgentGate. The goal is a restrained, high-trust SaaS interface that feels precise, readable, and professional without adding decorative effects that do not support the workflow.

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

## Component Rules

- Prefer semantic token utilities such as `bg-surface`, `text-foreground`, `border-border`, `ring-focus-ring`, and `shadow-card`.
- Avoid new raw palette classes in shared UI primitives unless a token is missing and the token is added first.
- Keep public primitive APIs stable. Phase 1 updates only changed internal styling for `Badge`, `Button`, `Card`, `Input`, and `Table`.
- Use `rounded-control` for compact interactive elements and `rounded-card` for larger surfaces.
- Use visible `focus-visible` rings on interactive controls.
- Use disabled semantics and clear disabled styling for controls.
- Keep motion subtle, token-aligned, and covered by the global reduced-motion rule.

## Status Tones

Current badge tone mapping:

- `slate`: neutral metadata and inactive states.
- `green`: success, passing, approved, or no issue.
- `yellow`: warning or pending state.
- `orange`: elevated attention, high risk, or needs review.
- `red`: danger, critical risk, failure, or rejection.
- `blue`: informational state, demo/live mode, or setup guidance.

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

## Verification Checklist

Before merging UI changes:

- Keyboard focus is visible.
- Text and status colors remain readable.
- Controls have clear hover, active, disabled, and pending states.
- Components do not rely on hover-only interactions.
- Changed surfaces still render correctly at mobile and desktop widths.
