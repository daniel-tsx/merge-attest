import { cn } from '@/lib/utils'

// MergeAttest mark: connected merge rails with an attestation check.
const MERGE_RAILS = 'M6.5 25 V7.5 L16 18.5 L25.5 7.5 V25'
const ATTEST_CHECK = 'M10 21 L14.3 25 L23 15.25'

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
      <path d={MERGE_RAILS} stroke="currentColor" strokeWidth="3" />
      <path d={ATTEST_CHECK} className="stroke-accent" strokeWidth="3" />
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
