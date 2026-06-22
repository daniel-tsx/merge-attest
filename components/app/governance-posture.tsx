import { AnimatedNumber } from '@/components/app/animated-number'
import { MetricTrend } from '@/components/app/metric-trend'
import {
  PostureHero,
  type HeroAttentionItem,
  type PostureGateState,
  type PostureGateTone,
  type PostureSignalTone,
  type PostureStatusTone,
} from '@/components/app/posture-hero'

export type PostureLevel = 'clear' | 'attention' | 'action'

export type AttentionItem = HeroAttentionItem

export type PostureSignal = {
  key: string
  label: string
  value: number
  description: string
  tone: PostureSignalTone
  series: number[]
  trend: 'up' | 'down' | 'flat'
}

const levelConfig: Record<
  PostureLevel,
  {
    verdict: string
    statusLabel: string
    statusTone: PostureStatusTone
    gateState: PostureGateState
    gateTone: PostureGateTone
  }
> = {
  clear: {
    verdict: 'All gates clear',
    statusLabel: 'Monitoring',
    statusTone: 'success',
    gateState: 'scan',
    gateTone: 'accent',
  },
  attention: {
    verdict: 'Needs review',
    statusLabel: 'Review queue',
    statusTone: 'warning',
    gateState: 'scan',
    gateTone: 'warning',
  },
  action: {
    verdict: 'Action required',
    statusLabel: 'Blocking signals',
    statusTone: 'danger',
    gateState: 'fissure',
    gateTone: 'danger',
  },
}

/**
 * Operational governance posture for the dashboard. Resolves the org's
 * deterministic signals into one verdict and renders the shared PostureHero
 * with sparkline-backed signal cards.
 */
export function GovernancePosture({
  level,
  summary,
  attention,
  signals,
}: {
  level: PostureLevel
  summary: string
  attention: AttentionItem[]
  signals: PostureSignal[]
}) {
  const config = levelConfig[level]

  return (
    <PostureHero
      ariaLabel="Governance posture"
      eyebrow="System posture"
      verdict={config.verdict}
      statusLabel={config.statusLabel}
      statusTone={config.statusTone}
      gateState={config.gateState}
      gateTone={config.gateTone}
      summary={summary}
      attention={attention}
      attentionEmpty="No blocking signals across monitored repositories."
      signals={signals.map((signal) => ({
        key: signal.key,
        label: signal.label,
        value: <AnimatedNumber value={signal.value} />,
        description: signal.description,
        tone: signal.tone,
        trailing: (
          <MetricTrend
            series={signal.series}
            trend={signal.trend}
            tone={signal.tone}
          />
        ),
      }))}
    />
  )
}
