# Playbook: Marketing Assets

**Status:** `current` (2026-07-04)
**Scope:** preparing launch/marketing material — screenshots, OG concepts, social drafts, blog angles. Agents **draft**; a human publishes. Nothing in this playbook authorizes posting anywhere.

## Read First

`PRODUCT.md` (voice, anti-references), `lib/site.ts` (canonical one-liner), `docs/strategy/ENHANCEMENT_PLAN.md` (what's actually shipped), `docs/agents/PROJECT_QUALITY_BAR.md` copy rules. For long-form: the `eastbase-blog-post` skill (Claude agents).

## Ground Rules

- Every asset shows **real product surfaces** with honest data. Demo mode (empty `DATABASE_URL`) provides a realistic populated dataset — use it; never fabricate metrics that imply real customers.
- Free early access posture in every asset; no pricing, no testimonials, no "trusted by".
- The audience (engineering/compliance leads) rewards specificity: "attributes PRs to Cursor/Copilot/Claude Code with evidence" beats "govern your AI development".

## Product Hunt / Directory Screenshots

1. Run demo mode; both themes exist but pick one per set for coherence (dark shows the control-room signature best).
2. Shot list: dashboard (governance posture), PR detail (attribution evidence + risk breakdown), reports (trust scorecards + authorship ledger), rules page, audit log. Landing hero last.
3. Capture at 1270×760 (PH) or the target's spec; tidy browser chrome; no personal data.
4. On this machine, `preview_screenshot` can be unreliable — scroll position matters (avoid exact max scroll) and prefer stable viewport captures; a human may need to take final shots. Flag if so.

## OG Image Concepts

Current OG is generated in `app/opengraph-image.tsx`. Concepts must use the blueprint palette, GateScan/seal mark, mono micro-labels — a record/ledger visual, not an abstract gradient. Deliver as concept description + rough layout; implement only if asked.

## Social Post Drafts (X / LinkedIn)

- Lead with the problem (agent PR volume outpacing review; auditors asking for AI-authorship evidence), then the mechanism, then the free-early-access invite.
- X: single crisp claim + screenshot. LinkedIn: short build-in-public narrative. Both: zero hype adjectives, no invented numbers, no engagement-bait.
- Deliver as drafts in the task output or a scratch doc — **never post**.

## Blog Angles

Product-led, honest, useful-without-buying (see `docs/agent-prompts/blog-series-for-product.md` for the series prompt). Strong angles: why deterministic risk scoring beats LLM vibes for governance; how agent attribution evidence actually works (trailers, bot accounts, emails, branches); what EU AI Act human-oversight means for a dev team; building an attestation gate.

## Reddit-Safe Discussion Angles

Only genuine-discussion framing for r/ExperiencedDevs / r/devops-type audiences: "how are teams tracking which PRs agents wrote?" with the product mentioned honestly as what we're building, disclosure included. No astroturfing, no fake questions from alt framings. Draft only; human decides whether/where to post.

## Lemon Squeezy Store Images

Not applicable while billing is dormant. When paid plans return, follow the screenshot rules above with plan-accurate copy.

## Output

Asset inventory (file/draft, intended channel, claims used), confirmation every claim maps to shipped behavior, and the explicit human-only list (publishing, account access, final screenshots if tooling blocked), per `docs/agent-prompts/handoff-after-major-task.md`.
