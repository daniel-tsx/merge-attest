# Skill Spec: mergeattest-access-review

**Status:** `current` spec (2026-07-04) — not yet converted to a skill.

**Purpose:** defensive access-control and data-protection review of MergeAttest's multi-tenant trust model: ownership validation, server-side authorization, webhook integrity, rate-limit review, private-data protection, and negative-path authorization tests.

**When to use:** before launch pushes; after changes to `app/api/**`, any `actions.ts`, `proxy.ts`, `lib/admin/**`, `lib/data/app-data.ts`, or auth/entitlement code; on a periodic cadence; when a new export or cross-org-adjacent feature lands.

**When not to use:** offensive testing of any kind (never); production probing (never); generic code review (use `eastbase-review-pr`); dependency CVE triage (that's `pnpm audit` in CI).

**Required inputs:** none mandatory; optional: commit range since last review, areas of concern.

**Required project docs:** `docs/agents/playbooks/security-and-access-review.md` (the method + trust model + nine review areas), `docs/SYSTEM_DESIGN.md` security sections, `docs/features/ADMIN.md`, `docs/features/API.md`.

**Workflow:**

1. Inventory changed surfaces (`git log` on API routes, actions, admin, proxy).
2. Verify each of the playbook's nine areas at its enforcement point: cross-org isolation, role escalation, admin allowlist boundary, webhook HMAC integrity, job-route bearer auth, export endpoints, rate limits/CSRF, data minimization, demo-mode boundary.
3. Confirm or write negative-path tests per area ("as org A, request org B's resource — expect rejection"), following `tests/admin-access.test.ts` / `tests/collaboration.test.ts` patterns.
4. Fix gaps defensively at the data/action layer; never weaken an existing check.
5. Classify P0 (cross-tenant exposure/auth bypass) → P3 (hardening).

**Expected outputs:** findings table with evidence `file:line`; new negative-path tests; defensive fixes for in-scope gaps.

**Files likely created/updated:** `tests/*.test.ts`; targeted fixes in `lib/**` / `app/**/actions.ts` / `app/api/**`; never schema changes without flagging first.

**Checks to run:** `pnpm exec vitest run tests/` (full suite — auth-adjacent), `pnpm lint && pnpm typecheck`.

**Safety boundaries:** defensive framing throughout (no exploit language in reports); local/dev only; no secrets printed; no destructive verification; no pushes.

**Final report format:** findings (area, severity, evidence, fixed/recommended); tests added; areas verified clean; areas **not** reviewed; human items (production env hardening); commit hash.

**Example invocation prompt:** "Run a MergeAttest access-control review covering everything merged since 2026-06-10 — the team-invites and compliance-export surfaces especially."
