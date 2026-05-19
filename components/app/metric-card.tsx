import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type MetricTone = 'neutral' | 'accent' | 'danger' | 'warning' | 'success'

const toneStyles: Record<MetricTone, { indicator: string; icon: string }> = {
  neutral: {
    indicator: 'bg-border',
    icon: 'bg-surface-subtle text-subtle-foreground',
  },
  accent: {
    indicator: 'bg-accent',
    icon: 'bg-accent-soft text-accent',
  },
  danger: {
    indicator: 'bg-danger',
    icon: 'bg-danger-soft text-danger',
  },
  warning: {
    indicator: 'bg-attention',
    icon: 'bg-attention-soft text-attention',
  },
  success: {
    indicator: 'bg-success',
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
        'group rounded-card border border-border bg-surface-elevated p-4 shadow-card transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-card-hover',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn('size-1.5 rounded-full', styles.indicator)}
            />
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-subtle-foreground">
              {label}
            </p>
          </div>
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
