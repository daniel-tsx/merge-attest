# Playbook: Architecture Doc Update

**Status:** `current` (2026-07-04)
**Scope:** keeping the architecture layer truthful after feature or service changes. MergeAttest has an unusually deep architecture reference — 12 HTML deep-dives plus `SYSTEM_DESIGN.md` — which is valuable exactly as long as it stays accurate.

## The Architecture Doc Set

| Doc                                          | Owns                                                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `docs/SYSTEM_DESIGN.md`                      | Cross-cutting truth: layers, tenancy, domain flows, UI model                                                                   |
| `docs/architecture/index.html`               | Hub with read-order and question→doc map                                                                                       |
| `docs/architecture/*-architecture.html` (12) | Deep dives: auth, database, governance, GitHub, jobs, billing, AI review, frontend, security, observability, deployment, audit |
| `docs/AGENT_START_HERE.md`                   | Source-of-truth map (area → code → doc) and drift table                                                                        |
| `docs/agents/REPO_KNOWLEDGE_MAP.md`          | Condensed orientation (routes, sensitive areas)                                                                                |

## When to Update

Update after changes to: routes/APIs, `prisma/schema.prisma`, env vars, auth/billing/security behavior, job/queue semantics, integration boundaries (GitHub, Lemon Squeezy, OpenRouter, Resend), or the launch posture (free flags, `ENABLE_PAID_BILLING`, AI execution). Do **not** update for refactors that preserve behavior, or tiny copy changes.

## Method

1. **Diff-driven scoping:** from the feature diff, list touched areas → map to docs via the table above (one feature usually touches `SYSTEM_DESIGN.md` + 1–2 HTML pages + possibly `AGENT_START_HERE.md` rows).
2. **Verify against code, not memory:** open the modules the doc cites; quote real file paths, real env var names, real route paths.
3. **Edit the smallest truthful delta:** these docs are reference material — update the affected sections; don't rewrite pages wholesale.
4. **HTML pages:** match the existing page's structure and styling conventions (they're self-contained hand-written HTML — edit in place, keep the visual language; check the stated "last verified" date and bump it).
5. **Cascade:** update `AGENT_START_HERE.md` source-of-truth map rows and env table if paths/vars changed; update `REPO_KNOWLEDGE_MAP.md` if routes/sensitive areas changed; update `docs/README.md` summaries only if a doc's scope changed.
6. **Status lines:** bump "Last verified" dates on every doc actually re-verified — never bump a date without checking the content.

## Launch-Posture Changes (special case)

If `ENABLE_PAID_BILLING` turns on or AI review execution enables, the must-change-together set is: `AGENT_START_HERE.md` (posture paragraph), `billing-and-entitlements-architecture.html` / `ai-review-architecture.html`, `/settings/billing` copy, `docs/operations/*`, and the discovery files (`llms*.txt`, `ai-discovery.json`). Treat a partial update as a failure.

## Verify

Internal links resolve (relative paths from the doc's own folder); HTML pages render in a browser; `pnpm exec prettier --write` on touched Markdown (not the HTML — match its existing formatting); drift table in `AGENT_START_HERE.md` updated if you resolved or discovered drift.

## Output

Docs touched with the behavior change each reflects, drift found vs. resolved, dates bumped, per `docs/agent-prompts/handoff-after-major-task.md`.
