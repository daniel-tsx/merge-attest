import { cn } from '@/lib/utils'

// Two-tone "M" monogram for MergeAttest.
const LEFT_STROKE = 'M6 26 V6'
const INNER_LEFT_STROKE = 'M6 6 L16 18'
const INNER_RIGHT_STROKE = 'M16 18 L26 6'
const RIGHT_STROKE = 'M26 6 V26'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn('size-5', className)}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={LEFT_STROKE} stroke="currentColor" strokeWidth="3" />
      <path d={INNER_LEFT_STROKE} stroke="currentColor" strokeWidth="3" />
      <path d={INNER_RIGHT_STROKE} className="stroke-accent" strokeWidth="3" />
      <path d={RIGHT_STROKE} className="stroke-accent" strokeWidth="3" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LogoMark />
      <span className="text-sm font-semibold tracking-tight">MergeAttest</span>
    </div>
  )
}
