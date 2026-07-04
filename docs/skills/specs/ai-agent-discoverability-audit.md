# Skill Spec: mergeattest-discoverability-audit

**Status:** `current` spec (2026-07-04) — not yet converted to a skill.

**Purpose:** keep the agent-readable/SEO layer (`llms.txt`, `llms-full.txt`, `ai-discovery.json`, robots/sitemap/manifest, JSON-LD, OG) accurate and mutually consistent, so any AI agent or crawler describing MergeAttest says only true things.

**When to use:** after features ship or posture changes; before launch/directory pushes; on a periodic cadence (the layer drifts silently); when an external AI's description of the product is observed to be wrong.

**When not to use:** general copy problems on human-facing pages (content audit skill); landing structure changes; growth/backlink work (out of scope entirely).

**Required inputs:** none mandatory; optional: what shipped since last audit, observed wrong descriptions.

**Required project docs:** `docs/agents/playbooks/ai-agent-discoverability.md` (the method), `docs/operations/AI_DISCOVERABILITY.md` (file inventory + **never-invent list** — authoritative), `lib/site.ts`, `lib/seo/**`.

**Workflow:**

1. Serve check: fetch `/llms.txt`, `/llms-full.txt`, `/ai-discovery.json`, `/robots.txt`, `/sitemap.xml` from `pnpm dev` — 200s, valid JSON.
2. Claim-diff each file against code truth (posture, GitHub-only, AI execution disabled, free limits from `lib/entitlements.ts`); strip never-invent-list violations.
3. Consistency pass across `llms.txt` ↔ `ai-discovery.json` ↔ `siteConfig` ↔ JSON-LD ↔ landing hero.
4. Crawl surface: sitemap = `publicSitemapRoutes` exactly; no authenticated routes.
5. Freshness: fold in shipped features (per `ENHANCEMENT_PLAN.md` statuses) — exact, not aspirational.
6. Anti-spam pass; re-fetch after edits.

**Expected outputs:** per-file claim-diff table (claim / code truth / action); consistency + crawl-surface confirmation.

**Files likely created/updated:** `public/llms.txt`, `public/llms-full.txt`, `public/ai-discovery.json`, `app/{robots,sitemap,manifest}.ts`, `lib/seo/*`, `lib/site.ts`.

**Checks to run:** JSON validation; `pnpm lint && pnpm typecheck` if TS changed; re-fetch all five URLs; scoped prettier.

**Safety boundaries:** accuracy over reach — when in doubt, claim less; no keyword stuffing or fake Q&A; no production touches; no pushes.

**Final report format:** claim-diff tables; consistency confirmation; human items (directory resubmission); commit hash.

**Example invocation prompt:** "Audit MergeAttest's AI discoverability layer — the attestation gate and team invites shipped since the files were last touched."
