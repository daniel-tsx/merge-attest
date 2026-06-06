import { cn } from '@/lib/utils'

// Two-tone "A" monogram for Auteur (the author's initial): apex, left stroke,
// and crossbar in the foreground tone; the right stroke in the brand accent.
const LEFT_STROKE = 'M6 26 L16 6'
const CROSSBAR = 'M10 18 H22'
const RIGHT_STROKE = 'M16 6 L26 26'

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
      <path d={CROSSBAR} stroke="currentColor" strokeWidth="3" />
      <path d={RIGHT_STROKE} className="stroke-accent" strokeWidth="3" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LogoMark />
      <span className="text-sm font-semibold tracking-tight">Auteur</span>
    </div>
  )
}
