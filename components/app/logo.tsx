import { cn } from '@/lib/utils'

// "A" monogram: splayed legs read as a gateway arch,
// the accent crossbar is the scan beam crossing the gate.
const LEGS_PATH = 'M7 26.5 L16 5.5 L25 26.5'
const CROSSBAR_PATH = 'M10.6 18.1 H21.4'

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
      <path d={CROSSBAR_PATH} className="stroke-accent" strokeWidth="3" />
      <path d={LEGS_PATH} stroke="currentColor" strokeWidth="3" />
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
