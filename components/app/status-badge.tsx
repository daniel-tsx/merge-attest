import { Badge } from '@/components/ui/badge'
import type {
  ApprovalStatus,
  CiStatus,
  RiskLevel,
  TestGapStatus,
} from '@/lib/types'

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
