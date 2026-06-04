import * as React from 'react'
import { cn } from '@/lib/utils'

type GateScanSize = 'sm' | 'md' | 'lg'
type GateScanTone = 'accent' | 'danger' | 'muted'
type GateScanState = 'scan' | 'fissure' | 'question'

type GateScanProps = {
  size?: GateScanSize
  tone?: GateScanTone
  state?: GateScanState
  label?: string
  className?: string
}

const sizeClass: Record<GateScanSize, string> = {
  sm: 'size-8',
  md: 'size-12',
  lg: 'size-16',
}

const toneClass: Record<GateScanTone, string> = {
  accent: 'text-accent',
  danger: 'text-danger',
  muted: 'text-muted-foreground',
}

const haloClass: Record<GateScanTone, string> = {
  accent: 'bg-accent-soft',
  danger: 'bg-danger-soft',
  muted: 'bg-surface-muted',
}

// "A" gate monogram, matching the product logo (LogoMark).
const GATE_LEGS = 'M10.5 39.75 L24 8.25 L37.5 39.75'
const GATE_CROSSBAR = 'M15.9 27.15 H32.1'
const GATE_OPENING = 'M24 8.25 L37.5 39.75 L10.5 39.75 Z'
const FISSURE_PATH = 'M25 14 L20.5 23 L26.5 30 L21 39'
const QUESTION_PATH =
  'M21.4 30.5a2.8 2.8 0 1 1 5 2.1c-1.05 1.05-2.5 1.6-2.5 3.45'

export function GateScan({
  size = 'md',
  tone = 'accent',
  state = 'scan',
  label,
  className,
}: GateScanProps) {
  const reactId = React.useId()
  const clipId = `gate-clip-${reactId}`
  const beamId = `gate-beam-${reactId}`

  const a11y = label
    ? ({ role: 'status', 'aria-label': label } as const)
    : ({ 'aria-hidden': true } as const)

  return (
    <span
      {...a11y}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-card',
        sizeClass[size],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-0 rounded-card',
          haloClass[tone],
          state === 'scan' && 'motion-safe:animate-gate-halo',
        )}
      />
      <svg
        viewBox="0 0 48 48"
        className={cn('relative h-3/5 w-3/5', toneClass[tone])}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={GATE_OPENING} />
          </clipPath>
          <linearGradient id={beamId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {state === 'scan' && (
          <g clipPath={`url(#${clipId})`}>
            <rect
              x={0}
              y={-14}
              width={48}
              height={14}
              fill={`url(#${beamId})`}
              stroke="none"
              className="motion-safe:animate-gate-scan motion-reduce:hidden"
            />
          </g>
        )}

        <path d={GATE_LEGS} />
        <path d={GATE_CROSSBAR} />

        {state === 'fissure' && <path d={FISSURE_PATH} />}

        {state === 'question' && (
          <>
            <path d={QUESTION_PATH} />
            <circle
              cx={24}
              cy={38.6}
              r={1.2}
              fill="currentColor"
              stroke="none"
            />
          </>
        )}
      </svg>
    </span>
  )
}
