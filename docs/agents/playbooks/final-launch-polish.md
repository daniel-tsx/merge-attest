# Playbook: Final Launch Polish

**Status:** `current` (2026-07-04)
**Scope:** the last pass before announcing or driving traffic. Complements (does not replace) `docs/operations/PRODUCTION_CHECKLIST.md` — that file owns env/runtime gates; this playbook owns the product-surface sweep. Claude agents: the `eastbase-launch-check` skill is the studio-level gate; run it for the verdict, use this playbook for the MergeAttest specifics.

## Read First

`docs/operations/PRODUCTION_CHECKLIST.md`, `docs/agents/PROJECT_QUALITY_BAR.md`, `docs/AGENT_START_HERE.md` (launch posture), `docs/operations/PRIVACY_RETENTION_SUPPORT.md`.

## Sweep Order

### 1. Landing (`/`)

Copy exact and claim-safe; CTAs route to `/sign-up`; seal animation respects reduced motion; both themes; 380/768/1280px; no console errors.

### 2. Auth surfaces

Sign-up → verification (if Resend configured) → sign-in → forgot/reset password. Error copy in product voice; auth pages carry the brand aside; flows only work on port 3000 locally.

### 3. App & dashboard

Onboarding checklist coherent for a fresh org (GitHub App install path); every list page: filters (nuqs), empty state, skeleton parity, sort; PR detail: attribution panel, risk breakdown, approvals/attestation gate; reports and exports produce well-formed files.

### 4. Empty / loading / error states

New-org walkthrough with zero data: every surface must look designed, not broken. Check `not-found` and error boundaries on bad IDs (`/pull-requests/nope`). Demo mode (empty `DATABASE_URL`) is the fast way to eyeball populated states; a fresh real org is the way to check empty ones.

### 5. Legal / support / footer

`/privacy` + `/terms` reachable from all public surfaces, consistent with the privacy doc, labeled as needing human legal review if changed; `support@mergeattest.com` everywhere product-facing; footer links resolve.

### 6. Billing surface honesty

`/settings/billing` presents the free early-access plan and limits truthfully; no checkout/portal reachable while `ENABLE_PAID_BILLING` is off; usage page matches `lib/entitlements.ts` numbers (3 repos, 200 PR checks/mo, 7-day audit retention — re-verify in code).

### 7. SEO / OG / discovery

Metadata from `lib/site.ts`; sitemap = public routes only; OG image current; JSON-LD matches page claims; `llms.txt` / `llms-full.txt` / `ai-discovery.json` pass the "never invent" checklist in `docs/operations/AI_DISCOVERABILITY.md`.

### 8. Launch assets

If announcing: screenshots and copy per `marketing-assets.md` playbook — real UI, no invented numbers.

## Checks

```bash
pnpm lint && pnpm typecheck && pnpm test
pnpm build   # with GITHUB_* placeholders locally
```

Browser verification for every surface touched. Report each finding with severity (P0 blocker → P3 nit), fixed vs. deferred.

## Manual / Human-Only Before Announce

Production env vars set (per PRODUCTION_CHECKLIST), domain/DNS, email sender verified, GitHub App production install tested by a human, legal review of policy pages, the actual publishing/announcing. **Flag these; never attempt them.**

## Output

Verdict (ready / ready-with-caveats / not ready), blockers vs. follow-ups, what was verified vs. assumed, commit hashes — per `docs/agent-prompts/handoff-after-major-task.md`.
