# Fable Project System Handoff

**Status:** `current` — handoff for the 2026-07-04 agent-system pass (Fable session)
**Outcome:** MergeAttest now has a complete agent operating system: an upgraded root `AGENTS.md`, a knowledge map, a quality bar, onboarding, seven playbooks, twelve reusable prompts, and ten skill specs — built on top of docs that were verified clean rather than rewritten.

## What Was Inspected

Full repo: `package.json`, all routes in `app/` (public, auth, app, admin, API), `lib/` modules, `prisma/`, `tests/` (32 files), `scripts/` (empty), `.github/workflows/ci.yml`, `.claude/`, `public/` discovery files, SEO surfaces (`lib/site.ts`, `lib/seo/**`, `app/{robots,sitemap,manifest,opengraph-image}.*`), legal pages, and every doc under `docs/` plus root `README.md` / `AGENTS.md` / `CLAUDE.md` / `PRODUCT.md` / `DESIGN.md`.

## Docs Cleanup Result

**Nothing deleted or newly archived** — the June 2026 maintenance pass had already done that work; the audit found zero stale claims in current docs (details + human-review items: [`DOCS_AUDIT_AND_CLEANUP.md`](DOCS_AUDIT_AND_CLEANUP.md)). Old product names exist only in `docs/archive/` (intentional history); Paddle references are correct migration guidance; support email usage is consistent.

## Source of Truth Now

| Question                                | Doc                                                                                    |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| Session entry / code-truth map          | `docs/AGENT_START_HERE.md`                                                             |
| How to operate here                     | Root `AGENTS.md` (rebuilt this pass)                                                   |
| Where everything is / what not to break | `docs/agents/REPO_KNOWLEDGE_MAP.md`                                                    |
| What good looks like                    | `docs/agents/PROJECT_QUALITY_BAR.md`                                                   |
| Architecture                            | `docs/SYSTEM_DESIGN.md` + `docs/architecture/*.html`                                   |
| Features / ops / strategy               | `docs/features/*`, `docs/operations/*`, `docs/strategy/*` (all pre-existing, verified) |

## Ready to Use

- **Prompts** (`docs/agent-prompts/`, catalog in its README): context refresh, landing directions, full landing redesign, final launch polish, content audit, discoverability audit, security readiness review, architecture update, marketing assets, blog series, feature polish, handoff. All copy/paste ready with placeholders marked.
- **Playbooks** (`docs/agents/playbooks/`): the durable methods behind those prompts.
- **Skill specs** (`docs/skills/specs/`): ten specs ready to convert into Claude Code / Eastbase plugin skills — conversion notes in `docs/skills/README.md`. They deliberately layer on the existing studio skills (`eastbase-premium-ui`, `eastbase-launch-check`, `eastbase-blog-post`, `eastbase-review-pr`).

## Model Routing

- **Fable-class (high judgment):** landing design directions, launch verdicts, security readiness review, positioning/content strategy, blog series planning, anything that sets a standard others follow.
- **Opus-class:** full landing implementation, architecture-affecting features, auth/billing-adjacent fixes.
- **Sonnet/Codex-class:** content audits, discoverability audits, architecture doc sync, feature polish from a clear brief, tests, marketing asset execution, handoffs.
- Any tier: `handoff-after-major-task.md`.

## Human-Only (standing list)

Domain/DNS, live payments / enabling `ENABLE_PAID_BILLING` in production, enabling AI review model execution, production secrets and env, email sender verification, legal sign-off on `/privacy` `/terms`, publishing to social/directories, production GitHub App install verification.

## Recommended Next Tasks

1. **Security readiness review** (`security-readiness-review.md` prompt) — last point-in-time review is 2026-05-02 (archived); the team-invites, attestation, and export surfaces landed after it. Highest-value next run.
2. **Final launch polish** (`final-launch-polish.md` prompt) — the product is early-access live-ish but a full sweep against the new quality bar hasn't been run.
3. **Discoverability audit** (`ai-agent-discoverability-audit.md` prompt) — quick; confirms `llms*.txt`/`ai-discovery.json` reflect features shipped through June.
4. **Marketing assets prep** — screenshot pack + announcement drafts, ready for whenever the owner wants to push traffic.
5. **Blog series plan** — the attribution/deterministic-scoring mechanisms are unusually good teaching material.
6. **Feature work from the roadmap** — `docs/strategy/ENHANCEMENT_PLAN.md` remaining gaps: CI check-status ingestion, notification delivery, approval queues, CODEOWNERS parsing, DB-level pagination.
7. **Convert 2–3 skill specs** (launch check, dashboard polish, content audit) into real skills once the owner wants them auto-triggering.
8. **Decide the architecture-HTML maintenance stance** (flagged in the audit record) — keep as-is is the recommendation; revisit if drift appears.

## For the Next Agent

Start at `docs/AGENT_START_HERE.md` → root `AGENTS.md` → `docs/agents/FUTURE_AGENT_ONBOARDING.md`. Pick the prompt from `docs/agent-prompts/README.md` that matches your task. Every major task ends with the handoff format. The launch posture (free early access, dormant billing, disabled AI execution) is deliberate — never "fix" it.
