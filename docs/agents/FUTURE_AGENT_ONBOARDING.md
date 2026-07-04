# Future Agent Onboarding

**Status:** `current`
**Last verified:** 2026-07-04

Five minutes of reading that saves an hour of discovery. If you read nothing else, read this, then `../AGENT_START_HERE.md`, then the root `AGENTS.md`.

## What This Product Is

**MergeAttest** — a GitHub-native control center that governs AI-assisted pull requests: explainable agent attribution, deterministic risk scoring, test-gap detection, repository rules, human approvals/attestations, and audit-ready compliance evidence. Free early access, **pre-customer**; paid billing and AI model execution exist in code but are intentionally dormant/disabled. The repo directory is still named `agent-gate` (old product name) — that's intentional; the product is MergeAttest.

## The Standard

Work here must pass [`PROJECT_QUALITY_BAR.md`](PROJECT_QUALITY_BAR.md). The two most-violated rules by fresh agents:

1. **No generic SaaS output.** The UI has a specific signature (blueprint OKLCH neutrals, hairline borders, Geist mono `tabular-nums`, no gradients). Read `DESIGN.md` + `docs/features/DESIGN_SYSTEM.md` before touching UI, and the `eastbase-premium-ui` skill if you're a Claude agent.
2. **No unsupported claims.** Never invent users, pricing, testimonials, certifications, or "AI-powered" value language — in code, copy, docs, or discovery files.

## Docs That Matter Most

| Read                                | When                                                                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `docs/AGENT_START_HERE.md`          | Every session — source-of-truth map, env truth, drift table                                                                  |
| Root `AGENTS.md`                    | Every session — operating rules, task→docs matrix, guardrails                                                                |
| `docs/agents/REPO_KNOWLEDGE_MAP.md` | Every session — routes, sensitive areas, repo gotchas                                                                        |
| `docs/SYSTEM_DESIGN.md`             | Before UI or structural changes                                                                                              |
| `docs/agents/playbooks/<task>.md`   | When your task matches one (landing, launch polish, content, discoverability, security review, architecture docs, marketing) |

## Common Mistakes to Avoid

- Running bare `pnpm build` locally (fails without `GITHUB_*` placeholders) or repo-wide `pnpm format:check` on Windows (CRLF drift) — scope prettier to your files.
- Writing Next.js from memory — this is Next 16; check `node_modules/next/dist/docs/`.
- Changing a page layout without updating its `loading.tsx` skeleton.
- Adding a Prisma query that reads across orgs outside `lib/admin/` — that's the tenancy boundary.
- "Cleaning up" dormant billing code or re-gating the free plan's flags — the launch posture is deliberate.
- Treating `docs/archive/` as current truth, or citing the 2026-05 launch review without re-verifying in code.
- Auth flows on a port other than 3000 (`INVALID_ORIGIN`); empty `DATABASE_URL` gives a no-login demo mode for UI checks.

## Choosing a Prompt / Playbook

Start at [`../agent-prompts/README.md`](../agent-prompts/README.md) — the catalog maps each prompt to its use case, model tier, risk level, and required docs. Playbooks (`playbooks/`) are the durable method; prompts (`../agent-prompts/`) are the copy/paste task briefs that reference them. If the task fits neither, follow the task→docs matrix in root `AGENTS.md`.

## Handing Off Work

Use [`../agent-prompts/handoff-after-major-task.md`](../agent-prompts/handoff-after-major-task.md): outcome first, files changed, checks run with real output, verified vs. assumed, commit hashes, human-only items flagged. Update the matching current doc when behavior changed durably; move shipped plans to `docs/archive/`.

## Human-Only (never attempt, always flag)

Domain/DNS, live payments or enabling `ENABLE_PAID_BILLING` in production, production secrets, email sender verification, legal sign-off, publishing to social/directories, enabling AI review model execution, production DB mutations.
