import { Badge } from '@/components/ui/badge'
import type {
  AgentSource,
  AiReviewStatus,
  ApprovalStatus,
  CiStatus,
  RiskLevel,
  TestGapStatus,
} from '@/lib/types'

export function AgentBadge({ agentSource }: { agentSource: AgentSource }) {
  const tone =
    agentSource === 'manual' || agentSource === 'unknown' ? 'slate' : 'blue'
  return (
    <Badge tone={tone} withDot>
      {agentSource.replaceAll('_', ' ')}
    </Badge>
  )
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const tone =
    level === 'critical'
      ? 'red'
      : level === 'high'
        ? 'orange'
        : level === 'medium'
          ? 'yellow'
          : 'green'
  return (
    <Badge tone={tone} withDot>
      {level}
    </Badge>
  )
}

export function TestGapBadge({ status }: { status: TestGapStatus }) {
  const tone =
    status === 'high' ? 'red' : status === 'warning' ? 'yellow' : 'green'
  return (
    <Badge tone={tone} withDot>
      {status === 'none' ? 'covered' : status}
    </Badge>
  )
}

export function CiBadge({ status }: { status: CiStatus }) {
  const tone =
    status === 'passing'
      ? 'green'
      : status === 'failing'
        ? 'red'
        : status === 'pending'
          ? 'yellow'
          : 'slate'
  return (
    <Badge tone={tone} withDot>
      {status}
    </Badge>
  )
}

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const tone =
    status === 'approved'
      ? 'green'
      : status === 'rejected'
        ? 'red'
        : status === 'pending'
          ? 'yellow'
          : 'slate'
  return (
    <Badge tone={tone} withDot>
      {status.replaceAll('_', ' ')}
    </Badge>
  )
}

export function AiReviewBadge({ status }: { status?: AiReviewStatus }) {
  if (!status) {
    return (
      <Badge tone="slate" withDot>
        not queued
      </Badge>
    )
  }

  const tone =
    status === 'completed'
      ? 'green'
      : status === 'failed'
        ? 'red'
        : status === 'blocked'
          ? 'orange'
          : status === 'skipped'
            ? 'slate'
            : 'blue'

  return (
    <Badge tone={tone} withDot>
      {status.replaceAll('_', ' ')}
    </Badge>
  )
}
