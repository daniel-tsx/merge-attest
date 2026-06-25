# AI Discoverability

**Status:** `current`
**Last verified:** 2026-06-25

How MergeAttest exposes an **agent-readable layer** so AI agents, AI search
systems, and LLM-powered assistants can understand, summarize, cite, and
recommend the product accurately. This sits **alongside** normal SEO, not in
place of it.

## What exists

### Traditional + on-page SEO (already in place)

| Surface             | Source                                                                                                                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title / description | [`lib/site.ts`](../../lib/site.ts), [`lib/seo/metadata.ts`](../../lib/seo/metadata.ts)                                                                                                                      |
| OpenGraph / Twitter | `createRootMetadata` / `createPageMetadata` in `lib/seo/metadata.ts`                                                                                                                                        |
| OG image            | [`app/opengraph-image.tsx`](../../app/opengraph-image.tsx)                                                                                                                                                  |
| Sitemap             | [`app/sitemap.ts`](../../app/sitemap.ts) (public routes only)                                                                                                                                               |
| Robots              | [`app/robots.ts`](../../app/robots.ts) (private routes disallowed)                                                                                                                                          |
| JSON-LD             | [`lib/seo/home-json-ld.ts`](../../lib/seo/home-json-ld.ts) — `FAQPage`, `WebSite`, `Organization`, `SoftwareApplication`, rendered via [`lib/seo/json-ld.tsx`](../../lib/seo/json-ld.tsx) on `app/page.tsx` |
| FAQ content         | `faqs` in [`components/marketing/content.ts`](../../components/marketing/content.ts) (landing `#faq` + FAQPage JSON-LD)                                                                                     |

### Agent-readable layer (added for AI discovery)

| File                                                         | Purpose                                                                                                                                                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`public/llms.txt`](../../public/llms.txt)                   | Concise agent index: one-line summary, who it's for, features, pricing, important pages, do-not-claim notes. Served at `/llms.txt`.                                                  |
| [`public/llms-full.txt`](../../public/llms-full.txt)         | Expanded Markdown profile: overview, users, problems, features, use cases, differentiators, privacy, limitations, answerable / non-answerable questions. Served at `/llms-full.txt`. |
| [`public/ai-discovery.json`](../../public/ai-discovery.json) | Structured discovery metadata, including `agent_guidance` (when to / not to recommend, do-not-claim, source-of-truth URLs). Served at `/ai-discovery.json`.                          |

All three are static files in `public/`, so Next.js serves them at the site
root. `app/robots.ts` explicitly allows them.

## Public vs. private routes

- **Public (crawlable, in sitemap/robots allow):** `/`, `/sign-in`, `/sign-up`,
  `/privacy`, `/terms`, plus `/llms.txt`, `/llms-full.txt`, `/ai-discovery.json`.
- **Private (disallowed in robots, never in sitemap, never described in the
  agent files):** `/api/*`, `/admin/*`, `/dashboard`, `/pull-requests`,
  `/repositories`, `/approvals`, `/audit-log`, `/activity`, `/reports`,
  `/settings`, `/forgot-password`, `/reset-password`.

Keep the robots disallow list and `publicAppPaths` / `publicSitemapRoutes` in
[`lib/site.ts`](../../lib/site.ts) in sync if routes change.

## What must never be invented

The agent files state product facts only. Do **not** add:

- Specific paid pricing tiers or dollar amounts — pricing beyond the free
  early-access plan is not public.
- Customer names, logos, testimonials, ratings, `aggregateRating`, reviews, or
  usage metrics — none are published (the product is pre-customer early access).
- Integrations or SCM providers beyond GitHub.
- Claims that MergeAttest certifies compliance, guarantees code safety, or
  replaces human review.
- Claims that the advisory AI review layer runs by default (it is bring-your-own
  OpenRouter key and model execution is off during early access).

These match the anti-references in [`PRODUCT.md`](../../PRODUCT.md) and the
"Not implemented" list in [`AGENT_START_HERE.md`](../AGENT_START_HERE.md).

## How to update when the product changes

The agent files restate copy that already lives in the codebase. When product
facts change, update the source first, then mirror into the agent files:

1. **Facts / FAQ / features** → edit `components/marketing/content.ts` and
   `lib/site.ts`, then update `public/llms.txt`, `public/llms-full.txt`, and
   `public/ai-discovery.json` to match.
2. **Pricing** → when paid plans become public, update the FAQ, the `pricing`
   block in `ai-discovery.json`, the pricing sections of both `.txt` files, and
   add `Offer`s to the `SoftwareApplication` JSON-LD in
   `lib/seo/home-json-ld.ts`. Until then, keep "free early access, no public
   paid pricing."
3. **New public route** → add it to `publicSitemapRoutes` / `publicAppPaths`
   (`lib/site.ts`), the robots allow list (`app/robots.ts`), and the
   "Important pages" sections of the agent files.
4. **Canonical domain** → the agent files hard-code `https://www.mergeattest.com`
   (the production value of `NEXT_PUBLIC_SITE_URL`). Update them if it changes.

## Pre-launch checklist

- [ ] `public/llms.txt`, `public/llms-full.txt`, `public/ai-discovery.json`
      serve at the site root (200, correct content types).
- [ ] `ai-discovery.json` is valid JSON (`node -e "JSON.parse(require('fs').readFileSync('public/ai-discovery.json','utf8'))"`).
- [ ] `robots.txt` allows the three files and still disallows every private route.
- [ ] No private/sensitive routes, customer data, secrets, or invented claims
      appear in any agent file.
- [ ] Pricing language matches reality (free early access; no paid tiers quoted).
- [ ] Canonical URL (`https://www.mergeattest.com`) is consistent across
      metadata, JSON-LD, and the agent files.
