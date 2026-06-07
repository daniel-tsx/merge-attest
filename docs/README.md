# MergeAttest Documentation

**Status:** `current` — documentation index
**Last verified:** 2026-05-31

MergeAttest is a SaaS control center for engineering teams using AI coding agents. It monitors AI-assisted pull requests, scores risky changes, detects missing tests, evaluates repository rules, records approvals, and keeps an audit trail before code reaches production.

## Start Here

1. [`AGENT_START_HERE.md`](AGENT_START_HERE.md) — read every session (source-of-truth map, drift warnings, env vars, verification)
2. [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md) — architecture, domain flows, and UI layer model (read before UI or structural changes)
3. [`operations/SETUP.md`](operations/SETUP.md) — local setup, routes, and architecture
4. Task-specific docs from the folders below

Root [`README.md`](../README.md) has the quick start only.

## Folder Guide

| Folder                                 | Purpose                                                                                                                                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`architecture/`](architecture/)       | Deep-dive HTML architecture references (auth, database, governance, GitHub, jobs, billing, AI, frontend, security, ops) — start at [`architecture/index.html`](architecture/index.html) |
| [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md) | Cross-cutting architecture, domain flows, UI composition model                                                                                                                          |
| [`features/`](features/)               | Current feature and system reference docs                                                                                                                                               |
| [`operations/`](operations/)           | Setup, production, runbooks, privacy, and support                                                                                                                                       |
| [`strategy/`](strategy/)               | Roadmap and product direction that still guides decisions                                                                                                                               |
| [`archive/`](archive/)                 | Historical plans, reviews, and superseded documents — **not current truth**                                                                                                             |

## Current Docs

### Core

| Doc                                                  | Status    | Summary                                                        |
| ---------------------------------------------------- | --------- | -------------------------------------------------------------- |
| [`architecture/index.html`](architecture/index.html) | `current` | Architecture hub — links to all deep-dive HTML references      |
| [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md)               | `current` | Architecture layers, tenancy, domain flows, UI component model |
| [`AGENT_START_HERE.md`](AGENT_START_HERE.md)         | `current` | Agent session entry point and source-of-truth map              |

### Features

| Doc                                                      | Status    | Summary                                                               |
| -------------------------------------------------------- | --------- | --------------------------------------------------------------------- |
| [`features/API.md`](features/API.md)                     | `current` | HTTP endpoints: health, diagnostics, webhooks, billing, jobs, exports |
| [`features/ADMIN.md`](features/ADMIN.md)                 | `current` | Platform admin dashboard: gating, cross-tenant data, pages, actions   |
| [`features/AI_GOVERNANCE.md`](features/AI_GOVERNANCE.md) | `current` | Agent attribution engine and identity registry (AI authorship)        |
| [`features/DESIGN_SYSTEM.md`](features/DESIGN_SYSTEM.md) | `current` | UI tokens (`app/globals.css`), components, accessibility patterns     |

### Operations

| Doc                                                                                  | Status    | Summary                                         |
| ------------------------------------------------------------------------------------ | --------- | ----------------------------------------------- |
| [`operations/SETUP.md`](operations/SETUP.md)                                         | `current` | Stack, local dev, routes, module map            |
| [`operations/PRODUCTION_CHECKLIST.md`](operations/PRODUCTION_CHECKLIST.md)           | `current` | Pre-launch env and runtime checks               |
| [`operations/OPERATIONS_RUNBOOK.md`](operations/OPERATIONS_RUNBOOK.md)               | `current` | CI gate, scheduled jobs, incidents, retention   |
| [`operations/PRIVACY_RETENTION_SUPPORT.md`](operations/PRIVACY_RETENTION_SUPPORT.md) | `current` | Data stored, retention windows, support contact |

### Strategy

| Doc                                                                          | Status    | Summary                                     |
| ---------------------------------------------------------------------------- | --------- | ------------------------------------------- |
| [`strategy/ENHANCEMENT_PLAN.md`](strategy/ENHANCEMENT_PLAN.md)               | `current` | Active product roadmap and remaining gaps   |
| [`strategy/ENTERPRISE_PLACEHOLDERS.md`](strategy/ENTERPRISE_PLACEHOLDERS.md) | `current` | Explicitly deferred enterprise capabilities |

## Archived Docs

Do not implement from these without re-verifying against code.

### Implementation plans

| Doc                                                                                                        | Status                   | Notes                                                         |
| ---------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------- |
| [`archive/implementation/PRODUCTIZATION_PLAN.md`](archive/implementation/PRODUCTIZATION_PLAN.md)           | `superseded`             | Pre-auth MVP plan; baseline claims are outdated               |
| [`archive/implementation/MERGE_MATE_ADOPTION_PLAN.md`](archive/implementation/MERGE_MATE_ADOPTION_PLAN.md) | `shipped` / `historical` | AI review queue and OpenRouter adoption — largely implemented |

### Reviews

| Doc                                                                                        | Status       | Notes                                                        |
| ------------------------------------------------------------------------------------------ | ------------ | ------------------------------------------------------------ |
| [`archive/reviews/LAUNCH_READINESS_REVIEW.md`](archive/reviews/LAUNCH_READINESS_REVIEW.md) | `historical` | Point-in-time audit (2026-05-02); re-verify findings in code |

### UI plans

| Doc                                                                            | Status                   | Notes                                                      |
| ------------------------------------------------------------------------------ | ------------------------ | ---------------------------------------------------------- |
| [`archive/ui/UI_UX_IMPROVEMENT_PLAN.md`](archive/ui/UI_UX_IMPROVEMENT_PLAN.md) | `shipped` / `historical` | UI modernization plan; many phases landed in design system |

## Maintenance Rules

- One **current** source-of-truth doc per feature or operational area.
- Label doc status: `current`, `planned`, `shipped`, `historical`, or `superseded`.
- Update **current** docs when changing architecture, routes/APIs, env vars, schema, billing/auth/security, test commands, or user-visible behavior.
- Do not update docs for tiny refactors or obvious code-only changes.
- When a plan ships or a review goes stale, move it to `archive/` and update this index.
- If docs and code disagree, trust code and fix the **current** doc (see drift table in `AGENT_START_HERE.md`).
- Preserve archived docs as historical records; do not delete them.

## Quick Verification

```bash
pnpm lint
pnpm typecheck
pnpm exec vitest run tests
pnpm build
```

See [`AGENT_START_HERE.md`](AGENT_START_HERE.md) for env vars, scoped tests, and the before-ending-task checklist.
