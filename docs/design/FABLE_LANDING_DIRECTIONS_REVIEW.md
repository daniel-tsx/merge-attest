# Landing Design Directions — Review Notes

**Status:** `current` (point-in-time review of the exploration; supersede when a direction ships)
**Location:** `docs/design/FABLE_LANDING_DIRECTIONS_REVIEW.md`
**Reviewed:** 2026-07-04, in-browser at desktop (1280px) and mobile (375px)
**Companion:** [`FABLE_LANDING_DIRECTIONS.md`](./FABLE_LANDING_DIRECTIONS.md)

## Quality check summary

All three prototypes were verified in the running app (DOM, computed styles,
animation state, overflow checks at 375px and 1280px):

- Each direction communicates the product within the hero: attribution,
  deterministic scoring, approvals, evidence export all appear above or just
  below the fold in all three.
- Visually distinct at a glance: light serif register / dark mono console /
  stark grotesque manifesto. No shared hero shape, section rhythm, or card
  language.
- Copy is product-specific throughout, composed from
  `components/marketing/content.ts` (verified facts). No lorem ipsum, no
  invented logos, testimonials, or traction.
- Motion budget holds: one signature moment per page (seal check-draw /
  strips settling / highlighter sweep), one permitted loop only on Approach
  Control (status pulse). Everything is CSS-only; the global
  `prefers-reduced-motion` kill-switch in `app/globals.css` covers all of it.
- Responsive: no horizontal overflow at 375px on any page (an initial grid
  `min-width:auto` overflow in Zero Theater's evidence section was found in
  review and fixed with `min-w-0`).
- No new runtime dependencies. Paper of Record and Zero Theater each add one
  page-scoped `next/font` face (Fraunces / Archivo, self-hosted, latin
  subset); Approach Control adds none.

## Verdicts

- **Best overall: Paper of Record.** The only direction that owns something
  no competitor can copy honestly (the attestation record as hero), heals the
  marketing/app design-system split, and embodies the brand principle "the
  page itself must feel audited."
- **Safest: Approach Control.** Continuous with the existing control-room
  brand personality and the current dark landing; the app's real dark tokens;
  zero new fonts. If it fails, it fails to a competent baseline.
- **Most visually distinctive: Zero Theater** (with Paper of Record close
  behind). A type-only manifesto with MUST/NEVER clauses has no genre
  neighbors in dev-tools.
- **Fastest to implement fully: Zero Theater.** Few components, no artifact
  rendering, no board reflow logic — the cost is all in copy and spacing
  discipline.
- **Highest-conversion (judgment): Paper of Record.** The skeptical
  engineering-lead/compliance buyer converts on evidence, and the hero shows
  the exact artifact they need to produce for an auditor. Approach Control is
  second — strong felt-pain resonance, but its dark-console genre is where
  every AI dev-tool already lives, so trust accrues more slowly.
- **Personal choice: Paper of Record**, importing Approach Control's merge
  board as the mid-page product-proof section during the full redesign.

## What should happen in the next redesign pass

1. **Choose the direction** (recommendation: Paper of Record) and confirm the
   wedge it commits to.
2. **Rebuild `app/page.tsx`** in that direction, replacing the scoped `.mkt`
   palette with values tied to the app token family, and keeping the
   `heroLede`/FAQ JSON-LD wiring (`createHomeJsonLd`) intact.
3. **Import the strongest sections from the other two directions** where they
   serve the chosen story (merge board as product proof; the "what it will
   not do" honesty section is worth keeping in any direction).
4. **Carry the register through the funnel:** sign-up/sign-in shell, `/privacy`
   and `/terms` headers, and the OG image should adopt the chosen direction's
   type and atmosphere so the story survives the first click.
5. **Decide the dark story for a light direction:** either a tuned dark theme
   of the register (the token system already supports it) or a deliberate
   light-only marketing stance — not an accidental one.
6. **Then remove the preview routes** (`app/design-directions/`), drop
   `'/design-directions'` from `publicAppPaths`, and move both design docs to
   `docs/archive/` per repo convention.

## Known limitations of the prototypes

- They are previews: `noindex`, not in the sitemap, linked only from
  `/design-directions`.
- Sample data (PR #482, the merge board strips, the evidence excerpt) is
  labeled as sample/composite in-page; the full redesign should consider a
  real product screenshot or live demo fragment as well.
- Prototype pages are light-only or dark-only by design; theme toggling is
  deferred to the chosen direction's production build.
- `components/app/root-shell.tsx` was changed from exact-match to
  prefix-match for public paths (consistent with `proxy.ts` and
  `app/layout.tsx`) so nested preview routes render without the app shell.
  No existing route nests under a public path, so behavior elsewhere is
  unchanged.
