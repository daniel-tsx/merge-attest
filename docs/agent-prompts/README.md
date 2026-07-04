# Agent Prompt Catalog

**Status:** `current`
**Last verified:** 2026-07-04

Copy/paste-ready prompts for future agent sessions on MergeAttest. Each prompt is self-contained: context, goal, required docs, scope, steps, quality bar, safety, checks, git behavior, and report format. Paste the whole file (below the `---`) into a fresh session; fill any `<placeholders>`.

## Model Guidance

Tiers, not brand names — map to whatever is current:

- **High-judgment** (Fable-class): design direction, strategic docs, positioning, premium polish, security reviews.
- **Strong implementation** (Opus-class): complex implementation, architecture changes, auth/billing-adjacent fixes, full redesign builds.
- **Efficient implementation** (Sonnet/Codex-class): routine polish, content updates, doc refreshes, tests, scripts.

## Catalog

| Prompt                                                                   | Use case                                           | Best tier                                             | Risk     | Required docs (beyond AGENT_START_HERE + AGENTS.md) | Typical output                                |
| ------------------------------------------------------------------------ | -------------------------------------------------- | ----------------------------------------------------- | -------- | --------------------------------------------------- | --------------------------------------------- |
| [`project-context-refresh.md`](project-context-refresh.md)               | Re-verify docs against code after major changes    | High-judgment                                         | Low      | Knowledge map, architecture playbook                | Updated docs + dated audit note               |
| [`landing-design-directions.md`](landing-design-directions.md)           | Generate 3–5 landing directions before a redesign  | High-judgment                                         | Low      | PRODUCT.md, DESIGN.md, landing playbook             | Directions doc + recommendation               |
| [`full-landing-redesign.md`](full-landing-redesign.md)                   | Implement a chosen landing direction               | High-judgment / strong impl.                          | Medium   | Landing playbook, design system, quality bar        | Shipped landing + verification matrix         |
| [`final-launch-polish.md`](final-launch-polish.md)                       | Last pass before announcing / driving traffic      | High-judgment                                         | Medium   | Launch playbook, PRODUCTION_CHECKLIST, quality bar  | Verdict + fixes + human-only list             |
| [`product-content-audit.md`](product-content-audit.md)                   | Review/correct all product copy                    | Efficient impl. (high-judgment if positioning shifts) | Low      | Content playbook, PRODUCT.md, AI_DISCOVERABILITY    | Findings table + source fixes                 |
| [`ai-agent-discoverability-audit.md`](ai-agent-discoverability-audit.md) | Audit llms.txt / ai-discovery / sitemap / metadata | Efficient impl.                                       | Low      | Discoverability playbook + ops doc                  | Claim-diff table + fixed files                |
| [`security-readiness-review.md`](security-readiness-review.md)           | Defensive access-control & data-protection review  | High-judgment                                         | **High** | Security playbook, SYSTEM_DESIGN, ADMIN.md, API.md  | Findings (P0–P3) + negative-path tests        |
| [`architecture-overview-update.md`](architecture-overview-update.md)     | Sync architecture docs after feature work          | Efficient impl.                                       | Low      | Architecture playbook                               | Updated SYSTEM_DESIGN / HTML pages / maps     |
| [`marketing-assets-prep.md`](marketing-assets-prep.md)                   | Screenshots, OG concepts, social/blog drafts       | Efficient impl. (high-judgment for narrative)         | Low      | Marketing playbook, PRODUCT.md                      | Asset pack, claims mapped, human publish list |
| [`blog-series-for-product.md`](blog-series-for-product.md)               | Plan a 6–10 post product-grounded blog series      | High-judgment                                         | Low      | PRODUCT.md, AI_GOVERNANCE.md                        | Series plan (+ first draft)                   |
| [`feature-polish.md`](feature-polish.md)                                 | Bring an app surface/flow to the quality bar       | Efficient impl.                                       | Medium   | Design system, SYSTEM_DESIGN, quality bar           | Polished surface + verification matrix        |
| [`handoff-after-major-task.md`](handoff-after-major-task.md)             | Consistent end-of-task handoff                     | Any                                                   | Low      | AGENT_START_HERE checklist                          | Structured handoff                            |

**Risk levels:** Low = docs/copy/drafts, easy rollback. Medium = user-visible code, needs browser verification. High = auth/tenancy/data-protection surface — verify everything, smallest possible diffs.

## Rules of Use

- Prompts assume the repo's guardrails (root `AGENTS.md` §5) — pasting a prompt never overrides them.
- If a prompt and a playbook disagree, the playbook is newer-maintained truth; fix the prompt afterward.
- When a prompt's product facts go stale (launch posture, routes, limits), update it here in the same pass that changed the facts — these files are part of the docs surface.
