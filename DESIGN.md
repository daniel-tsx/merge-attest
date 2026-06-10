# Design

Distilled from `app/globals.css` (runtime token source of truth) and `docs/features/DESIGN_SYSTEM.md`. If this file and the code disagree, the code wins.

## Theme

Dual theme via `next-themes` (`.dark` class). Light: cool near-white operational neutrals. Dark: deep cool neutrals with a lightness-ramp for elevation. `brand-surface` (deep ink `oklch(0.185 0.016 277)`) and `scrim` stay dark in both themes — reserved for decorative brand chrome (auth aside, dark panels).

## Color

OKLCH everywhere, hue 264–278 (cool indigo-tinted neutrals). Strategy: Restrained.

- Surfaces: `background`, `surface`, `surface-elevated`, `surface-muted`, `surface-subtle`, `surface-hover`, `surface-pressed`
- Borders: `border`, `border-strong`, `border-subtle`, `divider`
- Text: `foreground`, `muted-foreground`, `subtle-foreground`
- Primary: near-black chrome (inverts to near-white in dark mode)
- Accent: restrained Linear indigo `oklch(0.555 0.16 278)` — selected states, focus, high-priority actions only
- Status: `success` / `warning` / `attention` / `danger` / `info`, each with `-soft` and `-border` variants
- Never raw palette classes in shared primitives; add a token first

## Typography

- Sans: Geist Sans (`--font-geist-sans`), with `cv11 ss01 cv02 cv03` features
- Mono: Geist Mono — micro-labels, eyebrows, metadata, numerals (`tabular-nums`)
- `text-display` utility: 26px/1.2/-0.02em/600 for app page titles
- `text-eyebrow` utility: 11px/500/0.08em uppercase micro-label
- Marketing headlines: tight tracking (`tracking-tight`), weight 600

## Shape & Elevation

- `radius-control` 6px (compact controls), `radius-card` 8px (cards), `radius-pill`
- `shadow-card` / `shadow-card-hover` / `shadow-overlay`: restrained but real; borders carry most structure
- Prefer flat bordered containers over shadow-heavy cards; never colored side stripes

## Motion

- Global `prefers-reduced-motion: reduce` kill-switch in `globals.css`
- Landing: `[data-intro]` staggered hero rise, `[data-reveal]` scroll-timeline reveal, `.border-beam` traveling conic border (defined, currently unused)
- Hover lift on landing cards via shadow + border only, never `transform` (fights the scroll-timeline reveal)
- Ease-out curves (`cubic-bezier(0.22, 1, 0.36, 1)`); no bounce

## Components

shadcn-style primitives in `components/ui/` wired to the tokens above (not shadcn defaults). Key: `Button` (variants incl. `accent`, `secondary`, `ghost`), `Badge`/`StatusDot` (tones: slate/green/yellow/orange/red/blue), `Card`, `Table`, `Tabs`, `Tooltip`, `Sheet`, `Command`. Decorative backdrop: `.bg-dot-grid` / `.bg-dot-grid-on-dark`.
