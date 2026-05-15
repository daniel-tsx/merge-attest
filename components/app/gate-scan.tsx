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

const SHIELD_PATH = 'M24 44s16-8 16-20V10l-16-6-16 6v14c0 12 16 20 16 20z'

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
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={SHIELD_PATH} />
          </clipPath>
          <linearGradient id={beamId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={SHIELD_PATH} />

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
            <line
              x1={6}
              y1={24}
              x2={42}
              y2={24}
              stroke="currentColor"
              strokeWidth={1}
              strokeOpacity={0.25}
              className="motion-reduce:hidden"
            />
          </g>
        )}

        {state === 'fissure' && (
          <path d="M18 14 L25 23 L20 29 L28 38" strokeLinecap="round" />
        )}

        {state === 'question' && (
          <>
            <path
              d="M20 20a4 4 0 1 1 5.5 3.7c-.9.5-1.5 1.4-1.5 2.4v1"
              strokeLinecap="round"
            />
            <circle cx={24} cy={32} r={1.1} fill="currentColor" stroke="none" />
          </>
        )}
      </svg>
    </span>
  )
}
