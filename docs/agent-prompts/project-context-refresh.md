# Prompt: Project Context Refresh

Copy/paste after major changes have landed (or after a long gap) to re-verify the docs against code and update the agent layer. Best run by a high-judgment model.

---

You are working in the MergeAttest repository (repo dir `agent-gate` — the old name, kept intentionally). MergeAttest is a GitHub-native SaaS control center that governs AI-assisted pull requests: explainable agent attribution, deterministic risk scoring, test-gap detection, repository rules, human approvals/attestations, and audit-ready compliance evidence. Stage: free early access, pre-customer; paid billing dormant (`ENABLE_PAID_BILLING`); AI review model execution disabled.

**Goal:** re-verify the documentation layer against current code and bring it back to truth, so future agents inherit accurate context.

**Required reading (in order):** `docs/AGENT_START_HERE.md`, root `AGENTS.md`, `docs/agents/REPO_KNOWLEDGE_MAP.md`, `docs/README.md`, `docs/agents/playbooks/architecture-update.md`.

**Scope boundaries:** documentation and metadata only — no feature code changes, no refactors, no dependency changes. If you find a code bug, report it; don't fix it here.

**Tasks:**

1. `git log --oneline -30` — identify what shipped since the docs' "last verified" dates.
2. For each shipped change, check the affected docs via the source-of-truth map in `AGENT_START_HERE.md`; verify claims against code (routes, env vars, schema, launch posture, integrations).
3. Update drifted **current** docs; bump "Last verified" dates only on docs you actually re-checked.
4. Verify the launch-posture paragraph in `AGENT_START_HERE.md` still matches `lib/entitlements.ts`, `lib/env.ts`, and the billing/AI gating in code.
5. Check `docs/agents/REPO_KNOWLEDGE_MAP.md` routes/commands/gotchas against `app/` and `package.json`.
6. Confirm public discovery files (`public/llms*.txt`, `ai-discovery.json`) still match shipped behavior.
7. Move any newly-shipped plan docs to `docs/archive/` and update `docs/README.md`.
8. Append a dated section to `docs/agents/DOCS_AUDIT_AND_CLEANUP.md` recording what you found and changed (do not rewrite prior sections).

**Quality bar:** `docs/agents/PROJECT_QUALITY_BAR.md` documentation section — no doc left describing behavior the code doesn't have; one current source of truth per area.

**Safety:** no production services or data; never print or commit secrets; no unsupported claims added anywhere; flag anything requiring human judgment (legal copy, launch-posture changes).

**Checks:** `pnpm exec prettier --write <files you touched>` (do not run repo-wide format on Windows); verify internal links you touched resolve.

**Git:** commit as `docs: refresh project context against code (<date>)`. Do not push.

**Final report:** outcome first; drift found (doc → stale claim → fix); docs updated with dates bumped; archive moves; discovery-file status; anything flagged for human review; commit hash.
