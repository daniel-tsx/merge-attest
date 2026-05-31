import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { Sparkline } from '@/components/app/sparkline'
import { cn } from '@/lib/utils'

type MetricTone = 'neutral' | 'accent' | 'danger' | 'warning' | 'success'

const toneColor: Record<MetricTone, string> = {
  neutral: 'text-subtle-foreground',
  accent: 'text-accent',
  danger: 'text-danger',
  warning: 'text-attention',
  success: 'text-success',
}

const trendIcon = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
} as const

export function MetricTrend({
  series,
  trend,
  tone = 'neutral',
}: {
  series: number[]
  trend: 'up' | 'down' | 'flat'
  tone?: MetricTone
}) {
  const Icon = trendIcon[trend]
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={cn('inline-flex', toneColor[tone])}>
        <Sparkline points={series} />
      </span>
      <span className="inline-flex items-center gap-1 text-[11px] text-subtle-foreground">
        <Icon className="size-3" aria-hidden="true" />
        7-day
      </span>
    </div>
  )
}
