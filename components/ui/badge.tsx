import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeTone = 'slate' | 'green' | 'yellow' | 'orange' | 'red' | 'blue'

const tones: Record<BadgeTone, { surface: string; dot: string }> = {
  slate: {
    surface: 'border-border bg-surface text-muted-foreground',
    dot: 'bg-subtle-foreground',
  },
  green: {
    surface: 'border-success-border bg-success-soft text-success-strong',
    dot: 'bg-success',
  },
  yellow: {
    surface: 'border-warning-border bg-warning-soft text-warning',
    dot: 'bg-warning',
  },
  orange: {
    surface: 'border-attention-border bg-attention-soft text-attention',
    dot: 'bg-attention',
  },
  red: {
    surface: 'border-danger-border bg-danger-soft text-danger',
    dot: 'bg-danger',
  },
  blue: {
    surface: 'border-info-border bg-info-soft text-info',
    dot: 'bg-info',
  },
}

export function Badge({
  className,
  tone = 'slate',
  withDot = false,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone
  withDot?: boolean
}) {
  const styles = tones[tone]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 text-[11px] font-medium leading-5 capitalize tracking-tight',
        styles.surface,
        className,
      )}
      {...props}
    >
      {withDot ? (
        <span
          aria-hidden="true"
          className={cn('size-1.5 rounded-full', styles.dot)}
        />
      ) : null}
      {children}
    </span>
  )
}

export function StatusDot({
  tone = 'slate',
  pulse = false,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone
  pulse?: boolean
}) {
  const styles = tones[tone]
  return (
    <span
      aria-hidden="true"
      className={cn('relative inline-flex size-2', className)}
      {...props}
    >
      {pulse ? (
        <span
          className={cn(
            'absolute inset-0 animate-ping rounded-full opacity-60',
            styles.dot,
          )}
        />
      ) : null}
      <span
        className={cn('relative inline-flex size-2 rounded-full', styles.dot)}
      />
    </span>
  )
}
