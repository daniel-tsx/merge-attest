'use client'

import * as React from 'react'

// Matches formatNumber() in lib/utils so animated and static values align.
const numberFormat = new Intl.NumberFormat('en')

// Counts up to `value` on mount. SSR/first render shows the final value (no
// hydration mismatch); the animation is driven entirely inside rAF so there is
// no synchronous setState in the effect body. Honors reduced-motion.
export function AnimatedNumber({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  const [display, setDisplay] = React.useState(value)

  React.useEffect(() => {
    let raf = 0
    let startTime = 0
    const duration = 700
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const tick = (now: number) => {
      if (reduced) {
        setDisplay(value)
        return
      }
      if (!startTime) startTime = now
      const progress = Math.min(1, (now - startTime) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(value * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return <span className={className}>{numberFormat.format(display)}</span>
}
