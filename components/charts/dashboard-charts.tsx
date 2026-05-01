'use client'

import dynamic from 'next/dynamic'

const TrendChartInner = dynamic(
  () =>
    import('@/components/charts/trend-chart-inner').then(
      (mod) => mod.TrendChartInner,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full rounded-card bg-surface-muted" />
    ),
  },
)

export function TrendChart({
  data,
  metric,
}: {
  data: Array<Record<string, string | number>>
  metric: 'risk' | 'testGaps'
}) {
  return <TrendChartInner data={data} metric={metric} />
}
