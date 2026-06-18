'use client'

import { useMemo } from 'react'
import { useTheme } from 'next-themes'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type ChartPalette = {
  risk: string
  testGaps: string
  aiAuthored: string
  grid: string
  axis: string
  surface: string
  border: string
  foreground: string
}

// Fallbacks mirror the tokens in app/globals.css; the live values are read
// from CSS custom properties so the chart tracks the design system.
const fallbackPalette: ChartPalette = {
  risk: 'oklch(0.505 0.17 25)',
  testGaps: 'oklch(0.545 0.145 45)',
  aiAuthored: 'oklch(0.56 0.105 208)',
  grid: 'oklch(0.872 0.014 250)',
  axis: 'oklch(0.565 0.03 252)',
  surface: 'oklch(0.998 0.002 250)',
  border: 'oklch(0.76 0.022 250)',
  foreground: 'oklch(0.17 0.022 252)',
}

function readPalette(): ChartPalette {
  if (typeof document === 'undefined') return fallbackPalette
  const styles = getComputedStyle(document.documentElement)
  const read = (token: string, fallback: string) =>
    styles.getPropertyValue(token).trim() || fallback
  return {
    risk: read('--danger', fallbackPalette.risk),
    testGaps: read('--attention', fallbackPalette.testGaps),
    aiAuthored: read('--accent', fallbackPalette.aiAuthored),
    grid: read('--border', fallbackPalette.grid),
    axis: read('--subtle-foreground', fallbackPalette.axis),
    surface: read('--surface-elevated', fallbackPalette.surface),
    border: read('--border-strong', fallbackPalette.border),
    foreground: read('--foreground', fallbackPalette.foreground),
  }
}

export function TrendChartInner({
  data,
  metric,
}: {
  data: Array<Record<string, string | number>>
  metric: 'risk' | 'testGaps' | 'aiAuthoredPct'
}) {
  // Re-read tokens whenever the resolved theme changes so the chart recolors
  // on light/dark toggle. readPalette() reads CSS custom properties that flip
  // with the .dark class, so resolvedTheme is the intended recompute trigger.
  const { resolvedTheme } = useTheme()
  const palette = useMemo(
    () => readPalette(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolvedTheme],
  )
  const color =
    metric === 'risk'
      ? palette.risk
      : metric === 'testGaps'
        ? palette.testGaps
        : palette.aiAuthored

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={240}
      >
        <LineChart
          data={data}
          margin={{ left: -20, right: 16, top: 10, bottom: 0 }}
        >
          <CartesianGrid
            stroke={palette.grid}
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: palette.axis }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: palette.axis }}
          />
          <Tooltip
            cursor={{ stroke: palette.grid }}
            contentStyle={{
              borderRadius: 6,
              border: `1px solid ${palette.border}`,
              backgroundColor: palette.surface,
              color: palette.foreground,
              fontSize: 12,
              boxShadow: 'none',
            }}
          />
          <Line
            type="monotone"
            dataKey={metric}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
