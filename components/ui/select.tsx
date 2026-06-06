import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Native <select> kept for safe use inside uncontrolled FormData forms. The
// chevron is an overlaid icon (not a background data-URI) so it uses the
// `--subtle-foreground` token and themes with light/dark automatically. The
// native options popup follows `color-scheme`, which next-themes sets on <html>.
export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          'h-9 w-full appearance-none rounded-control border border-border bg-surface-elevated px-3 pr-9 text-sm text-foreground outline-none transition-[background-color,border-color,box-shadow] duration-150 hover:border-border-strong focus:border-focus focus:ring-2 focus:ring-focus-ring disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground disabled:opacity-70',
          className,
        )}
        {...props}
      />
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-subtle-foreground"
      />
    </div>
  )
}
