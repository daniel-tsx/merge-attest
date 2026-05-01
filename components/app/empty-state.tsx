import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function EmptyState({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-card border border-dashed border-border bg-surface-muted p-6 text-center',
        className,
      )}
    >
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
        {description}
      </p>
      {actions ? (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
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
      <div className="font-medium text-foreground">
        {count} {label}
      </div>
      {detail ? <div className="text-muted-foreground">{detail}</div> : null}
    </div>
  )
}
