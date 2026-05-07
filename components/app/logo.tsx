import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn('size-5', className)}
      fill="none"
    >
      <path
        d="M16 3 4.5 8v9.2c0 6.5 4.7 10.5 11.5 11.8 6.8-1.3 11.5-5.3 11.5-11.8V8L16 3Z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M16 3 4.5 8v9.2c0 6.5 4.7 10.5 11.5 11.8 6.8-1.3 11.5-5.3 11.5-11.8V8L16 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m11.2 16.6 3.4 3.4 6.4-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LogoMark />
      <span className="text-sm font-semibold tracking-tight">
        AgentGate
      </span>
    </div>
  )
}
