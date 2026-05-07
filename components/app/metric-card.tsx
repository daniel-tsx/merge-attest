import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type MetricTone = 'neutral' | 'accent' | 'danger' | 'warning' | 'success'

const toneStyles: Record<MetricTone, { ring: string; icon: string }> = {
  neutral: {
    ring: 'before:bg-border',
    icon: 'bg-surface-subtle text-subtle-foreground',
  },
  accent: {
    ring: 'before:bg-accent',
    icon: 'bg-accent-soft text-accent',
  },
  danger: {
    ring: 'before:bg-danger',
    icon: 'bg-danger-soft text-danger',
  },
  warning: {
    ring: 'before:bg-attention',
    icon: 'bg-attention-soft text-attention',
  },
  success: {
    ring: 'before:bg-success',
    icon: 'bg-success-soft text-success-strong',
  },
}

export function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone = 'neutral',
  trailing,
  className,
}: {
  label: string
  value: ReactNode
  description?: string
  icon?: LucideIcon
  tone?: MetricTone
  trailing?: ReactNode
  className?: string
}) {
  const styles = toneStyles[tone]
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-card border border-border bg-surface p-4 shadow-card transition-shadow hover:shadow-card-hover',
        'before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:rounded-l-card',
        styles.ring,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-subtle-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-control',
              styles.icon,
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </div>
        ) : null}
      </div>
      {trailing ? <div className="mt-3">{trailing}</div> : null}
    </div>
  )
}
