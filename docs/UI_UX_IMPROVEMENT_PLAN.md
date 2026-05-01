# AgentGate UI/UX Improvement Plan

Last reviewed: 2026-05-02

## 1. Goal

Modernize AgentGate into a polished, professional SaaS control center for AI-assisted pull request governance. The work should improve visual quality, usability, accessibility, responsiveness, perceived speed, and code maintainability without changing the product scope before the core workflows are ready.

This is a planning document only. Implementation should happen in later focused changes.

## 2. Assumptions

- AgentGate should keep its current product direction: GitHub-native risk review, approvals, auditability, billing, and workspace setup.
- The current stack remains Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, and local shadcn-style UI primitives.
- UI modernization should build on the existing `components/ui` primitives instead of replacing the component system wholesale.
- URL search params should become the source of truth for shareable list state, using `nuqs`.
- The design should feel professional and modern, but should avoid decorative gradients unless a specific future design direction requires them.
- The implementation should prefer project design tokens and semantic color roles over one-off raw color classes.

## 3. Current Baseline

Implemented strengths:

- App Router routes are already split into clear surfaces: dashboard, repositories, pull requests, activity, approvals, audit log, and settings.
- Most app pages are async Server Components reading organization-scoped data through `lib/data/app-data.ts`.
- The app already has local UI primitives for buttons, cards, tables, inputs, badges, and shell layout.
- Dashboard charts are isolated behind a client-only dynamic import, limiting Recharts impact on server rendering.
- Some pages already accept async `searchParams` and perform server-side filtering, especially `app/pull-requests/page.tsx`.

Main UI/UX gaps:

- The visual system is functional but sparse: limited semantic tokens, limited elevation scale, limited spacing/type rules, and many direct `slate-*` classes in pages.
- The desktop sidebar is useful, but the mobile shell is not yet a full navigation experience.
- Filter controls are inconsistent and mostly native form controls, with limited pending, reset, empty, and saved-state feedback.
- Tables carry most of the product experience, but large-screen density, mobile readability, sticky context, sorting, pagination, and empty states need a unified approach.
- Approval and sync workflows rely on refresh patterns instead of richer optimistic or pending-state feedback.
- Accessibility needs a deliberate pass for focus states, labels, keyboard navigation, table semantics, color contrast, and reduced motion.

## 4. Design Direction

Use a restrained, high-trust SaaS interface:

- Visual tone: calm, precise, security-oriented, developer-friendly.
- Layout: clean dashboard surfaces, strong information hierarchy, clear action areas, and dense data tables that still breathe.
- Color: semantic neutrals with purposeful status colors for risk, approval, CI, test gaps, billing, and live/demo mode.
- Typography: keep the current Geist setup unless a brand refresh later chooses a new type system; formalize type scale and text roles first.
- Motion: subtle and functional only, with 150-300ms transitions, transform/opacity animations, and `prefers-reduced-motion` support.
- Icons: continue using Lucide, with consistent sizes, stroke weight, and labels for icon-only actions.

## 5. Target UX Principles

- Make risk explainable at a glance: every score, badge, and warning should link to clear reasons and next actions.
- Make list state shareable: filters, sorting, tabs, pagination, and selected views should survive refresh and be represented in the URL.
- Reduce decision latency: prioritize review queues, high-risk PRs, pending approvals, failed checks, and test gaps.
- Keep GitHub context close: repository, PR number, author, branch, CI, approval, and latest sync state should remain visible where users act.
- Prefer progressive disclosure: show summaries first, then details, timelines, rule hits, and raw audit data when users need them.
- Preserve trust: empty, loading, error, over-limit, demo, and live-data states should be explicit and actionable.

## 6. Proposed Implementation Phases

### Phase 1: Design System Foundation

Goal:

Create a small but consistent UI foundation before changing page layouts.

Deliverables:

- Expand `app/globals.css` with semantic Tailwind v4 theme tokens for surfaces, borders, text, muted text, focus, danger, warning, success, info, and accent.
- Define spacing, radius, shadow/elevation, focus-ring, and z-index conventions.
- Update primitives in `components/ui` to consume those tokens first: `Button`, `Card`, `Input`, `Table`, `Badge`, `Select`, `Tabs`, `Dialog`, and `DropdownMenu`.
- Standardize component states: hover, focus-visible, active, selected, disabled, loading, destructive, and pending.
- Add a lightweight design reference section to docs once tokens are implemented.

Verification:

- No new page-level raw color decisions unless a token does not exist yet.
- Focus rings are visible across keyboard navigation.
- Text and status colors meet WCAG contrast expectations in normal UI states.
- Existing pages retain their behavior while adopting improved primitives.

### Phase 2: Shell, Navigation, And Responsive Layout

Goal:

Make the app feel complete on desktop and mobile.

Deliverables:

- Redesign `components/app/app-shell.tsx` with active route state, clearer workspace/plan/data mode display, and stronger navigation grouping.
- Add a real mobile navigation pattern: sheet menu, bottom/top app bar, or compact drawer, with accessible labels and keyboard support.
- Add skip-to-content support and route-change focus behavior where practical.
- Introduce consistent page layout wrappers for list pages, detail pages, settings pages, and dashboard pages.
- Ensure fixed/sticky areas reserve space and do not hide scroll content.

Verification:

- All key routes are reachable and understandable at 375px, 768px, 1024px, and 1440px widths.
- Navigation has a visible active state and predictable back behavior.
- Header/sidebar/mobile nav controls meet at least 44px interaction target guidance.

### Phase 3: URL State With `nuqs`

Goal:

Make filtering, sorting, pagination, tabs, and selected views type-safe, bookmarkable, and consistent.

Deliverables:

- Add `nuqs` in a later implementation pass, using `pnpm add nuqs@latest` unless a compatibility issue is found.
- Create shared parser modules per route group, for example `app/pull-requests/search-params.ts`, `app/repositories/search-params.ts`, and `app/audit-log/search-params.ts`.
- Use `createSearchParamsCache` from `nuqs/server` for Server Component parsing and nested server access.
- Use shared parser declarations with `useQueryStates` in client filter components.
- Use `shallow: false` for query updates that must re-render Server Components.
- Use `useTransition` for filter pending states so URL updates and server refreshes do not freeze input feedback.
- Choose short, stable URL keys where helpful, such as `q`, `risk`, `agent`, `approval`, `repo`, `ci`, `tests`, `sort`, `page`, and `from`/`to`.

Priority routes:

- `/pull-requests`: query, risk, agent, approval, CI, test gap, repository, sort, page.
- `/repositories`: query, status, installation state, risk profile, sort, page.
- `/activity`: query, repository, actor, agent, risk, event type, date range, page.
- `/approvals`: assignee, status, risk, repository, SLA/age, sort, page.
- `/audit-log`: event type, actor, repository, PR, severity, date range, query, page.
- `/settings/usage`: period, metric, plan state.

Verification:

- Refreshing the page preserves all list state.
- Copying a URL reproduces the same filtered view for another signed-in user with access.
- Clearing filters returns to clean default URLs.
- Server-side filtering remains the source of truth for data security and pagination.

### Phase 4: Core Page UX Modernization

Goal:

Upgrade the main user journeys without adding unrelated product features.

Dashboard:

- Rework metric cards into a clearer hierarchy: risk pressure, pending approvals, failed CI, test gaps, recent sync, and usage.
- Add better chart empty/loading states and concise summaries above charts.
- Consider lazy rendering below-the-fold reporting sections with Suspense boundaries.

Pull Request Monitor:

- Replace the raw filter form with a reusable filter toolbar using `nuqs`.
- Add active filter chips, reset filters, sort controls, pagination, and pending indicators.
- Improve table scanning with sticky headers on wide lists, compact risk summaries, and row-level primary action affordances.

Pull Request Detail:

- Prioritize the decision workflow: risk summary, required approvals, test gaps, rule hits, GitHub context, and audit timeline.
- Use React 19 pending and optimistic patterns for approval actions where server behavior allows.
- Add clearer success/error recovery messaging after actions.

Repositories And Rules:

- Clarify repository connection/sync state and next action.
- Improve rule cards/tables with scope, severity, status, last triggered, and preview affordances.
- Prepare future CRUD flows with consistent form and dialog patterns.

Activity, Approvals, Audit:

- Convert each into a focused work queue with URL state, meaningful empty states, and clear grouping.
- Make audit filters powerful but not overwhelming: progressive disclosure for advanced filters.

Settings:

- Use a consistent settings layout with left/right or sectioned navigation.
- Make billing, usage, GitHub, and team setup states explicit and action-oriented.

Verification:

- A new user can identify the next setup action within 5 seconds on dashboard/settings.
- A reviewer can find high-risk pending PRs without scanning every row.
- All list pages have consistent filter, empty, loading, and reset behavior.

### Phase 5: React 19 And Next 16 Modernization

Goal:

Use current React and Next features where they improve UX or performance, not as blanket rewrites.

React 19 candidates:

- Use `useActionState` for form mutations that need pending/error state.
- Use `useOptimistic` for approval decisions, assignment changes, rule toggles, and lightweight local feedback where rollback is clear.
- Use `useTransition` for URL-state changes, non-urgent filter updates, and client interactions that trigger server re-renders.
- Use `useFormStatus` in nested submit buttons for shared form pending UI.

Next 16 candidates:

- Keep async `searchParams` handling aligned with Next 16 semantics.
- Place Suspense boundaries around request-time content where it improves partial rendering.
- Do not read runtime request data such as `searchParams`, cookies, or headers inside `"use cache"` scopes.
- For cached server computations, read runtime values outside the cached function and pass plain values as arguments.
- Use `after()` only for non-blocking post-response work where user-facing response latency should not wait.
- Use `connection()` only when a view truly needs per-request non-deterministic values.

Verification:

- No conversion from Server Components to Client Components unless interactivity requires it.
- Mutations have accessible pending and error states.
- Cache boundaries do not hide organization-specific or permission-specific data.

### Phase 6: Performance And Code Optimization

Goal:

Improve real and perceived performance while keeping the RSC-first architecture.

Deliverables:

- Add baseline measurements before redesign: `pnpm build`, bundle output review, Lighthouse/page traces for dashboard and pull request monitor, and interaction checks on filter-heavy pages.
- Preserve Server Component data fetching for list and detail pages.
- Parallelize independent server reads and avoid waterfalls in dashboard/detail routes.
- Keep heavy chart code dynamically imported and evaluate whether Recharts can stay route-local.
- Virtualize or paginate lists once real data sizes exceed practical table rendering limits.
- Avoid unnecessary client providers at the root; keep client islands small.
- Review direct imports to avoid accidental barrel-import bundle growth.
- Remove unused dependencies only after confirming they are not planned for near-term implementation; `@tanstack/react-query` is currently present but not used.
- Add stable loading skeletons that reserve space and reduce layout shift.

Verification:

- Dashboard and pull-request list stay responsive with seeded or production-sized data.
- Initial route payload does not grow unexpectedly after UI modernization.
- No table or chart causes obvious layout shift during load.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass before merging implementation work.

### Phase 7: Accessibility And Quality

Goal:

Make polish measurable and prevent regressions.

Deliverables:

- Add an accessibility checklist for every changed UI surface.
- Ensure every form input has a visible label or equivalent accessible name.
- Use semantic table captions or contextual headings where needed.
- Add `aria-live` regions for async success/error messages where appropriate.
- Respect `prefers-reduced-motion`.
- Verify keyboard-only navigation for shell, filters, dialogs, dropdowns, and approval actions.
- Add focused component tests for URL parser defaults and filter serialization.
- Add route-level tests for server filtering once `nuqs` is integrated.

Verification:

- Keyboard users can complete the main review workflow.
- Screen readers receive meaningful labels for icon buttons, filter state, and mutation feedback.
- URL parser tests cover default, invalid, and multi-filter combinations.

## 7. Suggested Implementation Order

1. Establish design tokens and primitive component states.
2. Upgrade shell navigation and mobile layout.
3. Add `nuqs` parser architecture and convert `/pull-requests`.
4. Apply the same URL-state pattern to repositories, activity, approvals, and audit log.
5. Modernize dashboard cards, charts, and empty/loading states.
6. Improve PR detail approval UX with React 19 pending/optimistic patterns.
7. Polish settings, billing, usage, GitHub setup, and team sections.
8. Add performance profiling, accessibility checks, and regression tests.

## 8. Definition Of Done

For each implementation slice:

- The changed UI is responsive, keyboard accessible, and visually consistent with the token system.
- Search/filter/sort/page state is represented in the URL where the state affects shareable data views.
- Server-side filtering and authorization remain authoritative.
- Loading, empty, error, success, demo, and live-data states are explicit.
- New client components are justified by interactivity.
- Heavy client-only code is isolated and measured.
- The implementation updates docs when route behavior, query params, setup steps, or design conventions change.

## 9. Reference Notes

- Current project docs: `docs/README.md` and `docs/ENHANCEMENT_PLAN.md`.
- Key shell and UI files: `components/app/app-shell.tsx`, `components/app/root-shell.tsx`, `components/ui`, and `app/globals.css`.
- Current URL-state example: `app/pull-requests/page.tsx`.
- Latest checked package note: `nuqs` latest is `2.8.9` as of this review.
- Next.js 16 planning note: async `searchParams` are request-time data; avoid accessing them inside `"use cache"` scopes.
- React 19 planning note: prefer Actions, `useActionState`, `useOptimistic`, `useTransition`, and `useFormStatus` where they directly improve user feedback.
