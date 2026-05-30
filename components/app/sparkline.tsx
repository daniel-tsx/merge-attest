import { cn } from '@/lib/utils'

// Lightweight inline-SVG sparkline. Uses currentColor so the caller controls
// tone; no charting dependency. Decorative — callers provide the accessible
// label on the surrounding metric.
export function Sparkline({
  points,
  width = 72,
  height = 26,
  className,
}: {
  points: number[]
  width?: number
  height?: number
  className?: string
}) {
  if (points.length < 2) return null

  const pad = 3
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const usable = height - pad * 2
  const stepX = width / (points.length - 1)
  const coords = points.map((value, index) => {
    const x = index * stepX
    const y = pad + (1 - (value - min) / range) * usable
    return [x, y] as const
  })
  const line = coords
    .map(
      ([x, y], index) =>
        `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`,
    )
    .join(' ')
  const [lastX, lastY] = coords[coords.length - 1]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      fill="none"
      aria-hidden="true"
      className={cn('overflow-visible', className)}
    >
      <path
        d={`${line} L${width} ${height} L0 ${height} Z`}
        fill="currentColor"
        className="opacity-[0.08]"
      />
      <path
        d={line}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={1.75} fill="currentColor" />
    </svg>
  )
}
