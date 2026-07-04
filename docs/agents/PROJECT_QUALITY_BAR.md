# Project Quality Bar

**Status:** `current`
**Last verified:** 2026-07-04

What "good" means for MergeAttest. Any user-visible or externally-visible work should pass this bar before it's called done. The house method lives in the `eastbase-premium-ui` skill; this file is the MergeAttest-specific pass/fail line.

## Landing & Marketing Pages

**Pass:** the page reads like an audited record — Paper of Record register (Fraunces serif headlines, mono uppercase eyebrows at wide tracking), real product mechanics shown (attestation seal, merge record, deterministic signals, sample queue, evidence), exact claim-safe copy, near-static motion with one signature moment (`.attest-draw`), dot-grid/hairline atmosphere on blueprint neutrals.

**Fail:** centered icon-title-text card grids; hero metrics or logo walls (pre-customer!); purple gradients or any linear-gradient background; decorative "AI" pills and sparkle badges; adjectives doing the work evidence should do ("blazingly fast", "enterprise-grade"); looping animation.

## App / Dashboard

**Pass:** instrument-cluster density — compact KPI rows with `tabular-nums`, hairline-bordered flat cards, semantic status tones (`success`/`warning`/`attention`/`danger`/`info`), org-scoped data via `lib/data/app-data.ts`, `nuqs` URL state on filterable lists, `text-display`/`text-eyebrow` type utilities, GateScan mark where the brand appears.

**Fail:** stock shadcn defaults or raw palette classes (`bg-blue-500`) in shared primitives; shadow-heavy floating cards; colored side stripes; a chart or metric that renders from unscoped or client-fetched private data.

## Empty / Loading / Error States

**Pass:** every list/detail surface has a designed empty state (what this surface will show + the next action, in product voice, e.g. pointing at GitHub App install); `loading.tsx` skeletons mirror the real layout (update them **in the same PR** as layout changes); error states offer a route back and never leak internals.

**Fail:** a bare "No data" line; a skeleton shaped like the previous layout; default Next.js error surfaces on reachable paths; placeholder-looking dashboards.

## Copy / Content

**Pass:** operational and exact; mechanism named (deterministic scoring, weighted attribution signals, immutable attestations); the "free early access" posture stated wherever plans/pricing come up; consistent strings sourced from `lib/site.ts` and `components/marketing/content.ts`.

**Fail:** invented traction, testimonials, customers, or pricing; "AI-powered" as a value claim (the product's point is deterministic governance); compliance **certification** claims (we support evidence for EU AI Act/SOC2 reviews — we are not certified); copy drift between page, metadata, and `llms.txt`.

## Trust & Commercial Readiness

**Pass:** `/privacy` and `/terms` reachable from every public surface and consistent with `docs/operations/PRIVACY_RETENTION_SUPPORT.md`; support contact is `support@mergeattest.com`; billing surfaces describe the free plan truthfully and hide paid checkout while `ENABLE_PAID_BILLING` is off.

**Fail:** legal pages contradicting actual data handling; any surface implying paid plans are purchasable today; studio email (`support@eastbase.studio`) leaking into product surfaces.

## SEO / Social Metadata

**Pass:** titles/descriptions come from `lib/site.ts`; `app/sitemap.ts` covers exactly the public routes; OG image renders the current positioning; JSON-LD (`lib/seo/**`) matches on-page claims.

**Fail:** hand-written metadata diverging from `siteConfig`; sitemap listing authenticated routes; keyword stuffing.

## AI-Agent Discoverability

**Pass:** `public/llms.txt`, `llms-full.txt`, and `ai-discovery.json` stay true to shipped behavior and respect the "never invent" list in `docs/operations/AI_DISCOVERABILITY.md` (no pricing, no testimonials, no non-GitHub integrations, no default-on AI review claims); updated in the same change that ships a feature they describe.

**Fail:** discovery files describing dormant/disabled capabilities as live; spammy AI-SEO phrasing.

## Accessibility

**Pass:** visible `focus-visible` rings on all interactive controls; global `prefers-reduced-motion` kill-switch covers every animation (duration **and** delay); decorative icons `aria-hidden`; readable contrast in both themes; no hover-only interactions; forms labeled.

**Fail:** removing focus styles for aesthetics; animation that ignores the kill-switch; contrast that only works in dark mode.

## Performance

**Pass:** server components by default; client islands only where interaction demands (charts, command palette, forms); no new heavy dependencies for marginal UI; streaming with matching skeletons on slow data.

**Fail:** converting a server page to client-side fetching for convenience; importing a component library when `components/ui/` already covers it.

## Security Basics

**Pass:** every private read goes through `lib/data/app-data.ts` (or `lib/admin/admin-data.ts` for platform admin only); server actions re-check session, org membership, and role via `lib/collaboration.ts`; webhooks verify signatures; job routes require `JOB_RUNNER_SECRET`; entitlements enforced server-side; negative-path tests for new authorization surface ("as org A, request org B's resource — expect rejection").

**Fail:** client-side-only access checks anywhere private data exists; a new Prisma query with cross-org reach outside `lib/admin/`; trusting webhook payloads without HMAC verification.

## Documentation

**Pass:** the matching current doc updated in the same change that alters routes, env vars, schema, billing/auth/security, or user-visible behavior; status line present; shipped plans moved to `docs/archive/`; `.env.example` updated with new vars.

**Fail:** a doc describing behavior the code no longer has; two "current" docs for one feature; audit records rewritten instead of appended.

## Handoff

**Pass:** outcome first; what was inspected/changed with file paths; checks run with real results; "verified" separated from "assumed"; commit hashes; explicit human-only items flagged (per `docs/agent-prompts/handoff-after-major-task.md`).

**Fail:** "everything works" without command output; hidden failures; next steps that silently include human-only actions.

## The Short List of Never

- Generic SaaS copy or layout patterns from template memory.
- Unsupported claims of any kind, anywhere, including placeholders.
- Placeholder-looking UI shipped as final.
- Broken responsive layouts (verify ~380px, tablet, desktop).
- Client-side-only access checks where private data exists.
- Linear-gradient backgrounds.
- Docs that no longer match the product.
