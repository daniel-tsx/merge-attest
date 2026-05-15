import * as React from 'react'
import { cn } from '@/lib/utils'

type SkeletonVariant = 'shimmer' | 'pulse'

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: SkeletonVariant
}

export function Skeleton({
  className,
  variant = 'shimmer',
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative isolate overflow-hidden rounded-control bg-surface-muted',
        variant === 'pulse' && 'animate-pulse',
        variant === 'shimmer' &&
          'before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-accent/15 before:to-transparent before:content-[""] motion-safe:before:animate-skeleton-shimmer',
        className,
      )}
      {...props}
    />
  )
}
