# Skill Spec: mergeattest-handoff

**Status:** `current` spec (2026-07-04) — not yet converted to a skill.

**Purpose:** produce the standard MergeAttest end-of-task handoff — outcome-first, honest about verified vs. assumed, with the doc updates the task obligates — so the owner and the next agent inherit zero re-discovery work.

**When to use:** automatically at the end of any major task (multi-file changes, behavior changes, launch-adjacent work); when consolidating multi-session work; when the owner asks "where did we land?".

**When not to use:** trivial single-file fixes (a normal task summary suffices); as a substitute for updating current docs (the handoff points at doc updates, it doesn't replace them).

**Required inputs:** the task's changes (from the session or a commit range); check results if already run.

**Required project docs:** `docs/agent-prompts/handoff-after-major-task.md` (the format — authoritative), `docs/AGENT_START_HERE.md` "Before Ending Task Checklist", `docs/agents/PROJECT_QUALITY_BAR.md` handoff section.

**Workflow:**

1. Run the before-ending checklist: code truth honored; relevant tests pass; current docs updated for durable behavior changes; shipped plans archived + `docs/README.md` updated; links fixed; no secrets; `.env.example` current.
2. Re-run checks relevant to the changes; capture real output for anything that fails.
3. Commit uncommitted work in logical units (never push).
4. Write the handoff in the standard format: Outcome / Changed / Checks / Verified vs. assumed / Docs updated / Known issues / Human-only items / Next steps (each next step naming the prompt or playbook that fits it).

**Expected outputs:** one consolidated handoff (not a session log); obligated doc updates applied.

**Files likely created/updated:** current docs the task obligates; the handoff itself lives in the task output (only write a handoff file if the owner asks for a durable one).

**Checks to run:** whichever the changes demand — `pnpm lint`, `pnpm typecheck`, scoped vitest, `pnpm build` with `GITHUB_*` placeholders when build-relevant.

**Safety boundaries:** no secrets in the handoff; human-only items never marked done; failures reported with output, never smoothed over.

**Final report format:** the handoff format itself (see the prompt file).

**Example invocation prompt:** "Generate the handoff for the team-invites feature work we just finished — commits def456..abc789, tests already green."
