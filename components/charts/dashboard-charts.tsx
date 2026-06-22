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

const GovernanceTrendInner = dynamic(
  () =>
    import('@/components/charts/governance-trend-inner').then(
      (mod) => mod.GovernanceTrendInner,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 w-full rounded-card bg-surface-muted" />
    ),
  },
)

export function TrendChart({
  data,
  metric,
}: {
  data: Array<Record<string, string | number>>
  metric: 'risk' | 'testGaps' | 'aiAuthoredPct'
}) {
  return <TrendChartInner data={data} metric={metric} />
}

export function GovernanceTrendChart({
  data,
}: {
  data: Array<{ date: string; risk: number; testGaps: number }>
}) {
  return <GovernanceTrendInner data={data} />
}
