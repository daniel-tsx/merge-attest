'use client'

import * as React from 'react'
import type { CSSProperties } from 'react'
import {
  BadgeCheck,
  Check,
  ChevronRight,
  ListChecks,
  TestTube2,
} from 'lucide-react'
import { LogoMark } from '@/components/app/logo'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// --- Timing -----------------------------------------------------------------
// The scan plays once each time the panel enters the viewport: a beam sweeps
// the card top-to-bottom and every element resolves in as the beam crosses it.
const BEAM_MS = 2400 // beam travels 0 → 100% of the card body
const TAIL_MS = 420 // lets the lowest element finish revealing after the beam lands
const SETTLE_MS = 240 // brief pause before the scan is marked complete
const SCAN_END = BEAM_MS + TAIL_MS + SETTLE_MS
const LEAD_IN = 650 // wait after entering view, so the card finishes its intro

const REVEAL_WIDTH = 0.13 // beam travel a single element reveal spans
const SCORE_WINDOW = 0.32 // beam travel the score count-up spans
const FINAL_SCORE = 72
const RING_C = 2 * Math.PI * 42

// Vertical position of each element as a fraction of the beam's travel — tuned
// so each element resolves exactly as the beam line crosses it.
const POS = {
  identity: 0.17,
  ring: 0.15,
  findingA: 0.37,
  findingB: 0.42,
  verdict: 0.55,
  rowA: 0.75,
  rowB: 0.92,
} as const

const queueRows = [
  {
    id: '#479',
    title: 'Bump dependency lockfile',
    meta: 'agent:dependabot · +12 −12',
    risk: 'Low',
    tone: 'green' as const,
    bar: 'bg-success',
    width: 16,
    pos: POS.rowA,
  },
  {
    id: '#477',
    title: 'Refactor auth session store',
    meta: 'agent:claude-code · +96 −140',
    risk: 'Medium',
    tone: 'yellow' as const,
    bar: 'bg-warning',
    width: 48,
    pos: POS.rowB,
  },
]

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)
const easeOut = (n: number) => 1 - (1 - n) ** 3
const bell = (n: number) => (n > 0 && n < 1 ? Math.sin(n * Math.PI) : 0)

type Phase = 'idle' | 'scanning' | 'done'

export function HeroScanPanel() {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [phase, setPhase] = React.useState<Phase>('idle')
  const [clock, setClock] = React.useState(0)

  const rafRef = React.useRef<number | null>(null)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const startRef = React.useRef(0)

  const stopAnimation = React.useEffectEvent(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    if (timerRef.current != null) clearTimeout(timerRef.current)
    rafRef.current = null
    timerRef.current = null
  })

  const startScan = React.useEffectEvent(() => {
    setPhase('scanning')
    startRef.current = performance.now()

    const tickFrame = () => {
      const elapsed = performance.now() - startRef.current
      if (elapsed >= SCAN_END) {
        setClock(SCAN_END)
        setPhase('done')
        rafRef.current = null
        return
      }
      setClock(elapsed)
      rafRef.current = requestAnimationFrame(tickFrame)
    }

    rafRef.current = requestAnimationFrame(tickFrame)
  })

  const onViewportChange = React.useEffectEvent((isIntersecting: boolean) => {
    stopAnimation()
    if (!isIntersecting) {
      setPhase('idle')
      setClock(0)
      return
    }
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reduced) {
      setPhase('done')
      setClock(SCAN_END)
      return
    }
    setPhase('idle')
    setClock(0)
    timerRef.current = setTimeout(startScan, LEAD_IN)
  })

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const observer = new IntersectionObserver(
      ([entry]) => onViewportChange(entry.isIntersecting),
      { threshold: 0.45 },
    )
    observer.observe(root)

    return () => {
      observer.disconnect()
      stopAnimation()
    }
  }, [])

  const done = phase === 'done'
  const scanning = phase === 'scanning'

  // beam position (visual) is capped at the card bottom; reveal progress is
  // allowed to overshoot so the lowest element fully resolves.
  const beam = clamp01(clock / BEAM_MS)
  const rp = done ? 2 : clock / BEAM_MS

  const reveal = (pos: number) => {
    const t = (rp - pos) / REVEAL_WIDTH
    return { r: easeOut(clamp01(t)), pulse: bell(t) }
  }

  const accentRing = (a: number) =>
    `color-mix(in srgb, var(--accent) ${a.toFixed(0)}%, transparent)`

  const cardStyle = (pos: number): CSSProperties => {
    const { r, pulse } = reveal(pos)
    return {
      opacity: r,
      transform: `translateY(${((1 - r) * 14).toFixed(2)}px)`,
      boxShadow:
        pulse > 0.012
          ? `0 0 0 1.5px ${accentRing(pulse * 62)}, 0 12px 26px -16px ${accentRing(pulse * 95)}`
          : undefined,
    }
  }

  const textStyle = (pos: number): CSSProperties => {
    const { r } = reveal(pos)
    return {
      opacity: r,
      transform: `translateY(${((1 - r) * 14).toFixed(2)}px)`,
    }
  }

  // --- Score ring -----------------------------------------------------------
  const ring = reveal(POS.ring)
  const scoreReveal = easeOut(clamp01((rp - POS.ring) / SCORE_WINDOW))
  const score = Math.round(scoreReveal * FINAL_SCORE)
  const settled = scoreReveal >= 1
  const landPop = bell((rp - (POS.ring + SCORE_WINDOW)) / 0.16)
  const ringStyle: CSSProperties = {
    opacity: ring.r,
    transform: `translateY(${((1 - ring.r) * 14).toFixed(2)}px) scale(${(
      1 +
      landPop * 0.07
    ).toFixed(3)})`,
    filter:
      ring.pulse > 0.012
        ? `drop-shadow(0 0 ${(ring.pulse * 11).toFixed(1)}px ${accentRing(
            ring.pulse * 70,
          )})`
        : undefined,
  }

  // --- Beam -----------------------------------------------------------------
  const beamOpacity = clamp01(beam / 0.04) * clamp01((1 - beam) / 0.06)

  const status: Phase = done ? 'done' : scanning ? 'scanning' : 'idle'

  return (
    <div ref={rootRef} className="relative">
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden translate-x-3 translate-y-3 rounded-card border border-border bg-surface-muted/50 lg:block"
      />
      <div className="relative overflow-hidden rounded-card border border-border bg-surface shadow-card-hover transition-transform duration-300 ease-out hover:-translate-y-1">
        {/* Header */}
        <div className="relative flex items-center gap-2.5 border-b border-border bg-surface-muted/60 px-4 py-3">
          <LogoMark className="size-4 text-foreground" />
          <span className="font-mono text-xs text-muted-foreground">
            acme/api-gateway
          </span>
          <ChevronRight
            className="size-3 text-subtle-foreground"
            aria-hidden="true"
          />
          <span className="font-mono text-xs font-medium text-foreground">
            review queue
          </span>
          <StatusPill status={status} />
          {/* Scan progress hairline */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-px overflow-hidden transition-opacity duration-500"
            style={{ opacity: done ? 0 : 1 }}
          >
            <div
              className="h-full bg-accent"
              style={{ width: `${(beam * 100).toFixed(2)}%` }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="relative overflow-hidden">
          {/* Scanned-region wash */}
          {scanning ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 z-0 bg-accent/5"
              style={{ height: `${(beam * 100).toFixed(2)}%` }}
            />
          ) : null}

          <div className="relative z-10">
            <div className="border-b border-border p-5">
              <div className="flex items-start justify-between gap-4">
                <div style={textStyle(POS.identity)} className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="grid">
                      <span
                        className="col-start-1 row-start-1 transition-opacity duration-300"
                        style={{ opacity: settled ? 0 : 1 }}
                      >
                        <span className="inline-flex items-center gap-1.5 rounded-pill border border-info-border bg-info-soft px-2 py-0.5 text-[11px] font-medium leading-5 text-info">
                          <span className="size-1.5 rounded-full bg-info motion-safe:animate-pulse" />
                          Analyzing
                        </span>
                      </span>
                      <span
                        className="col-start-1 row-start-1 transition-opacity duration-300"
                        style={{ opacity: settled ? 1 : 0 }}
                      >
                        <Badge tone="orange" withDot>
                          High risk
                        </Badge>
                      </span>
                    </span>
                    <span className="font-mono text-[11px] text-subtle-foreground">
                      #482
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold tracking-tight text-foreground">
                    Add retry logic to payment webhook
                  </h3>
                  <p className="mt-1 font-mono text-[11px] text-subtle-foreground">
                    agent:claude-code · +218 −34 · 6 files
                  </p>
                </div>
                <div style={ringStyle} className="shrink-0">
                  <ScoreRing
                    score={score}
                    reveal={scoreReveal}
                    settled={settled}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div
                  style={cardStyle(POS.findingA)}
                  className="flex items-center gap-2 rounded-control border border-border bg-surface-muted/50 px-3 py-2"
                >
                  <TestTube2
                    className="size-3.5 shrink-0 text-attention"
                    aria-hidden="true"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">
                      2 test gaps
                    </span>{' '}
                    detected
                  </span>
                </div>
                <div
                  style={cardStyle(POS.findingB)}
                  className="flex items-center gap-2 rounded-control border border-border bg-surface-muted/50 px-3 py-2"
                >
                  <ListChecks
                    className="size-3.5 shrink-0 text-danger"
                    aria-hidden="true"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">1 rule</span>{' '}
                    violation
                  </span>
                </div>
              </div>

              <div
                style={cardStyle(POS.verdict)}
                className="mt-3 flex items-center justify-between gap-3 rounded-control border border-border bg-surface-muted/50 px-3 py-2"
              >
                <span className="font-mono text-[11px] text-subtle-foreground">
                  approval required · 2 reviewers
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-control bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
                  <BadgeCheck className="size-3" aria-hidden="true" />
                  Awaiting review
                </span>
              </div>
            </div>

            <div className="divide-y divide-border">
              {queueRows.map((row) => {
                const { r } = reveal(row.pos)
                return (
                  <div
                    key={row.id}
                    style={cardStyle(row.pos)}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-foreground">
                        {row.title}
                      </div>
                      <div className="font-mono text-[10px] text-subtle-foreground">
                        {row.id} · {row.meta}
                      </div>
                    </div>
                    <div className="hidden h-1 w-14 overflow-hidden rounded-pill bg-surface-subtle sm:block">
                      <div
                        className={cn('h-full rounded-pill', row.bar)}
                        style={{ width: `${(r * row.width).toFixed(1)}%` }}
                      />
                    </div>
                    <Badge tone={row.tone}>{row.risk}</Badge>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Scan beam */}
          {scanning ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 z-20"
              style={{
                top: `${(beam * 100).toFixed(2)}%`,
                opacity: beamOpacity,
              }}
            >
              <div className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(to_top,color-mix(in_srgb,var(--accent)_16%,transparent),transparent)]" />
              <div className="absolute inset-x-0 h-0.5 -translate-y-1/2 bg-accent shadow-[0_0_16px_2px_color-mix(in_srgb,var(--accent)_55%,transparent)]" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: Phase }) {
  if (status === 'done') {
    return (
      <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] text-success-strong">
        <Check className="size-3" aria-hidden="true" />
        reviewed
      </span>
    )
  }
  if (status === 'scanning') {
    return (
      <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] text-accent">
        <span className="relative flex size-2">
          <span className="absolute inset-0 rounded-full bg-accent opacity-60 motion-safe:animate-ping" />
          <span className="relative size-2 rounded-full bg-accent" />
        </span>
        scanning
      </span>
    )
  }
  return (
    <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] text-subtle-foreground">
      <span className="size-2 rounded-full bg-subtle-foreground" />
      queued
    </span>
  )
}

function ScoreRing({
  score,
  reveal,
  settled,
}: {
  score: number
  reveal: number
  settled: boolean
}) {
  const offset = RING_C * (1 - (reveal * FINAL_SCORE) / 100)
  return (
    <div className="relative inline-flex size-[62px] items-center justify-center">
      <svg viewBox="0 0 100 100" className="size-[62px] -rotate-90">
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          strokeWidth="8"
          className="stroke-attention-border opacity-40"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={offset}
          className={cn(
            'transition-[stroke] duration-500',
            settled ? 'stroke-attention' : 'stroke-accent',
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {score}
        </span>
        <span
          className="mt-0.5 rounded-pill border border-attention-border bg-attention-soft px-1.5 text-[10px] font-medium uppercase tracking-wider text-attention transition-all duration-300"
          style={{
            opacity: settled ? 1 : 0,
            transform: settled ? 'scale(1)' : 'scale(0.6)',
          }}
        >
          High
        </span>
      </div>
    </div>
  )
}
