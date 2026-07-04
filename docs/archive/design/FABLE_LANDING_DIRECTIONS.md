# Landing Page Design Directions

**Status:** `historical` — exploration complete. **Paper of Record** was
chosen and shipped as the production landing (2026-07-04); the preview routes
under `app/design-directions/` were removed when it shipped.
**Location:** `docs/archive/design/FABLE_LANDING_DIRECTIONS.md`
**Created:** 2026-07-04

This document defines three deliberately different landing page directions for
MergeAttest. Each direction changes the positioning angle, visual metaphor,
layout system, interaction style, and emotional tone — not just the palette.
All three keep the house rules: no linear-gradient decorative backgrounds, no
invented traction, reduced-motion-safe animation, and copy sourced from
verified product facts in `components/marketing/content.ts`.

## Context: what the current landing does and where it falls short

The production landing (`app/page.tsx`, "Blueprint Schematic") is a dark-only
technical canvas with cyan linework and an abstract pipeline schematic. It is
competent, but has structural weaknesses worth designing against:

1. **It shows a diagram, not the product.** The hero centerpiece is an
   abstract SVG schematic. The house standard says the hero's proof is the
   product itself.
2. **It splits the design system.** The `.mkt` scope defines its own hex
   palette and a marketing-only font (Sora), disconnected from the app's
   OKLCH tokens and Geist stack — "one design system on both sides of the
   signup wall" is violated.
3. **Dark-only, while the app is light-first.** A visitor who signs up lands
   in a light product that looks unrelated.
4. **Conventional structure under the skin.** Hero → chip strip → 4-stat
   grid → bento cards → 4 steps → FAQ → CTA banner is the standard SaaS
   flow; the stats strip restates facts styled as hero metrics.
5. **The positioning is feature-complete but story-thin.** It lists
   capabilities without committing to a single wedge (evidence? control?
   honesty?).

Each direction below commits to one wedge and designs the whole page around it.

---

## Direction 1 — Paper of Record

**Route:** `/design-directions/paper-of-record`

### Positioning angle

MergeAttest is the **system of record** for AI-assisted code. The product's
name is the pitch: Merge + _Attest_. Attestation is a notarial act — a witness
certifying a fact. This direction sells the artifact nobody else has: the
signed, exportable evidence record. "When the auditor asks who wrote this
code, you hand them the record."

### Target user feeling (first 5 seconds)

"These people keep serious records. This is the document my auditor will
accept." Calm, institutional confidence — the opposite of AI-tool hype.

### Visual metaphor

**A registry — a paper of record.** Ruled ledger hairlines, numbered clauses
(§01–§04), record fields set in mono, a circular attestation seal built from
the GateScan mark, marginalia-style micro-labels. The page reads like a
beautifully typeset public register, rendered with modern precision.

### Hero concept

Light editorial masthead. Left: an oversized serif headline in the voice of a
record ("Every AI pull request, on the record."), a measured lede, one ink
CTA. Right: the visual centerpiece — a rendered **attestation record** for the
sample PR: record number, repository, attributed agent with confidence,
deterministic risk score, findings, approver, timestamp — closed with the
circular seal whose check-stroke draws itself in once (the page's single
signature motion). The record is the product's real output, not an
illustration.

### Page structure

1. Masthead nav (ruled, quiet)
2. Hero: headline + attestation record artifact
3. Problem framing, stated plainly (editorial numbered paragraphs)
4. "What goes on the record" — the 8 deterministic signals as a ledger table
5. Workflow as clauses §01–§04
6. Per-agent accountability (authorship ledger, agent confidence rows)
7. Evidence & compliance (EU AI Act / SOC2 framing, export artifact)
8. Data handling / what is never stored (trust)
9. FAQ (ruled definition list)
10. Colophon-style final CTA + footer

### Visual system

Serif display face (Fraunces) for ceremony; Geist Sans body; Geist Mono with
`tabular-nums` for every record field and numeral. Single wide column with a
strong left margin rhythm; horizontal rules carry the structure — almost no
cards. Generous whitespace; density lives inside the record artifacts, not the
page. Icons nearly absent; numbers and rules do the work.

### Color and mood

The app's light token family: cool near-white paper, deep navy ink, blueprint
cyan reserved for interactive elements and the seal. Status colors only inside
record rows. Mood: registry office, morning light, unhurried.

### Animation style

Near-static by design. One signature moment: the seal's attest-check stroke
draws in on load (CSS `stroke-dashoffset`, `both` fill, killed by the global
reduced-motion rule). Elsewhere: underline-thickening link hovers, row
highlights, a subtle lift on the record artifact. Nothing loops.

### Content style

Measured, notarial, plain-spoken. Short declarative sentences. "Attested. On
the record." No exclamation marks, no hype adjectives — this direction _is_
PRODUCT.md's "the page itself must feel audited" principle taken literally.

### Differentiation

No AI-tooling landing page looks like a typeset register. Every competitor is
dark, glowing, and gradient-washed; this is light, ruled, and documentary. The
hero artifact is the product's actual sellable output (the evidence record),
which no competitor can honestly copy.

### Risks

- Serif + registry framing can read enterprise-heavy for a free early-access
  tool if the copy isn't kept human.
- Undersells the live dashboard; needs a real product surface somewhere
  mid-page in the full redesign.
- Editorial pages live and die on typographic execution — sloppy spacing
  would kill it.

### Best fit

Choose this if the wedge is **audit evidence** — EU AI Act / SOC2 pressure,
compliance-adjacent buyers, and long-term brand ownership of "attestation."

---

## Direction 2 — Approach Control

**Route:** `/design-directions/approach-control`

### Positioning angle

MergeAttest is **approach control for the merge boundary**. Agents are landing
code faster than humans can review it; someone has to sequence the traffic.
This direction sells operational control: see everything inbound, hold what's
risky, clear what's safe — on the record.

### Target user feeling (first 5 seconds)

"This system is live right now, and it would show me my queue." Alert,
in-command — the feeling of walking into a well-run operations room.

### Visual metaphor

**A control tower's flight-strip board.** Air-traffic controllers sequence
aircraft with physical strips racked on a board; here every inbound PR is a
strip: id, repo, agent, risk score, verdict. The board, the instrument
cluster, and the sequencing ladder (contact → identify → score → clear/hold)
drive the whole page.

### Hero concept

Full-width dark console. Compact headline ("Agents are landing code faster
than you can review it.") over a live **merge board** — a faithful
recreation of the product's PR queue as racked strips with tabular numerals,
risk bars, and hold/clear verdicts. One strip is highlighted as held for human
review. A status bar above the board ticks (single allowed loop: the live
pulse). Cyan CTA.

### Page structure

1. Status-bar nav (mono, bordered)
2. Hero: headline + the merge board
3. Problem framing as a timestamped incident log
4. The 8 signals as a hairline-divided instrument cluster
5. Sequencing ladder (how it works, 4 phases)
6. Per-agent scorecard (the real reports surface, ranked rows with share bars)
7. Evidence export panel (what compliance receives)
8. Trust/security readout
9. FAQ (compact console cards)
10. Final CTA strip

### Visual system

Geist Sans + Geist Mono only — **zero new fonts**; mono-dominant micro-labels,
`tabular-nums` everywhere. Dense multi-panel grid: one shared panel chrome
(hairline header + eyebrow), `gap-px` clusters over border-colored
backgrounds. This direction uses the app's actual dark-theme token values, so
the landing and the signed-in product are visibly the same machine.

### Color and mood

The app's dark tokens verbatim: deep navy surfaces on a lightness ramp, bright
blueprint cyan accent, muted status hues for verdicts. Mood: night-shift
operations, calm urgency, everything monitored.

### Animation style

One signature moment: strips settle into the rack on load (staggered
translate/opacity). One permitted loop: the live status pulse. Hovering a
strip lifts it via border/shadow only (no transform, matching the existing
landing convention). All CSS, reduced-motion killed globally.

### Content style

Operational, present-tense, second person. "Traffic is inbound. Sequence it."
Short imperative section leads, evidence-dense body copy.

### Differentiation

The hero is effectively the product — no abstraction layer. The flight-strip
board is a bespoke, ownable artifact (not a dashboard screenshot, not a bento
grid), and the incident-log problem section replaces the cliché "pain point
paragraph" with something engineers actually read.

### Risks

- Closest in stance to the current dark landing — must win on realism and
  density, or it reads as a re-skin.
- Dense boards need careful mobile reflow (strips must stack legibly).
- Urgency framing may undersell the compliance story for security buyers.

### Best fit

Choose this if the wedge is the **engineering lead drowning in agent PRs** —
ops pain first, compliance as the exhaust. Also the direction most continuous
with the existing brand personality ("engineering control room").

---

## Direction 3 — Zero Theater

**Route:** `/design-directions/zero-theater`

### Positioning angle

**The anti-AI-washing manifesto.** Every tool in this market claims
intelligence; MergeAttest's differentiator is that its governance layer is
deterministic and inspectable. This direction makes the mechanism the
marketing: "Same diff, same score. No model guesswork. No AI theater."
Founder-led candor: what it does, what it will not do, what it costs.

### Target user feeling (first 5 seconds)

"Finally — a tool that doesn't bullshit me." Relief and respect. The skeptical
platform engineer's page.

### Visual metaphor

**A printed specification** — RFC / datasheet energy. Massive black type,
heavy section rules, numbered requirements with MUST/NEVER language, mono
values. The page is typeset like a standard you could print and file.

### Hero concept

Type-only hero: a three-line, near-viewport-width headline in a heavy
grotesque ("No AI theater. / Same diff, / same score."), with a one-time
highlighter sweep under the key phrase (the single signature motion). Below,
a plain-language spec paragraph and a stark ink CTA. The centerpiece isn't a
mockup — it's **SPEC/001**, a two-column datasheet of exactly what runs on
every pull request, with mono values and MUST clauses.

### Page structure

1. Minimal rule-framed nav
2. Manifesto hero + SPEC/001 datasheet
3. Problem: "the claim economy" (oversized pull-quote framing)
4. Requirements: the 8 signals as numbered MUST clauses
5. "What it will not do" — anti-features, stated brutally (no model reads
   your code unless you turn it on; no invented scores; no lock-in)
6. Workflow in 4 oversized numerals
7. Evidence excerpt: a rendered fragment of the exported audit record
8. Per-agent accountability (ranked plain table)
9. FAQ, direct answers
10. Founder note (early access, small studio, free — honest) + final CTA

### Visual system

Heavy grotesque display (Archivo, 600–900 range) + Geist Sans body + Geist
Mono for spec values. No cards at all: 2px section rules, numbered blocks,
one column that occasionally breaks to two. Whitespace is aggressive;
hierarchy comes from scale contrast (96px headlines against 14px mono).

### Color and mood

Near-white paper, near-black ink (the app's foreground token family), the
blueprint cyan spent on exactly one element per screen. Status colors only in
the spec sheet. Mood: printed standard, engineer's desk, zero decoration.

### Animation style

Kinetic restraint: headline lines rise once on load; the highlighter sweep
(scaleX, origin-left) fires once; everything after the fold is static except
hover states. The cheapest direction to keep fast — no imagery at all.

### Content style

Blunt, first-principles, first-person-plural sparingly. Reads like the
engineer who built it wrote it. The "will not do" section and founder note
carry the credibility.

### Differentiation

There are no cards, no dashboard chrome, no dark-mode glow — nothing for a
competitor to swap a logo onto. The honesty _is_ the design: anti-features as
a headline section inverts the template. Typography-led pages are rare in
dev-tools and memorable when executed.

### Risks

- Lives or dies on copywriting; weak copy makes it a bare page.
- Least product-visual proof — the spec sheet and evidence excerpt must feel
  real or the page feels abstract.
- Heavy display type needs careful mobile scaling.
- Manifesto tone, if overdone, becomes its own theater.

### Best fit

Choose this if the brand bets on the **skeptic-engineer audience** and wants
the mechanism-honesty wedge; also the fastest to implement completely.

---

## Comparison

| Criterion                 | Paper of Record                                 | Approach Control                                        | Zero Theater                                  |
| ------------------------- | ----------------------------------------------- | ------------------------------------------------------- | --------------------------------------------- |
| Commercial clarity        | High — sells the exportable artifact            | High — sells relief from a felt pain                    | Medium-high — sells trust, indirect value     |
| Visual distinctiveness    | Very high (light, ruled, documentary)           | High (bespoke board, but dark-console is a known genre) | Very high (type-only, no genre)               |
| Implementation complexity | Medium (typographic precision, record artifact) | Medium-high (dense board, mobile reflow)                | Low-medium (few components, exacting spacing) |
| Fit with product          | Very high — owns "Attest"                       | Very high — shows the real queue                        | High — matches deterministic mechanics        |
| Fit with Eastbase Studio  | High (structural personality, restraint)        | High (control-room heritage)                            | High (honesty rules, no invented traction)    |
| Risk level                | Medium (enterprise-heavy tone risk)             | Medium (re-skin risk vs current landing)                | Medium (copy-dependent)                       |
| Recommendation score      | **9/10**                                        | 8/10                                                    | 7.5/10                                        |

## Recommendation: Paper of Record

**Paper of Record** is the recommended direction:

1. **It owns the name.** MergeAttest's brand asset is "attestation" — the
   record is the one artifact competitors (AI reviewers) can't honestly copy.
   The direction turns the product name into the visual concept.
2. **It matches the buyer's skepticism.** PRODUCT.md: users "evaluate tools
   skeptically and distrust AI-washing," and "the page itself must feel
   audited." A documentary, ruled, evidence-first page is that principle made
   visible. Every competitor is dark and glowing; the light register is
   instantly differentiated shelf presence.
3. **It heals the design-system split.** Built on the app's light token
   family, the marketing page and the light-first product finally look like
   one system.
4. **The commercial story is concrete.** The hero shows the thing compliance
   asks for. "Would this improve trust and conversion?" — the artifact _is_
   the trust.

Caveat to carry into the full redesign: import Approach Control's real-product
proof (the merge board / queue) as a mid-page section so the live product is
visible below the documentary hero — record first, control room second.

## Prototype notes

- Prototypes live under `app/design-directions/` and are **noindex** preview
  routes, publicly reachable (added to `publicAppPaths`), and do not touch
  the production landing at `app/page.tsx`.
- All three compose the same verified facts from
  `components/marketing/content.ts` — no invented metrics or logos.
- Each page is a self-contained Server Component with scoped styles (same
  isolation pattern as the current landing), CSS-only motion, and the global
  reduced-motion kill-switch applies.
