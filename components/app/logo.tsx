import { cn } from '@/lib/utils'

// Pen-nib monogram: a fountain-pen nib (slit + vent hole) reads as the mark of
// an author — a nod to "Auteur", the author behind the work. The apex also
// forms an "A".
const NIB_BODY = 'M16 5 L25 25.5 L7 25.5 Z'
const NIB_SLIT = 'M16 12.5 V18.5'

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
      <path d={NIB_BODY} stroke="currentColor" strokeWidth="2.6" />
      <path d={NIB_SLIT} className="stroke-accent" strokeWidth="2.6" />
      <circle cx="16" cy="20.9" r="1.5" className="fill-accent" />
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
