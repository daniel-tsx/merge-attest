import { getPlanEntitlements } from '@/lib/entitlements'
import { buildAuthorshipLedger, type AuthorshipLedger } from '@/lib/reporting'
import type { PlanKey, PullRequest } from '@/lib/types'

const EVIDENCE_NOTICE =
  'Evidence supporting EU AI Act human-oversight (Art. 14) and SOC2 change-management review. Generated from deterministic MergeAttest signals — not a certification.'

const ledgerCsvHeaders = [
  'agent',
  'pull_requests',
  'share_pct',
  'lines_added',
  'merged_reviewed',
  'merged_bypassed',
  'avg_risk_score',
] as const

function csvCell(value: string | number | boolean | null | undefined) {
  const stringValue = value === null || value === undefined ? '' : String(value)
  const safeValue = /^[=+\-@\t\r]/.test(stringValue)
    ? `'${stringValue}`
    : stringValue
  return `"${safeValue.replaceAll('"', '""')}"`
}

export function serializeAuthorshipLedgerCsv(ledger: AuthorshipLedger): string {
  const rows = ledger.byAgent.map((entry) =>
    [
      entry.agentSource,
      entry.count,
      entry.pct,
      entry.linesAdded,
      entry.reviewedCount,
      entry.bypassedCount,
      entry.avgRiskScore,
    ]
      .map(csvCell)
      .join(','),
  )
  return [ledgerCsvHeaders.join(','), ...rows].join('\n')
}

export type ComplianceEvidenceBundle = {
  notice: string
  generatedAt: string
  organization: { id: string; name: string; planKey: PlanKey }
  retention: { auditRetentionDays: number | null; windowStart?: string }
  summary: AuthorshipLedger['totals'] & AuthorshipLedger['reviewCoverage']
  byAgent: AuthorshipLedger['byAgent']
  pullRequests: Array<{
    repository: string
    number: number
    title: string
    agentSource: string
    aiAssisted: boolean | null
    attributionConfidence: number
    attributionEvidence: string[]
    riskLevel: string
    riskScore: number
    status: string
    approvalStatus: string
    reviewer: string | null
    createdAt: string
    updatedAt: string
  }>
}

export function buildAuthorshipEvidenceBundle(input: {
  organization: { id: string; name: string; planKey: PlanKey }
  pullRequests: PullRequest[]
  retentionWindowStart?: string
  generatedAt?: string
}): ComplianceEvidenceBundle {
  const ledger = buildAuthorshipLedger(input.pullRequests)
  const auditRetentionDays = getPlanEntitlements(
    input.organization.planKey,
  ).auditRetentionDays

  return {
    notice: EVIDENCE_NOTICE,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    organization: input.organization,
    retention: {
      auditRetentionDays,
      windowStart: input.retentionWindowStart,
    },
    summary: { ...ledger.totals, ...ledger.reviewCoverage },
    byAgent: ledger.byAgent,
    pullRequests: input.pullRequests.map((pullRequest) => ({
      repository: pullRequest.repositoryName,
      number: pullRequest.number,
      title: pullRequest.title,
      agentSource: pullRequest.agentSource,
      aiAssisted: pullRequest.aiAssisted,
      attributionConfidence: pullRequest.attributionConfidence,
      attributionEvidence: pullRequest.attributionEvidence.map(
        (evidence) => `${evidence.signal}: ${evidence.detail}`,
      ),
      riskLevel: pullRequest.riskLevel,
      riskScore: pullRequest.riskScore,
      status: pullRequest.status,
      approvalStatus: pullRequest.approvalStatus,
      reviewer:
        pullRequest.approvals.find(
          (approval) =>
            approval.decision === 'approved' ||
            approval.decision === 'risk_accepted',
        )?.reviewer ?? null,
      createdAt: pullRequest.createdAt,
      updatedAt: pullRequest.updatedAt,
    })),
  }
}
