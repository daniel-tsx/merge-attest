import { cn } from '@/lib/utils'

const SHIELD_PATH = 'M5 6.5 L16 3 L27 6.5 L27 15.5 Q27 23 16 29 Q5 23 5 15.5 Z'
const BOLT_PATH =
  'M18.2 8.5 L10.5 18.4 L15 18.4 L13.8 23.5 L21.5 13.6 L17 13.6 Z'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn('size-5', className)}
      fill="none"
    >
      <path d={SHIELD_PATH} fill="currentColor" opacity="0.16" />
      <path
        d={SHIELD_PATH}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d={BOLT_PATH} className="fill-accent" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LogoMark />
      <span className="text-sm font-semibold tracking-tight">AgentGate</span>
    </div>
  )
}
