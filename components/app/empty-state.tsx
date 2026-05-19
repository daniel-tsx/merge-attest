import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EmptyState({
  title,
  description,
  actions,
  icon: Icon = Inbox,
  className,
}: {
  title: string
  description: string
  actions?: ReactNode
  icon?: LucideIcon
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-card border border-dashed border-border bg-surface-muted/45 px-6 py-10 text-center',
        className,
      )}
    >
      <div className="mx-auto flex size-10 items-center justify-center rounded-control border border-border bg-surface-elevated text-subtle-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-sm font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      {actions ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}

export function ResultSummary({
  count,
  label,
  detail,
}: {
  count: number
  label: string
  detail?: string
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-border pb-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-baseline gap-2 font-medium text-foreground">
        <span className="tabular-nums text-foreground">{count}</span>
        <span className="text-muted-foreground">{label}</span>
      </div>
      {detail ? (
        <div className="text-xs text-subtle-foreground">{detail}</div>
      ) : null}
    </div>
  )
}
