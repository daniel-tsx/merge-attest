# Prompt: Handoff After Major Task

Copy/paste at the end of any major task (or give to an agent mid-task) to produce a consistent handoff. Any model tier.

---

You are finishing a significant task in the MergeAttest repository. Produce a handoff that lets the owner — and the next agent — pick up with zero re-discovery.

**Goal:** an honest, complete handoff in the format below, plus the doc updates the task obligates.

**Required reading:** `docs/AGENT_START_HERE.md` "Before Ending Task Checklist", root `AGENTS.md` §2 (principles 8–10).

**Tasks:**

1. Run the checklist: behavior matches code truth; relevant tests pass; current docs updated if routes/env/schema/billing/auth/user-visible behavior changed; shipped plans moved to `docs/archive/` with `docs/README.md` updated; links fixed; no secrets; `.env.example` current.
2. Re-run the checks relevant to your changes and capture real output (`pnpm lint`, `pnpm typecheck`, scoped `pnpm exec vitest run tests/...`, `pnpm build` with `GITHUB_*` placeholders if build-relevant).
3. Write the handoff (below). If the task spanned multiple sessions or agents, consolidate — one handoff, not a log.

**Handoff format:**

```markdown
## Handoff: <task name> (<date>)

**Outcome:** <one sentence — what is true now that wasn't before>

**Changed:** <file → why, grouped; commit hashes>

**Checks:** <command → result, real output for failures>

**Verified vs. assumed:** <what you confirmed in browser/tests vs. what you believe but didn't verify>

**Docs updated:** <which current docs, what changed; archive moves>

**Known issues / deferred:** <with severity and where they live>

**Human-only items:** <anything requiring the owner: production env, legal review, publishing, DNS, payments>

**Next steps:** <ordered, each starting with the prompt/playbook that fits it>
```

**Quality bar:** handoff section of `docs/agents/PROJECT_QUALITY_BAR.md` — outcome first; failures shown with output; "verified" strictly separated from "assumed".

**Safety:** no secrets in the handoff; don't mark human-only items as done.

**Git:** if work is uncommitted, commit in logical units with conventional messages before writing the handoff. Do not push.

**Final report:** the handoff itself is the report. If the task changed durable behavior, also append a dated note to the relevant current doc rather than leaving truth only in the handoff.
