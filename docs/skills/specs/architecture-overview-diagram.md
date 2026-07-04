# Skill Spec: mergeattest-architecture-sync

**Status:** `current` spec (2026-07-04) — not yet converted to a skill.

**Purpose:** keep MergeAttest's unusually deep architecture reference truthful after feature/service changes — `docs/SYSTEM_DESIGN.md`, the 12 HTML deep-dives under `docs/architecture/`, and the source-of-truth/drift maps in `docs/AGENT_START_HERE.md`.

**When to use:** after merges touching routes/APIs, `prisma/schema.prisma`, env vars, auth/billing/security behavior, jobs, integration boundaries, or launch posture; when drift is spotted between an architecture doc and code.

**When not to use:** behavior-preserving refactors; copy changes; creating brand-new architecture docs for speculative systems (document what exists).

**Required inputs:** the change to document (PR summary or commit range); if omitted, derive from `git log` since docs' last-verified dates.

**Required project docs:** `docs/agents/playbooks/architecture-update.md` (the method, incl. the doc-set table and the launch-posture must-change-together set), `docs/SYSTEM_DESIGN.md`, `docs/architecture/index.html`.

**Workflow:**

1. Diff-driven scoping: touched areas → affected docs (usually SYSTEM_DESIGN + 1–2 HTML pages + AGENT_START_HERE rows).
2. Verify every claim against code — real paths, env names, routes; no memory-based writing.
3. Edit the smallest truthful delta; match each HTML page's existing structure and visual conventions; bump "last verified" only where actually re-verified.
4. Cascade: `AGENT_START_HERE.md` map + env table; `docs/agents/REPO_KNOWLEDGE_MAP.md` routes/sensitive areas; `docs/README.md` summaries only if doc scope changed.
5. Launch-posture changes trigger the full must-change-together set (posture paragraph, billing/AI HTML pages, billing copy, ops docs, discovery files) — partial updates are failures.
6. Record drift resolved/found in the drift table.

**Expected outputs:** updated docs matching code; drift table current; dates honest.

**Files likely created/updated:** `docs/SYSTEM_DESIGN.md`, `docs/architecture/*.html`, `docs/AGENT_START_HERE.md`, `docs/agents/REPO_KNOWLEDGE_MAP.md`.

**Checks to run:** internal links resolve; HTML renders in a browser; scoped prettier (Markdown only — leave HTML formatting to match its file).

**Safety boundaries:** docs only — no code changes; no aspirational documentation; no pushes.

**Final report format:** docs touched → behavior change each reflects; drift found vs. resolved; dates bumped; commit hash.

**Example invocation prompt:** "Sync the MergeAttest architecture docs for the CI check-run ingestion feature that just merged (commits abc123..def456)."
