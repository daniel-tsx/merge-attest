# AI Authorship Governance

**Status:** `current`
**Last verified:** 2026-06-04 (code verified against repo)

Auteur's differentiator is being the **system of record for AI authorship** — answering
_which AI agent wrote this change, how confident are we, and what is the evidence_. This doc
covers the **Agent Attribution Engine** and **Agent Identity Registry** (Phase A of the
AI-authorship governance suite).

## What it does

Every synced pull request is attributed to an agent (`cursor`, `codex`, `claude_code`,
`copilot`, `devin`, `unknown`, or `manual`) with:

- a **confidence score** (0–100), and
- an **evidence trail** — the specific signals that drove the determination.

This replaces the previous naive substring guess with weighted, explainable detection, in line
with the "keep signals explainable" product principle.

## Attribution engine

Source of truth: [`lib/agents/attribution.ts`](../../lib/agents/attribution.ts) — a pure,
unit-tested module (`tests/attribution.test.ts`).

`attributeAgent(input)` collects evidence from, in descending weight:

| Signal           | Weight | Source                                                         |
| ---------------- | ------ | -------------------------------------------------------------- |
| `commit_trailer` | 95     | `Co-Authored-By:` lines / generator markers in commit messages |
| `bot_account`    | 88     | author/commit account login (e.g. `copilot-swe-agent[bot]`)    |
| `email_domain`   | 80     | author/committer email (e.g. `@anthropic.com`, `@cursor.sh`)   |
| `branch_prefix`  | 55     | branch like `claude/`, `cursor/`, `codex/`, `devin/`           |
| `label`          | 50     | PR labels (via registry rules)                                 |
| `title_keyword`  | 30     | agent name mentioned in the PR title                           |
| `registry_rule`  | 52–96  | organization registry rule (authoritative, see below)          |

Selection rules:

- Named-agent evidence outranks generic bot signals (an `agent/` branch alone → `unknown`).
- The winning agent is the one with the strongest single signal (ties broken by total weight).
- `confidence` is the winning agent's strongest signal weight.
- No signals → `manual`, `aiAssisted = false`, confidence `0`.

Built-in fingerprints match how Claude Code, GitHub Copilot, Cursor, Devin, and OpenAI Codex
tag commits and accounts today.

## Agent Identity Registry

Admins map their own signals to agents at **Settings → Agent registry** (`/settings/agents`,
owner/admin only). Custom identity rules are included during free early access; built-in
detection also runs for every workspace.

- Model: `AgentIdentityRule` (org-scoped) — `matchType` (`bot_login`, `email_domain`,
  `branch_prefix`, `label`, `commit_trailer`), `pattern`, `agentSource`, `enabled`.
- Registry rules are **authoritative**: they weigh slightly above the equivalent built-in signal.
- CRUD is via server actions ([`app/settings/agents/actions.ts`](../../app/settings/agents/actions.ts))
  with role + entitlement checks and `agent_identity_rule_changed` audit events.

## Persistence & data flow

- `PullRequest.attributionConfidence` (Int) and `PullRequest.attributionEvidence` (JSON) store
  the result; migration `20260604090000_agent_attribution`.
- [`lib/github-sync.ts`](../../lib/github-sync.ts) fetches PR commits
  (`listGitHubPullRequestCommits`), loads enabled registry rules, runs `attributeAgent`, and
  persists `agentSource`, `aiAssisted`, confidence, and evidence on upsert.
- Reads flow through [`lib/data/app-data.ts`](../../lib/data/app-data.ts)
  (`mapPullRequest`, `listAgentIdentityRules`) with demo fallback.

## UI surfaces

- **PR detail** — `AttributionPanel` ([`components/app/attribution-panel.tsx`](../../components/app/attribution-panel.tsx))
  shows the agent badge, a confidence meter, and the evidence list.
- **Settings → Agent registry** — built-in detection reference + custom rule management.
- **Reports** (`/reports`) — per-agent trust scorecard (see below).
- `AgentBadge` lives in [`components/app/status-badge.tsx`](../../components/app/status-badge.tsx).

## Per-agent trust scorecard

Source of truth: [`lib/agents/scorecard.ts`](../../lib/agents/scorecard.ts) (pure,
`tests/scorecard.test.ts`), rendered at `/reports`
([`app/reports/page.tsx`](../../app/reports/page.tsx)).

`buildAgentScorecards(pullRequests)` groups attributed PRs by agent and computes a
deterministic, explainable **trust score** (starts at 100; deductions are shown):

| Deduction               | Max points | Derived from                                               |
| ----------------------- | ---------- | ---------------------------------------------------------- |
| High-risk PRs           | 30         | share of PRs at `high`/`critical` risk                     |
| Test gaps               | 20         | share of PRs with a test-gap status                        |
| Rule violations         | 20         | share of PRs with ≥1 rule violation                        |
| Reverted                | 20         | merged PRs referenced by a later revert PR (`Revert … #N`) |
| Merged without sign-off | 10         | merged PRs without an `approved`/`risk_accepted` decision  |

Reverts and "merged without sign-off" are deterministic proxies, labeled as such — not
incident telemetry. Scorecards sort riskiest-first (lowest trust). No extra query: metrics
derive from the already-loaded org pull request list.

## AI authorship ledger + compliance evidence

Source: `buildAuthorshipLedger()` in [`lib/reporting.ts`](../../lib/reporting.ts) and
[`lib/compliance-export.ts`](../../lib/compliance-export.ts); surfaced at `/reports` and
exported via `GET /api/compliance/authorship/export?format=csv|json`.

- **Ledger** — AI-authored share by PR count and by added-line volume, the per-agent
  breakdown, review coverage (merged AI work with vs without a human `approved`/`risk_accepted`
  decision), and an AI-authored-share trend. Counts are PR- and line-volume based, **not**
  intra-file blame — UI/export copy states this.
- **Export** — owner/admin only, gated by the `auditExport` entitlement and the
  plan retention window (`getAuditRetentionStart`). `csv` = per-agent ledger; `json` = an
  evidence bundle (summary, per-agent, per-PR attribution rows) carrying a modest notice:
  "supporting EU AI Act human-oversight / SOC2 review — not a certification." Each
  download records an `AuditExport` row and returns private, non-cacheable response headers.

Tests: `tests/authorship.test.ts`, `tests/scorecard.test.ts`, `tests/attribution.test.ts`.

## Human-accountability gate

Source: [`lib/attestation.ts`](../../lib/attestation.ts) (pure, `tests/attestation.test.ts`),
recorded in the approval server action ([`app/pull-requests/actions.ts`](../../app/pull-requests/actions.ts)),
shown on the PR detail page via `AccountabilityPanel`.

- A repository rule with action **`require_human_attestation`** (trigger `ai_assisted`; built-in
  template "AI-authored PRs require human sign-off") marks AI-authored PRs as needing a named
  human to take responsibility before merge.
- Reviewers check "I take responsibility…" when they **approve** or **accept risk**; that writes
  an immutable `Attestation` (reviewer, statement, attributed agent + confidence snapshot, head
  SHA), a `human_attestation_recorded` audit event, and — when `githubComments` is entitled — a
  best-effort **"Auteur Accountability"** GitHub check run.
- `pullRequestRequiresAttestation()` derives the required state from the PR's fired rules; any
  AI-authored PR can also carry a voluntary sign-off. Non-AI PRs show no panel.

This targets the trust gap directly: not "did a bot review it" but "which human is accountable
for this AI-authored change," recorded for audit.

## Status

Phases A–D of the AI-authorship governance suite are shipped: attribution engine + registry,
per-agent trust scorecard, authorship ledger + compliance export, and the human-accountability
gate. See [`../strategy/ENHANCEMENT_PLAN.md`](../strategy/ENHANCEMENT_PLAN.md) for broader roadmap.
