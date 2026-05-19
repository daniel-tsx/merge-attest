import * as React from 'react'
import { cn } from '@/lib/utils'

// The inline chevron stroke mirrors the --subtle-foreground token; a data-URI
// background cannot resolve a CSS variable, so the value is kept in sync here.
export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-9 w-full appearance-none rounded-control border border-border bg-surface-elevated bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22oklch(0.57 0.026 264)%22 stroke-width=%222.25%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-[length:12px_12px] bg-[right_0.75rem_center] bg-no-repeat px-3 pr-9 text-sm text-foreground outline-none transition-[background-color,border-color,box-shadow] duration-150 hover:border-border-strong focus:border-focus focus:ring-2 focus:ring-focus-ring disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground disabled:opacity-70",
        className,
      )}
      {...props}
    />
  )
}
