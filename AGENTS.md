# AGENTS.md — MergeAttest Operating Guide

The operating guide for any coding agent (Claude Code, Cursor, Codex, or another Fable/Opus/Sonnet session) working in this repository. `CLAUDE.md` carries the generic behavioral guidelines; this file carries everything project-specific. When they overlap, this file wins.

## 1. Project Identity

**MergeAttest** (mergeattest.com) is a GitHub-native SaaS control center for engineering teams shipping AI-assisted code. It attributes every pull request to the coding agent that wrote it (confidence + evidence), scores risk **deterministically** (rule-based, no LLM), detects missing tests, evaluates repository rules, records human approvals and attestations, and exports audit-ready evidence for EU AI Act human-oversight and SOC2 reviews.

- **For:** engineering leads, platform engineers, security/compliance owners. They distrust AI-washing; the product earns trust by showing deterministic mechanics, not by claiming intelligence.
- **Operator:** Eastbase Studio (https://www.eastbase.studio). Product support surface: `support@mergeattest.com`. Studio contact: `support@eastbase.studio`. Don't swap them.
- **Stage (2026-07):** free early access, **pre-customer**. No public pricing. Paid billing dormant behind `ENABLE_PAID_BILLING` (Lemon Squeezy code intact on purpose). AI review model execution intentionally disabled (queue durable, worker skips). Success metric: installed GitHub Apps and governed repositories.
- **Voice:** operational, exact, governance-oriented — "an engineering control room, not a friendly workspace editor." Evidence over claims; no hype adjectives.

## 2. Operating Principles

1. **Inspect before editing.** `git status` first; never overwrite work you didn't make. Read the required docs (matrix below) before coding.
2. **Trust code over docs.** If they disagree, surface the drift; update the current doc only when behavior changes durably.
3. **Surgical scope.** Every changed line traces to the task. No adjacent "improvements", no speculative abstractions, no broad refactors.
4. **No generic SaaS output.** This product has a specific signature (see §4 and the UI section). Stock shadcn/SaaS-template output is wrong here even when it "looks fine".
5. **No unsupported claims — anywhere.** Pre-customer product: never invent users, revenue, testimonials, logos, pricing, compliance certifications, or "AI-powered" claims. This applies to UI copy, docs, metadata, `llms.txt`, and placeholders.
6. **Production is off-limits** without explicit instruction in the current session: no live billing, no production DB mutations, no real webhooks, no domain/DNS.
7. **Never expose secrets.** Treat every `.env*` value as sensitive; never print or commit them; update `.env.example` when adding vars.
8. **Run the checks** relevant to the change (§6) and report results honestly — separate "verified" from "assumed".
9. **Commit when the task calls for it; never push** unless explicitly instructed.
10. **Leave a trail.** Update the matching current doc when routes, env vars, schema, billing/auth/security, or user-visible behavior change; follow `docs/agent-prompts/handoff-after-major-task.md` for large tasks.

## 3. Required Reading by Task

Always: `docs/AGENT_START_HERE.md` + `docs/agents/REPO_KNOWLEDGE_MAP.md`. Then:

| Task                      | Read before starting                                                                                                                             | Playbook / prompt                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Landing redesign / polish | `PRODUCT.md`, `DESIGN.md`, `docs/features/DESIGN_SYSTEM.md`, `app/page.tsx`, `lib/site.ts`                                                       | `docs/agents/playbooks/landing-redesign.md`           |
| Launch polish             | `docs/operations/PRODUCTION_CHECKLIST.md`, `docs/agents/PROJECT_QUALITY_BAR.md`, legal pages                                                     | `docs/agents/playbooks/final-launch-polish.md`        |
| Feature work              | `docs/SYSTEM_DESIGN.md`, relevant `docs/features/*`, `prisma/schema.prisma`, matching `tests/*`                                                  | —                                                     |
| UI / dashboard work       | `docs/SYSTEM_DESIGN.md`, `docs/features/DESIGN_SYSTEM.md`, `app/globals.css`, `eastbase-premium-ui` skill                                        | `docs/agent-prompts/feature-polish.md`                |
| Security / access review  | `docs/SYSTEM_DESIGN.md` security model, `proxy.ts`, `lib/auth*`, `lib/data/app-data.ts`, `docs/features/ADMIN.md`, `docs/features/API.md`        | `docs/agents/playbooks/security-and-access-review.md` |
| Content / copy update     | `PRODUCT.md`, `components/marketing/content.ts`, `lib/site.ts`, `docs/operations/AI_DISCOVERABILITY.md`                                          | `docs/agents/playbooks/product-content-audit.md`      |
| AI-agent visibility / SEO | `docs/operations/AI_DISCOVERABILITY.md`, `public/llms*.txt`, `public/ai-discovery.json`, `app/{robots,sitemap}.ts`, `lib/seo/**`                 | `docs/agents/playbooks/ai-agent-discoverability.md`   |
| Billing / pricing         | `docs/architecture/billing-and-entitlements-architecture.html`, `lib/{billing,plans,entitlements}.ts`, `docs/AGENT_START_HERE.md` launch posture | — (billing changes need explicit owner instruction)   |
| Architecture doc update   | `docs/SYSTEM_DESIGN.md`, `docs/architecture/index.html`                                                                                          | `docs/agents/playbooks/architecture-update.md`        |
| Blog / marketing          | `PRODUCT.md`, `docs/strategy/ENHANCEMENT_PLAN.md`, `eastbase-blog-post` skill if available                                                       | `docs/agents/playbooks/marketing-assets.md`           |

## 4. Quality Standards

The full bar with pass/fail examples: `docs/agents/PROJECT_QUALITY_BAR.md`. In short, good work here means:

- Copy is product-specific, exact, and claim-safe; the page itself feels audited.
- UI carries the MergeAttest signature: blueprint palette (cool indigo OKLCH neutrals, one restrained accent), Geist Sans/Mono with `tabular-nums`, Fraunces only for marketing ceremony, hairline borders and dot-grid atmosphere, **no gradient backgrounds**, design tokens from `app/globals.css` — never raw palette classes.
- Empty/loading/error states are designed surfaces; skeletons match their real layouts.
- Responsive verified in the browser; visible focus rings; `prefers-reduced-motion` respected; decorative icons `aria-hidden`.
- Server-side enforcement for anything private: org-scoped reads via `lib/data/app-data.ts`, entitlements via `lib/entitlements.ts`, never client-side-only checks.
- Deterministic features stay deterministic — don't quietly introduce LLM calls into risk/rules/attribution paths.

## 5. Safety & Commercial Guardrails

**Human-only (flag, never attempt):** domain/DNS, live payment setup or real payments, production secrets rotation, email sender verification, legal sign-off, publishing to social/directories, enabling `ENABLE_PAID_BILLING` in production, enabling AI review model execution.

**Explicit-instruction-only:** production DB migrations or data mutations, changes to attribution signal weights / scorecard / attestation semantics, compliance-export format changes, deleting or re-gating billing code, changing plan limits in `lib/entitlements.ts`.

**Sensitive code (change with care + tests):** `proxy.ts`, `lib/auth*`, `lib/data/app-data.ts` scoping, `lib/admin/**` boundary (the only cross-org reader), webhook signature verification, `lib/job-auth.ts`, `lib/retention.ts`, `prisma/migrations/` (append-only).

**Security work is defensive.** Frame it as access-control review, ownership validation, webhook integrity, rate-limit review, private-data protection, and negative-path authorization tests ("as org A, request org B's resource — expect rejection"). No offensive testing, no destructive verification.

## 6. Commands

```bash
pnpm install
pnpm dev            # localhost:3000 — auth flows require port 3000 (INVALID_ORIGIN otherwise)
pnpm lint
pnpm typecheck      # runs prisma generate first
pnpm test           # vitest run — scoped: pnpm exec vitest run tests/<file>
pnpm build          # needs GITHUB_* placeholder env vars locally (see knowledge map gotchas)
pnpm db:generate && pnpm db:migrate && pnpm db:seed   # dev database
pnpm format         # scope prettier to touched files — repo-wide format:check fails on Windows CRLF
```

CI (`.github/workflows/ci.yml`): lint → typecheck → test → audit → build. Match it before calling work done.

## UI work

For ANY user-facing UI in this repo — pages, components, charts, tables, and especially empty / loading / error states — read the `eastbase-premium-ui` skill (via the Skill tool) for the shared **method and house invariants**, then apply **this project's own signature**: `PRODUCT.md` (brand personality + anti-references), `DESIGN.md`, `docs/features/DESIGN_SYSTEM.md`, and the token source `app/globals.css`. The skill is the method; those docs are MergeAttest's implementation of it — the blueprint palette (cool navy + a single cyan accent), the GateScan mark, the engineering control-room metaphor, Geist Sans/Mono with mono `tabular-nums`, and the dot-grid / hairline atmosphere (no gradient backgrounds). Don't reproduce generic shadcn/SaaS defaults from memory, and never import a reference example's palette, metaphor, or components in place of this project's signature.

## Windows shell (Command Prompt)

**Prefer `cmd.exe` for all terminal commands on Windows** — not PowerShell.

| Do (cmd)                           | Don't (PowerShell)                           |
| ---------------------------------- | -------------------------------------------- |
| `cmd /c "cd /d path && pnpm test"` | `cd path; pnpm test`                         |
| `set FOO=bar && command`           | `$env:FOO = "bar"; command`                  |
| Chain with `&&`                    | Chain with `;` or pipelines when unnecessary |

Only use PowerShell when the user explicitly requests it. This repo includes `.vscode/settings.json` (automation profile → cmd) and `.cursor/rules/windows-cmd-shell.mdc`; if the agent shell still spawns PowerShell (a known Cursor Windows limitation), keep using cmd-compatible syntax anyway.

## Documentation as Working Memory

Use docs as durable project memory, but verify against code before acting.

- Before non-trivial work: `README.md`, `docs/AGENT_START_HERE.md`, plus the matrix row above.
- Treat docs as guidance, not absolute truth; code wins, surface mismatches.
- Update docs when changing architecture, routes/APIs, env vars, schema, billing/auth/security, testing commands, or user-visible behavior — not for incidental refactors.
- Every doc states its status: `current`, `planned`, `shipped`, `historical`, or `superseded`. One current source-of-truth doc per feature; completed plans move to `docs/archive/`.

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
