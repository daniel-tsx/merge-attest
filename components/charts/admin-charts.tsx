'use client'

import dynamic from 'next/dynamic'

export type AdminChartDatum = { label: string; value: number }

const AdminChartInner = dynamic(
  () =>
    import('@/components/charts/admin-charts-inner').then(
      (mod) => mod.AdminChartInner,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full rounded-card bg-surface-muted" />
    ),
  },
)

export function AdminAreaChart({ data }: { data: AdminChartDatum[] }) {
  return <AdminChartInner kind="area" data={data} />
}

export function AdminBarChart({ data }: { data: AdminChartDatum[] }) {
  return <AdminChartInner kind="bar" data={data} />
}
