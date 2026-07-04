import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { createPageMetadata } from '@/lib/seo/metadata'

export const metadata = createPageMetadata({
  title: 'Landing page design directions',
  description:
    'Internal preview index for MergeAttest landing page design explorations. Not the production landing page.',
  path: '/design-directions',
  noIndex: true,
})

// Internal preview index for the landing redesign exploration. Uses the app's
// design tokens (theme-aware) — see docs/design/FABLE_LANDING_DIRECTIONS.md.
const directions = [
  {
    slug: 'paper-of-record',
    index: '01',
    name: 'Paper of Record',
    angle: 'Evidence-first — the system of record for AI-assisted code',
    summary:
      'A light, documentary register. Serif ceremony, ruled ledger hairlines, and the attestation record itself as the hero artifact. Calm, institutional trust.',
    stance: 'light · editorial · near-static',
    recommended: true,
  },
  {
    slug: 'approach-control',
    index: '02',
    name: 'Approach Control',
    angle: 'Operations-first — sequence the merge traffic your agents create',
    summary:
      'A dark, live console built from the app’s own dark tokens. A flight-strip merge board as the hero, an incident-log problem section, instrument-cluster signals.',
    stance: 'dark · dense console · live pulse',
    recommended: false,
  },
  {
    slug: 'zero-theater',
    index: '03',
    name: 'Zero Theater',
    angle: 'Honesty-first — the anti-AI-washing manifesto',
    summary:
      'A typographic specification: massive grotesque headlines, MUST/NEVER clauses, an exported-evidence excerpt, and a founder note that says what isn’t built yet.',
    stance: 'light · type-only · manifesto',
    recommended: false,
  },
]

export default function DesignDirectionsIndex() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="text-eyebrow font-mono text-subtle-foreground">
          Internal preview · not the production landing page
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Landing page design directions
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Three deliberately different directions for the MergeAttest landing
          page — each changes the positioning angle, visual metaphor, layout
          system, and tone, not just the palette. Full rationale, comparison
          table, and recommendation live in{' '}
          <code className="font-mono text-[13px]">
            docs/design/FABLE_LANDING_DIRECTIONS.md
          </code>
          .
        </p>

        <div className="mt-12 space-y-4">
          {directions.map((d) => (
            <Link
              key={d.slug}
              href={`/design-directions/${d.slug}`}
              className="group block rounded-card border border-border bg-surface p-6 shadow-card transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:outline-none sm:p-7"
            >
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-mono text-[11px] tracking-[0.16em] text-subtle-foreground uppercase">
                  Direction {d.index}
                  {d.recommended ? (
                    <span className="ml-3 text-accent">· recommended</span>
                  ) : null}
                </p>
                <p className="font-mono hidden text-[11px] text-subtle-foreground sm:block">
                  {d.stance}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight">
                  {d.name}
                </h2>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 text-subtle-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </div>
              <p className="mt-1 text-[13.5px] font-medium text-muted-foreground">
                {d.angle}
              </p>
              <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
                {d.summary}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            For comparison: the{' '}
            <Link
              href="/"
              className="text-accent underline underline-offset-2 hover:text-accent-hover"
            >
              current production landing page
            </Link>{' '}
            (&ldquo;Blueprint Schematic&rdquo;). Review notes in{' '}
            <code className="font-mono text-[12px]">
              docs/design/FABLE_LANDING_DIRECTIONS_REVIEW.md
            </code>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
