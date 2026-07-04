# Docs Audit & Cleanup Record

**Status:** `current` — audit record for the 2026-07-04 agent-system pass
**Scope:** every file under `docs/`, root `README.md` / `AGENTS.md` / `PRODUCT.md` / `DESIGN.md`, and the public discovery files, checked against code and the current launch posture (free early access, paid billing dormant, AI model execution disabled).

## Headline Finding

The documentation was **already clean** before this pass. A previous maintenance cycle (2026-06-10 / 2026-06-25) archived stale plans, labeled every doc with a status line, and removed stale product names from current docs. This audit found **zero stale claims in current docs** and therefore performed **no deletions and no new archiving**. The work of this pass was additive: the agent operating layer (`docs/agents/`, `docs/agent-prompts/`, `docs/skills/`) and an upgraded root `AGENTS.md`.

## Classification

### Keep as source of truth (unchanged)

| Doc                                                                                                                                     | Why                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `docs/AGENT_START_HERE.md`                                                                                                              | Session entry point; source-of-truth map, drift table, env truth. Verified 2026-06-10, still accurate.          |
| `docs/SYSTEM_DESIGN.md`                                                                                                                 | Architecture, domain flows, UI layer model. Accurate.                                                           |
| `docs/README.md`                                                                                                                        | Docs index. **Updated** this pass to index the new agent layer.                                                 |
| `docs/architecture/*.html` (12 pages + index)                                                                                           | Deep-dive references; all internal links resolve; content matches code (incl. "AI execution disabled" framing). |
| `docs/features/API.md`, `ADMIN.md`, `AI_GOVERNANCE.md`, `DESIGN_SYSTEM.md`                                                              | Current feature references; each verified against code by the June pass and re-checked here.                    |
| `docs/operations/SETUP.md`, `PRODUCTION_CHECKLIST.md`, `OPERATIONS_RUNBOOK.md`, `PRIVACY_RETENTION_SUPPORT.md`, `AI_DISCOVERABILITY.md` | Operational truth; Paddle mentions are correct historical migration guidance, not stale claims.                 |
| `docs/strategy/ENHANCEMENT_PLAN.md`, `ENTERPRISE_PLACEHOLDERS.md`                                                                       | Honest roadmap + principled deferral list; statuses re-verified 2026-06-10.                                     |
| Root `PRODUCT.md`, `DESIGN.md`                                                                                                          | Brand/positioning and distilled design language; both match the shipped Paper of Record landing.                |

### Already archived (leave as is)

| Doc                                                                                | Status                 | Note                                                                                             |
| ---------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------ |
| `archive/implementation/PRODUCTIZATION_PLAN.md`                                    | `superseded`           | Pre-auth MVP plan; uses old AgentGate name (intentional history).                                |
| `archive/implementation/MERGE_MATE_ADOPTION_PLAN.md`                               | `shipped`/`historical` | AI review queue adoption; largely implemented.                                                   |
| `archive/reviews/LAUNCH_READINESS_REVIEW.md`                                       | `historical`           | Point-in-time audit (2026-05-02); its findings were addressed — never cite without re-verifying. |
| `archive/ui/UI_UX_IMPROVEMENT_PLAN.md`, `UI_REVAMP_PLAN.md`                        | `shipped`/`historical` | UI modernization plans; shipped.                                                                 |
| `archive/design/FABLE_LANDING_DIRECTIONS.md`, `FABLE_LANDING_DIRECTIONS_REVIEW.md` | `historical`           | Landing explorations; Paper of Record shipped 2026-07.                                           |

### Updated this pass

| File                       | Change                                                                                                                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md` (root)         | Rebuilt as the project operating guide: identity, principles, task→docs matrix, quality standards, guardrails, commands. Previously generic behavioral guidelines duplicated from `CLAUDE.md`. |
| `CLAUDE.md` (root)         | One-line pointer added to `AGENTS.md` (content otherwise untouched — it stays the behavioral-guidelines layer).                                                                                |
| `docs/README.md`           | New sections indexing `docs/agents/`, playbooks, `docs/agent-prompts/`, `docs/skills/`.                                                                                                        |
| `docs/AGENT_START_HERE.md` | Read order now includes root `AGENTS.md` and the agent layer.                                                                                                                                  |

### Created this pass

`docs/agents/` (this file, `REPO_KNOWLEDGE_MAP.md`, `PROJECT_QUALITY_BAR.md`, `FUTURE_AGENT_ONBOARDING.md`, `FABLE_PROJECT_SYSTEM_HANDOFF.md`, `playbooks/` ×7), `docs/agent-prompts/` (catalog + 12 prompts), `docs/skills/` (README + 10 specs). See `docs/README.md` for the index.

### Deleted

Nothing. No doc met the bar (clearly useless, duplicated, or misleading).

## Stale-Claim Sweep Results

- **Old product names** (`AgentGate`, `Auteur`, `agent-gate`): zero hits in current docs, `app/`, `lib/`, `public/`, or package files. Hits exist only in `docs/archive/` (intentional history) and one frozen migration name quoted in `database-architecture.html`.
- **Paddle:** all references are correct "migrated away, reconcile legacy subscribers" guidance — kept.
- **Support email:** current docs reference the `SUPPORT_EMAIL` env var; product surfaces use `support@mergeattest.com`. No `@gmail`, no `agentgate.local` outside the archive review that originally flagged it.
- **Traction/pricing claims:** none found; `AI_DISCOVERABILITY.md` maintains the "never invent" list and `llms.txt`/`ai-discovery.json` comply.
- **Launch posture:** every current doc consistently states free early access, dormant billing, and disabled AI execution.
- **Internal links:** spot-checked across SYSTEM_DESIGN, docs/README, architecture index — all resolve.

## Human-Review Items

1. **Architecture HTML pages carry maintenance cost.** Twelve hand-written HTML deep-dives will drift silently after feature work. Options: keep (they are genuinely good), or progressively fold into `SYSTEM_DESIGN.md`. Recommend: keep, but the `architecture-update` playbook now makes updating them an explicit step after structural changes.
2. **`public/llms-full.txt` re-verification cadence.** Long-form claims should be re-checked whenever features ship — the AI-discoverability playbook covers this, but a human should skim it before any public launch push.
3. **When paid billing returns**, `AGENT_START_HERE.md` launch posture, `entitlements.ts` free-flag notes, `/settings/billing` copy, and the discovery files must change together — flagged in the knowledge map's sensitive areas.

## Maintenance Rule Going Forward

This file is an audit **record** — do not grow it into a live index. When docs change, update `docs/README.md`; when a future audit runs, append a dated section here rather than rewriting history.
