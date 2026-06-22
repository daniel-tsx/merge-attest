'use client'

import { useMemo } from 'react'
import { useTheme } from 'next-themes'
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Palette = {
  risk: string
  gaps: string
  grid: string
  axis: string
  surface: string
  border: string
  foreground: string
}

// Fallbacks mirror app/globals.css; live values come from CSS custom properties
// so the chart tracks the design system and recolors on theme toggle.
const fallback: Palette = {
  risk: 'oklch(0.505 0.17 25)',
  gaps: 'oklch(0.545 0.145 45)',
  grid: 'oklch(0.872 0.014 250)',
  axis: 'oklch(0.565 0.03 252)',
  surface: 'oklch(0.998 0.002 250)',
  border: 'oklch(0.76 0.022 250)',
  foreground: 'oklch(0.17 0.022 252)',
}

function readPalette(): Palette {
  if (typeof document === 'undefined') return fallback
  const styles = getComputedStyle(document.documentElement)
  const read = (token: string, value: string) =>
    styles.getPropertyValue(token).trim() || value
  return {
    risk: read('--danger', fallback.risk),
    gaps: read('--attention', fallback.gaps),
    grid: read('--border', fallback.grid),
    axis: read('--subtle-foreground', fallback.axis),
    surface: read('--surface-elevated', fallback.surface),
    border: read('--border-strong', fallback.border),
    foreground: read('--foreground', fallback.foreground),
  }
}

export function GovernanceTrendInner({
  data,
}: {
  data: Array<{ date: string; risk: number; testGaps: number }>
}) {
  const { resolvedTheme } = useTheme()
  const palette = useMemo(
    () => readPalette(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolvedTheme],
  )

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={272}>
        <ComposedChart
          data={data}
          margin={{ left: -12, right: -12, top: 8, bottom: 0 }}
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
            yAxisId="risk"
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
            width={40}
            tick={{ fontSize: 12, fill: palette.axis }}
          />
          <YAxis
            yAxisId="gaps"
            orientation="right"
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={32}
            tick={{ fontSize: 12, fill: palette.axis }}
          />
          <Tooltip
            cursor={{ fill: palette.grid, fillOpacity: 0.25 }}
            contentStyle={{
              borderRadius: 6,
              border: `1px solid ${palette.border}`,
              backgroundColor: palette.surface,
              color: palette.foreground,
              fontSize: 12,
              boxShadow: 'none',
            }}
            labelStyle={{ color: palette.foreground, fontWeight: 600 }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          <Bar
            yAxisId="gaps"
            dataKey="testGaps"
            name="PRs with test gaps"
            fill={palette.gaps}
            fillOpacity={0.55}
            radius={[3, 3, 0, 0]}
            maxBarSize={26}
          />
          <Area
            yAxisId="risk"
            type="monotone"
            dataKey="risk"
            name="Avg risk score"
            stroke={palette.risk}
            strokeWidth={2}
            fill={palette.risk}
            fillOpacity={0.1}
            dot={{ r: 2.5, fill: palette.risk, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
