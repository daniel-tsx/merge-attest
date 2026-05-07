import type { RiskLevel } from '@/lib/types'
import { cn } from '@/lib/utils'

const levelStyles: Record<
  RiskLevel,
  { track: string; ring: string; chip: string; label: string }
> = {
  critical: {
    track: 'stroke-danger-border',
    ring: 'stroke-danger',
    chip: 'border-danger-border bg-danger-soft text-danger',
    label: 'Critical',
  },
  high: {
    track: 'stroke-attention-border',
    ring: 'stroke-attention',
    chip: 'border-attention-border bg-attention-soft text-attention',
    label: 'High',
  },
  medium: {
    track: 'stroke-warning-border',
    ring: 'stroke-warning',
    chip: 'border-warning-border bg-warning-soft text-warning',
    label: 'Medium',
  },
  low: {
    track: 'stroke-success-border',
    ring: 'stroke-success',
    chip: 'border-success-border bg-success-soft text-success-strong',
    label: 'Low',
  },
}

export function RiskScoreRing({
  score,
  level,
  size = 96,
  className,
}: {
  score: number
  level: RiskLevel
  size?: number
  className?: string
}) {
  const styles = levelStyles[level]
  const clamped = Math.max(0, Math.min(100, score))
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          className={styles.track}
          opacity="0.5"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={styles.ring}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {score}
        </span>
        <span
          className={cn(
            'mt-0.5 rounded-pill border px-1.5 text-[10px] font-medium uppercase tracking-wider',
            styles.chip,
          )}
        >
          {styles.label}
        </span>
      </div>
    </div>
  )
}
