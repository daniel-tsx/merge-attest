import * as React from 'react'
import { cn } from '@/lib/utils'

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors duration-150 placeholder:text-subtle-foreground focus:border-focus focus:ring-2 focus:ring-focus-ring disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground disabled:opacity-70 aria-invalid:border-danger aria-invalid:ring-danger-border',
        className,
      )}
      {...props}
    />
  )
}
