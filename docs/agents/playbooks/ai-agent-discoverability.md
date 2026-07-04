# Playbook: AI-Agent Discoverability

**Status:** `current` (2026-07-04)
**Scope:** keeping MergeAttest legible and accurately represented to AI agents, answer engines, and search systems. The operational source of truth is `docs/operations/AI_DISCOVERABILITY.md` — this playbook is the working method around it.

## Read First

`docs/operations/AI_DISCOVERABILITY.md` (owns the file inventory and the **never-invent list**), `lib/site.ts`, `public/llms.txt` + `llms-full.txt` + `ai-discovery.json`, `app/{robots,sitemap,manifest}.ts`, `lib/seo/**` (JSON-LD).

## Principle

An AI agent answering "what is MergeAttest?" should give the same answer as the landing page, which gives the same answer as `lib/site.ts`. Discoverability work is **consistency + accuracy** work, not growth hacking. Ironically fitting: this product's whole pitch is honest evidence about AI systems — its own discovery layer must be the cleanest example.

## The Layer

| File                               | Role                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------- |
| `public/llms.txt`                  | Concise agent-readable index: what/who/status + key URLs                  |
| `public/llms-full.txt`             | Expanded profile: features, data handling, plan posture                   |
| `public/ai-discovery.json`         | Structured metadata: category, audience, features, contact                |
| `app/robots.ts` / `app/sitemap.ts` | Crawl surface: public routes only (`lib/site.ts` → `publicSitemapRoutes`) |
| `lib/seo/**` JSON-LD               | Structured data on the landing page                                       |
| `/privacy`, `/terms`               | The public pages agents cite for trust questions                          |

## Audit Steps

1. **Serve check:** all three discovery files return 200 with correct content types; JSON parses.
2. **Claim diff:** compare each file's claims against code truth (launch posture, GitHub-only, AI execution disabled, free plan limits). Anything on the never-invent list → remove.
3. **Consistency pass:** description/category/audience identical in spirit across `llms.txt`, `ai-discovery.json`, `siteConfig`, JSON-LD, and the hero.
4. **Crawl surface:** sitemap lists exactly the public routes; robots doesn't block them; no authenticated routes leak into either.
5. **Freshness:** if a feature shipped since the files were last touched (check `docs/strategy/ENHANCEMENT_PLAN.md` statuses), fold it in — described exactly, not aspirationally.
6. **Anti-spam:** no keyword stuffing, no fake Q&A blocks, no "best tool for X" self-labeling. Clear public pages beat tricks.

## When Features Ship

Update discovery files **in the same change** that makes a capability real (quality-bar rule). When paid billing or AI review execution eventually turn on, this layer is on the must-change-together list — see `docs/agents/DOCS_AUDIT_AND_CLEANUP.md` human-review items.

## Verify

`pnpm dev`, then curl/fetch `/llms.txt`, `/llms-full.txt`, `/ai-discovery.json`, `/robots.txt`, `/sitemap.xml` and read them as an outside agent would. Validate JSON. `pnpm lint && pnpm typecheck` if TS files changed.

## Output

Per-file claim-diff table (claim / code truth / action), consistency confirmation across the five surfaces, and anything deferred to humans (e.g., resubmitting to directories), per `docs/agent-prompts/handoff-after-major-task.md`.
