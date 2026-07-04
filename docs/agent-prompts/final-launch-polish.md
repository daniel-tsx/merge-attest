# Prompt: Final Launch Polish

Copy/paste before announcing MergeAttest or driving real traffic. Fable/Opus-tier judgment recommended.

---

You are working in the MergeAttest repository — a GitHub-native control center governing AI-assisted pull requests. Stage: free early access, pre-customer; paid billing dormant; AI review execution disabled. This is the final product-surface pass before launch activity.

**Goal:** sweep every user-facing surface to shipping quality, fix what an agent can fix, and produce a launch verdict with explicit human-only items.

**Required reading:** `docs/agents/playbooks/final-launch-polish.md` (the method — follow its sweep order), `docs/operations/PRODUCTION_CHECKLIST.md`, `docs/agents/PROJECT_QUALITY_BAR.md`, `docs/AGENT_START_HERE.md`. Claude agents: run the `eastbase-launch-check` skill for the studio-level verdict alongside this sweep.

**Scope boundaries:** polish, copy, states, metadata — no new features, no schema changes, no auth/billing behavior changes, no dependency changes. Fix P0/P1 findings that are safely in scope; log the rest.

**Tasks (per the playbook's sweep order):**

1. Landing → 2. Auth flows (port 3000!) → 3. App/dashboard with fresh-org walkthrough → 4. Empty/loading/error states (demo mode for populated, fresh org for empty) → 5. Legal/support/footer (`support@mergeattest.com`) → 6. Billing-surface honesty vs. `lib/entitlements.ts` → 7. SEO/OG/discovery files vs. the never-invent list → 8. Launch assets check if requested.
2. Classify every finding P0–P3; fix in-scope ones; keep an itemized log.
3. Re-verify anything you fixed in the browser.

**Quality bar:** every section of `docs/agents/PROJECT_QUALITY_BAR.md`; empty/loading/error states are designed surfaces; no placeholder-looking UI; no unsupported claims.

**Safety:** local/dev only — never touch production services, data, or webhooks; no secrets in output; legal-page edits get flagged for human review; **never attempt** the human-only list (domain/DNS, email sender verification, production env, publishing).

**Checks:** `pnpm lint && pnpm typecheck && pnpm test`; `pnpm build` with `GITHUB_*` placeholder env vars; browser verification for each touched surface; scoped prettier.

**Git:** commit as `polish: final launch pass (<date>)` — or split by surface if large. Do not push.

**Final report:** verdict first (ready / ready-with-caveats / not ready); blockers vs. follow-ups with severity; findings fixed vs. deferred; checks + results; verified vs. assumed; the human-only checklist; commit hashes.
