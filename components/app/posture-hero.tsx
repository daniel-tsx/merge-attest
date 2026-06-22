import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { GateScan } from '@/components/app/gate-scan'
import { cn } from '@/lib/utils'

export type PostureGateState = 'scan' | 'fissure' | 'question'
export type PostureGateTone = 'accent' | 'warning' | 'danger' | 'muted'
export type PostureStatusTone = 'success' | 'accent' | 'warning' | 'danger'
export type PostureSignalTone =
  | 'neutral'
  | 'accent'
  | 'danger'
  | 'warning'
  | 'success'

export type HeroSignal = {
  key: string
  label: string
  value: ReactNode
  description: string
  tone: PostureSignalTone
  /** Optional trailing content per signal (e.g. a sparkline). */
  trailing?: ReactNode
}

export type HeroAttentionItem = {
  label: string
  count: number
  href: string
  tone: Exclude<PostureSignalTone, 'neutral'>
}

const statusPill: Record<PostureStatusTone, { pill: string; dot: string }> = {
  success: {
    pill: 'border-success-border bg-success-soft text-success-strong',
    dot: 'bg-success',
  },
  accent: {
    pill: 'border-accent-ring bg-accent-soft text-accent',
    dot: 'bg-accent',
  },
  warning: {
    pill: 'border-attention-border bg-attention-soft text-attention',
    dot: 'bg-attention',
  },
  danger: {
    pill: 'border-danger-border bg-danger-soft text-danger',
    dot: 'bg-danger',
  },
}

const dotTone: Record<Exclude<PostureSignalTone, 'neutral'>, string> = {
  accent: 'bg-accent',
  danger: 'bg-danger',
  warning: 'bg-attention',
  success: 'bg-success',
}

const signalDot: Record<PostureSignalTone, string> = {
  neutral: 'bg-border-strong',
  accent: 'bg-accent',
  danger: 'bg-danger',
  warning: 'bg-attention',
  success: 'bg-success',
}

/**
 * Shared control-room hero: a bordered instrument panel that pairs the product's
 * GateScan mark (state/tone reflect a resolved verdict) with a verdict pill, a
 * blueprint dot-grid backdrop, linked "needs attention" chips, and a gapless
 * signal rail. Used by both the operational dashboard and the platform admin
 * overview so the two read as the same product.
 */
export function PostureHero({
  ariaLabel,
  eyebrow,
  verdict,
  statusLabel,
  statusTone,
  gateState,
  gateTone,
  summary,
  attentionLabel = 'Needs attention',
  attention,
  attentionEmpty,
  signals,
}: {
  ariaLabel: string
  eyebrow: string
  verdict: string
  statusLabel: string
  statusTone: PostureStatusTone
  gateState: PostureGateState
  gateTone: PostureGateTone
  summary: string
  attentionLabel?: string
  attention: HeroAttentionItem[]
  attentionEmpty: ReactNode
  signals: HeroSignal[]
}) {
  const pill = statusPill[statusTone]

  return (
    <section
      aria-label={ariaLabel}
      className="overflow-hidden rounded-card border border-border bg-surface-elevated shadow-card"
    >
      <div className="grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="bg-dot-grid relative border-b border-border p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="flex items-start gap-4">
            <GateScan
              size="lg"
              state={gateState}
              tone={gateTone}
              label={`${eyebrow}: ${verdict}`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-eyebrow text-subtle-foreground">{eyebrow}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <h2 className="text-display text-foreground">{verdict}</h2>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 text-[11px] font-medium',
                    pill.pill,
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn('size-1.5 rounded-full', pill.dot)}
                  />
                  {statusLabel}
                </span>
              </div>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                {summary}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-eyebrow text-subtle-foreground">
              {attentionLabel}
            </p>
            {attention.length ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {attention.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="group inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-border-strong hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'size-1.5 rounded-full',
                          dotTone[item.tone],
                        )}
                      />
                      <span className="tabular-nums">{item.count}</span>
                      <span className="text-muted-foreground group-hover:text-foreground">
                        {item.label}
                      </span>
                      <ArrowUpRight
                        className="size-3 text-subtle-foreground"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 inline-flex items-center gap-2 text-sm text-success-strong">
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-success"
                />
                {attentionEmpty}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-border">
          {signals.map((signal) => (
            <div
              key={signal.key}
              className="flex flex-col justify-between bg-surface-elevated p-4 sm:p-5"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn('size-1.5 rounded-full', signalDot[signal.tone])}
                />
                <p className="text-eyebrow text-subtle-foreground">
                  {signal.label}
                </p>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                {signal.value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {signal.description}
              </p>
              {signal.trailing ? (
                <div className="mt-3">{signal.trailing}</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
