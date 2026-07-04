# Prompt: Security Readiness Review (Defensive)

Copy/paste for a defensive access-control and data-protection review. Fable/Opus-tier recommended — findings here carry real risk weight.

---

You are working in the MergeAttest repository — a multi-tenant GitHub-native SaaS (Next.js 16, Prisma, Better Auth) governing AI-assisted pull requests. This is a **defensive review**: access-control review, ownership validation, server-side authorization, webhook integrity, rate-limit review, private-data protection, and negative-path authorization tests. No offensive testing, no destructive verification, no production targets — local/dev and code reading only.

**Goal:** verify the trust model holds on every surface (especially anything added since the last review), close gaps defensively, and report findings with severity.

**Required reading:** `docs/agents/playbooks/security-and-access-review.md` (the method — follow its trust model and test list), `docs/SYSTEM_DESIGN.md` security sections, `docs/features/ADMIN.md`, `docs/features/API.md`, `proxy.ts`, `lib/data/app-data.ts`, `lib/admin/admin-data.ts`, `lib/collaboration.ts`, `lib/env.ts`.

**Scope boundaries:** review + negative-path tests + defensive fixes (adding missing server-side checks). Never weaken an existing check; never touch production; schema changes only if a fix truly requires one (flag first).

**Tasks:**

1. Inventory surfaces changed since the last review (`git log` on `app/api/`, `actions.ts` files, `lib/admin/`, `proxy.ts`).
2. Work through the playbook's nine review areas: cross-org isolation, role escalation, admin boundary, webhook integrity, job-route auth, export endpoints, rate limits/CSRF, data minimization, demo-mode boundary.
3. For each area, verify the enforcement point in code and confirm a negative-path test exists ("as org A, request org B's resource — expect rejection"); write missing tests following `tests/admin-access.test.ts` / `tests/collaboration.test.ts` patterns.
4. Fix gaps defensively (server-side check at the data/action layer, not the UI); classify all findings P0–P3.

**Quality bar:** security section of `docs/agents/PROJECT_QUALITY_BAR.md` — no client-side-only checks where private data exists; every private read through the scoped data layer.

**Safety:** defensive wording throughout the report (no exploit framing); no secrets printed; no production or live-webhook testing; no pushes.

**Checks:** `pnpm exec vitest run tests/` (all — auth-adjacent changes deserve the full suite); `pnpm lint && pnpm typecheck`.

**Git:** commit as `security: access-control review fixes and negative-path tests (<date>)`. Do not push.

**Final report:** findings table (area, severity, evidence `file:line`, status fixed/recommended); tests added; areas verified clean; areas **not** reviewed; commit hash; human-review items (e.g., production env hardening).
