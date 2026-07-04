# Prompt: Architecture Overview Update

Copy/paste after feature/service changes to bring the architecture docs back to truth. Sonnet-tier for scoped updates; Opus-tier if structure genuinely changed.

---

You are working in the MergeAttest repository — Next.js 16 App Router, Prisma 7/PostgreSQL, Better Auth, GitHub App integration, dormant Lemon Squeezy billing, OpenRouter BYOK (execution disabled). The repo has a deep architecture reference: `docs/SYSTEM_DESIGN.md` + 12 HTML deep-dives under `docs/architecture/` + the source-of-truth map in `docs/AGENT_START_HERE.md`.

**Goal:** update the architecture docs so they match the code as it is today — nothing more.

**Required reading:** `docs/agents/playbooks/architecture-update.md` (the method — follow it), `docs/SYSTEM_DESIGN.md`, `docs/architecture/index.html`.

**Recent changes to document:** <paste the feature/PR summary or commit range here; if omitted, derive from `git log` since the docs' last-verified dates>

**Scope boundaries:** documentation only. Match the existing HTML pages' structure and visual conventions when editing them; edit affected sections, don't rewrite pages. No code changes.

**Tasks:**

1. Scope from the diff: list touched areas → map to docs (SYSTEM_DESIGN + relevant `*-architecture.html` + AGENT_START_HERE rows).
2. Verify every claim you write against code — real paths, real env var names, real route paths.
3. Update the affected sections; bump "last verified" dates only where you actually re-verified.
4. Cascade: `AGENT_START_HERE.md` source-of-truth map + env table; `docs/agents/REPO_KNOWLEDGE_MAP.md` if routes/sensitive areas changed; `docs/README.md` summaries only if doc scope changed.
5. If the change touched launch posture (billing gate, AI execution, free-plan flags), update the full must-change-together set listed in the playbook — a partial update is a failure.
6. Record resolved or newly-found drift in the `AGENT_START_HERE.md` drift table.

**Quality bar:** documentation section of `docs/agents/PROJECT_QUALITY_BAR.md` — no doc describing behavior the code doesn't have.

**Safety:** no production touches; no secrets; no pushes.

**Checks:** internal links resolve; HTML pages render in a browser; scoped prettier on Markdown only.

**Git:** commit as `docs: update architecture references for <change>`. Do not push.

**Final report:** docs touched and the behavior change each reflects; drift found vs. resolved; dates bumped; commit hash.
