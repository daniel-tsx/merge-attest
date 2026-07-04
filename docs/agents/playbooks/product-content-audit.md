# Playbook: Product Content Audit

**Status:** `current` (2026-07-04)
**Scope:** reviewing and updating every word the outside world (or a signed-in user) reads — landing, app microcopy, legal, metadata, discovery files. Not a redesign; copy changes ride the existing structure.

## Read First

`PRODUCT.md` (voice + anti-references), `lib/site.ts` (canonical strings), `components/marketing/content.ts` (landing copy), `docs/operations/AI_DISCOVERABILITY.md` ("never invent" list), `docs/agents/PROJECT_QUALITY_BAR.md` copy section.

## The Voice

Operational, exact, governance-oriented. Mechanisms over adjectives: say _"weighted attribution signals with evidence"_, not _"intelligent detection"_. The reader is a skeptical engineer/compliance owner; hype reads as a red flag to them. Free early access — pricing language is limited to "free early access, no public pricing yet".

## Audit Surfaces, In Order

1. **Positioning spine:** `lib/site.ts` (title, description, keywords) — every other surface must agree with it.
2. **Hero + landing sections:** `components/marketing/content.ts`, `app/page.tsx` — hero says what it is and for whom in one pass; sections show mechanisms (`#record`, `#method`, `#live`, `#evidence`).
3. **FAQ:** answers must match shipped behavior — especially "is AI reviewing my code?" (queue exists, model execution disabled) and data handling (metadata + changed file paths, not full source).
4. **Pricing/plan copy:** `/settings/billing`, `/settings/usage` — free plan limits stated truthfully from `lib/entitlements.ts`.
5. **App microcopy:** empty states, onboarding checklist, toasts, error messages — product voice, next-action oriented.
6. **Trust/legal:** `/privacy`, `/terms` vs. `docs/operations/PRIVACY_RETENTION_SUPPORT.md`; support email `support@mergeattest.com`; substantive legal edits get flagged for human review.
7. **SEO metadata + JSON-LD:** `lib/seo/**`, `app/opengraph-image.tsx` — same claims as the page.
8. **Discovery files:** `public/llms.txt`, `llms-full.txt`, `ai-discovery.json` — same claims again.

## Claim Rules (hard)

- No invented traction, customers, testimonials, logos, or guarantees — anywhere, including placeholders.
- No compliance **certification** claims. Correct: "exports evidence that supports EU AI Act human-oversight and SOC2 reviews." Wrong: "SOC2 certified", "EU AI Act compliant".
- No live-AI-review claims while model execution is disabled; no paid-plan language while billing is dormant.
- No non-GitHub integration claims (GitHub is the only SCM).
- When shipped behavior and copy disagree, fix the copy the same day — or flag it as a launch blocker.

## Method

Inventory each surface → check against `lib/site.ts` and code truth → classify each finding (wrong claim / stale / off-voice / inconsistent) → fix in the copy's **source** (content.ts / site.ts / page component), never fork strings → re-check cross-surface parity.

## Verify

`pnpm lint && pnpm typecheck`; render pages in the browser (both themes) to catch overflow from copy-length changes; scoped prettier. If metadata changed, view source to confirm the rendered `<head>`.

## Output

Findings table (surface, before → after, reason), claim-safety confirmation, surfaces left untouched and why, human-review flags (legal), per `docs/agent-prompts/handoff-after-major-task.md`.
