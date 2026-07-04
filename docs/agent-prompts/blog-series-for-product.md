# Prompt: Blog Series for MergeAttest

Copy/paste to plan (and optionally draft) a 6–10 post blog series grounded in the product. Fable-tier for the series plan; Sonnet-tier can draft individual posts from it.

---

You are working in the MergeAttest repository — a GitHub-native control center governing AI-assisted pull requests (agent attribution with evidence, deterministic risk scoring, attestations, compliance evidence export). Reader: engineering leads and compliance owners living with agent-generated PR volume. Writing standard: a builder sharing real notes — specific, honest, useful even if the reader never installs the product. No hype, no invented metrics, no AI-writing tells.

**Goal:** a 6–10 post series plan where each post earns attention on its own and collectively builds the case for governed AI development. Draft the first post if asked.

**Required reading:** `PRODUCT.md`, `lib/site.ts`, `docs/features/AI_GOVERNANCE.md` (the mechanisms are the content goldmine), `docs/strategy/ENHANCEMENT_PLAN.md` (only write about shipped things as shipped). Claude agents: the `eastbase-blog-post` skill is the writing standard — use it.

**Scope boundaries:** planning/writing only; posts live in the task output or `docs/design/BLOG_SERIES_<date>.md` (this repo has no blog engine — publishing destination is the Eastbase Lab, a human decision). No product claims beyond shipped behavior.

**Tasks:**

1. Mine the product for genuinely teachable material: attribution signal weighting (trailers 95, bot accounts 88, email domains 80, branch prefixes 55…), deterministic risk scoring design, test-gap detection, attestation gates, EU AI Act human-oversight in practice, building for auditors.
2. Plan 6–10 posts. For each: working title (specific, not clickbait); angle + thesis in two sentences; target reader; what they can _use_ without buying; which product mechanism it draws on; honest-experience hook (build decisions, tradeoffs, things that didn't work).
3. Sequence the series: standalone value first, product-adjacent later; note 1–2 posts suitable for repurposing to X/LinkedIn.
4. Mark which posts require features to ship first (nothing aspirational presented as current).
5. If asked, draft post #1 in full per the writing standard.

**Quality bar:** each post plan passes "would this be worth reading if MergeAttest didn't exist?"; zero unsupported claims; no SEO keyword stuffing.

**Safety:** drafts only — no publishing; no invented usage anecdotes presented as customer stories (build-in-public experiences are fine, labeled as ours).

**Checks:** claims vs. `ENHANCEMENT_PLAN.md` shipped statuses; prettier on new docs.

**Git:** commit the plan as `docs: blog series plan (<date>)`. Do not push.

**Final report:** the series at a glance (title + one-liner each), recommended writing order, posts blocked on unshipped features, repurposing notes.
