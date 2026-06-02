'use client'

import { useMemo } from 'react'
import { useTheme } from 'next-themes'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AdminChartDatum } from '@/components/charts/admin-charts'

type ChartPalette = {
  accent: string
  grid: string
  axis: string
  surface: string
  border: string
  foreground: string
}

// Fallbacks mirror the tokens in app/globals.css; the live values are read
// from CSS custom properties so the chart tracks the design system.
const fallbackPalette: ChartPalette = {
  accent: 'oklch(0.51 0.2 277)',
  grid: 'oklch(0.873 0.012 264)',
  axis: 'oklch(0.57 0.026 264)',
  surface: 'oklch(0.998 0.001 264)',
  border: 'oklch(0.765 0.018 264)',
  foreground: 'oklch(0.155 0.013 264)',
}

function readPalette(): ChartPalette {
  if (typeof document === 'undefined') return fallbackPalette
  const styles = getComputedStyle(document.documentElement)
  const read = (token: string, fallback: string) =>
    styles.getPropertyValue(token).trim() || fallback
  return {
    accent: read('--accent', fallbackPalette.accent),
    grid: read('--border', fallbackPalette.grid),
    axis: read('--subtle-foreground', fallbackPalette.axis),
    surface: read('--surface-elevated', fallbackPalette.surface),
    border: read('--border-strong', fallbackPalette.border),
    foreground: read('--foreground', fallbackPalette.foreground),
  }
}

export function AdminChartInner({
  kind,
  data,
}: {
  kind: 'area' | 'bar'
  data: AdminChartDatum[]
}) {
  // Re-read tokens when the resolved theme changes so the chart recolors on the
  // light/dark toggle (the CSS custom properties flip with the .dark class).
  const { resolvedTheme } = useTheme()
  const palette = useMemo(
    () => readPalette(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolvedTheme],
  )

  const axisProps = {
    tickLine: false,
    axisLine: false,
    tick: { fontSize: 12, fill: palette.axis },
  } as const

  const tooltipProps = {
    cursor: { fill: palette.grid, stroke: palette.grid },
    contentStyle: {
      borderRadius: 6,
      border: `1px solid ${palette.border}`,
      backgroundColor: palette.surface,
      color: palette.foreground,
      fontSize: 12,
      boxShadow: 'none',
    },
  } as const

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={240}
      >
        {kind === 'area' ? (
          <AreaChart
            data={data}
            margin={{ left: -20, right: 16, top: 10, bottom: 0 }}
          >
            <CartesianGrid
              stroke={palette.grid}
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis allowDecimals={false} {...axisProps} />
            <Tooltip {...tooltipProps} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={palette.accent}
              strokeWidth={2}
              fill={palette.accent}
              fillOpacity={0.12}
              dot={{ r: 2, fill: palette.accent }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        ) : (
          <BarChart
            data={data}
            margin={{ left: -20, right: 16, top: 10, bottom: 0 }}
          >
            <CartesianGrid
              stroke={palette.grid}
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis allowDecimals={false} {...axisProps} />
            <Tooltip {...tooltipProps} />
            <Bar
              dataKey="value"
              fill={palette.accent}
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
