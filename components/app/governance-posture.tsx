import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { AnimatedNumber } from '@/components/app/animated-number'
import { GateScan } from '@/components/app/gate-scan'
import { MetricTrend } from '@/components/app/metric-trend'
import { cn } from '@/lib/utils'

export type PostureLevel = 'clear' | 'attention' | 'action'

type SignalTone = 'neutral' | 'accent' | 'danger' | 'warning' | 'success'

export type PostureSignal = {
  key: string
  label: string
  value: number
  description: string
  tone: SignalTone
  series: number[]
  trend: 'up' | 'down' | 'flat'
}

export type AttentionItem = {
  label: string
  count: number
  href: string
  tone: Exclude<SignalTone, 'neutral'>
}

const postureConfig: Record<
  PostureLevel,
  {
    verdict: string
    gate: 'scan' | 'fissure' | 'question'
    gateTone: 'accent' | 'warning' | 'danger'
    pill: string
    dot: string
  }
> = {
  clear: {
    verdict: 'All gates clear',
    gate: 'scan',
    gateTone: 'accent',
    pill: 'border-success-border bg-success-soft text-success-strong',
    dot: 'bg-success',
  },
  attention: {
    verdict: 'Needs review',
    gate: 'scan',
    gateTone: 'warning',
    pill: 'border-attention-border bg-attention-soft text-attention',
    dot: 'bg-attention',
  },
  action: {
    verdict: 'Action required',
    gate: 'fissure',
    gateTone: 'danger',
    pill: 'border-danger-border bg-danger-soft text-danger',
    dot: 'bg-danger',
  },
}

const attentionDot: Record<AttentionItem['tone'], string> = {
  accent: 'bg-accent',
  danger: 'bg-danger',
  warning: 'bg-attention',
  success: 'bg-success',
}

const signalDot: Record<SignalTone, string> = {
  neutral: 'bg-border-strong',
  accent: 'bg-accent',
  danger: 'bg-danger',
  warning: 'bg-attention',
  success: 'bg-success',
}

/**
 * Control-room posture hero for the dashboard. Reads the org's deterministic
 * governance signals and resolves a single verdict (clear / needs review /
 * action required), surfaces the urgent counts as deep links, and folds the
 * four key signals into one bordered instrument panel — instead of a generic
 * grid of identical metric cards. The signature GateScan mark reflects the
 * verdict so the page reads its own state at a glance.
 */
export function GovernancePosture({
  level,
  summary,
  attention,
  signals,
}: {
  level: PostureLevel
  summary: string
  attention: AttentionItem[]
  signals: PostureSignal[]
}) {
  const config = postureConfig[level]

  return (
    <section
      aria-label="Governance posture"
      className="overflow-hidden rounded-card border border-border bg-surface-elevated shadow-card"
    >
      <div className="grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="bg-dot-grid relative border-b border-border p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="flex items-start gap-4">
            <GateScan
              size="lg"
              state={config.gate}
              tone={config.gateTone}
              label={`System posture: ${config.verdict}`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-eyebrow text-subtle-foreground">
                System posture
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <h2 className="text-display text-foreground">
                  {config.verdict}
                </h2>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 text-[11px] font-medium',
                    config.pill,
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn('size-1.5 rounded-full', config.dot)}
                  />
                  {level === 'clear'
                    ? 'Monitoring'
                    : level === 'attention'
                      ? 'Review queue'
                      : 'Blocking signals'}
                </span>
              </div>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                {summary}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-eyebrow text-subtle-foreground">
              Needs attention
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
                          attentionDot[item.tone],
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
                No blocking signals across monitored repositories.
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
                <AnimatedNumber value={signal.value} />
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {signal.description}
              </p>
              <div className="mt-3">
                <MetricTrend
                  series={signal.series}
                  trend={signal.trend}
                  tone={signal.tone}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
