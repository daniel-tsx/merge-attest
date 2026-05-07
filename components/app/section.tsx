import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Section({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  variant = 'default',
}: {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
  variant?: 'default' | 'plain'
}) {
  if (variant === 'plain') {
    return (
      <section className={cn('space-y-4', className)}>
        {title || description || actions ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {title ? (
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? (
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            ) : null}
          </div>
        ) : null}
        {children}
      </section>
    )
  }

  return (
    <section
      className={cn(
        'rounded-card border border-border bg-surface shadow-card',
        className,
      )}
    >
      {title || description || actions ? (
        <header className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title ? (
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </header>
      ) : null}
      <div className={cn('p-5', contentClassName)}>{children}</div>
    </section>
  )
}
