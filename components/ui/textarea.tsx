import * as React from 'react'
import { cn } from '@/lib/utils'

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-card outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-subtle-foreground focus:border-focus focus:ring-2 focus:ring-focus-ring disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground disabled:opacity-70 aria-invalid:border-danger aria-invalid:ring-danger-border',
        className,
      )}
      {...props}
    />
  )
}
