import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeTone = 'slate' | 'green' | 'yellow' | 'orange' | 'red' | 'blue'

const tones: Record<BadgeTone, string> = {
  slate: 'border-border bg-surface-subtle text-muted-foreground',
  green: 'border-success-border bg-success-soft text-success',
  yellow: 'border-warning-border bg-warning-soft text-warning',
  orange: 'border-attention-border bg-attention-soft text-attention',
  red: 'border-danger-border bg-danger-soft text-danger',
  blue: 'border-info-border bg-info-soft text-info',
}

export function Badge({
  className,
  tone = 'slate',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-control border px-2 py-0.5 text-xs font-medium leading-5',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
