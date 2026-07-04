# Prompt: AI-Agent Discoverability Audit

Copy/paste to audit the agent-readable/SEO layer. Sonnet-tier is sufficient.

---

You are working in the MergeAttest repository — a GitHub-native control center governing AI-assisted pull requests. Free early access, pre-customer; AI execution disabled; billing dormant. The product's pitch is honest evidence about AI systems — its own discovery layer must be the cleanest example of that.

**Goal:** verify that AI agents, answer engines, and crawlers get an accurate, consistent picture of MergeAttest — and fix drift.

**Required reading:** `docs/agents/playbooks/ai-agent-discoverability.md` (the method), `docs/operations/AI_DISCOVERABILITY.md` (file inventory + **never-invent list**), `lib/site.ts`, `lib/seo/**`.

**Scope boundaries:** `public/llms.txt`, `public/llms-full.txt`, `public/ai-discovery.json`, `app/{robots,sitemap,manifest}.ts`, `lib/seo/**`, `lib/site.ts`, `app/opengraph-image.tsx`. No landing redesign, no route changes, no structured-data spam.

**Tasks:**

1. Serve check: `pnpm dev`, fetch `/llms.txt`, `/llms-full.txt`, `/ai-discovery.json`, `/robots.txt`, `/sitemap.xml` — 200s, valid JSON, sane content types.
2. Claim diff per file against code truth: launch posture, GitHub-only, AI execution disabled, free plan limits from `lib/entitlements.ts`. Remove anything on the never-invent list (pricing, testimonials, non-GitHub integrations, compliance certifications, default-on AI review).
3. Consistency pass: description/category/audience aligned across `llms.txt` ↔ `ai-discovery.json` ↔ `siteConfig` ↔ JSON-LD ↔ landing hero.
4. Crawl surface: sitemap = exactly `publicSitemapRoutes`; robots consistent; no authenticated routes exposed.
5. Freshness: fold in features shipped since the files' last update (check `docs/strategy/ENHANCEMENT_PLAN.md` statuses) — described exactly, not aspirationally.
6. Anti-spam pass: no keyword stuffing, no self-labeled superlatives, no fake Q&A.

**Quality bar:** AI-discoverability + SEO sections of `docs/agents/PROJECT_QUALITY_BAR.md`; an agent quoting these files would say only true things.

**Safety:** no production touches; no pushes; accuracy over reach — when in doubt, claim less.

**Checks:** JSON validation; `pnpm lint && pnpm typecheck` if TS changed; re-fetch all five URLs after edits; scoped prettier.

**Git:** commit as `docs: refresh AI discoverability layer (<date>)`. Do not push.

**Final report:** per-file claim-diff table (claim / code truth / action); consistency confirmation; crawl-surface status; anything left for humans (directory resubmissions); commit hash.
