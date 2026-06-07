import { Suspense } from 'react'
import { Download, Fingerprint, ShieldCheck } from 'lucide-react'
import { AgentBadge } from '@/components/app/status-badge'
import { EmptyState } from '@/components/app/empty-state'
import { PageHeader } from '@/components/app/page-header'
import { TrendChart } from '@/components/charts/dashboard-charts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getCurrentOrganization, listPullRequests } from '@/lib/data/app-data'
import {
  buildAgentScorecards,
  type AgentScorecardEntry,
} from '@/lib/agents/scorecard'
import { buildAuthorshipLedger, type AuthorshipLedger } from '@/lib/reporting'
import { isFeatureAvailable } from '@/lib/plans'
import { formatNumber } from '@/lib/utils'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Reports"
        description="AI authorship across your repositories and each agent's trust track record. Signals are deterministic — every number is explainable."
      />
      <Suspense fallback={<ReportsSkeleton />}>
        <ReportsContent />
      </Suspense>
    </div>
  )
}

async function ReportsContent() {
  const organization = await getCurrentOrganization()
  const pullRequests = await listPullRequests(organization.id)
  const ledger = buildAuthorshipLedger(pullRequests)
  const scorecards = buildAgentScorecards(pullRequests)
  const exportAvailable = isFeatureAvailable(
    organization.planKey,
    'auditExport',
  )

  return (
    <div className="space-y-6">
      <AuthorshipLedgerCard ledger={ledger} exportAvailable={exportAvailable} />
      <ScorecardCard scorecards={scorecards} />
    </div>
  )
}

function pct(value: number) {
  return `${value}%`
}

function AuthorshipLedgerCard({
  ledger,
  exportAvailable,
}: {
  ledger: AuthorshipLedger
  exportAvailable: boolean
}) {
  const { totals, reviewCoverage } = ledger
  const summary = [
    {
      label: 'AI-authored PRs',
      value: pct(totals.aiAuthoredPct),
      detail: `${totals.aiAuthored} of ${totals.total}`,
    },
    {
      label: 'AI line share',
      value: pct(totals.aiLinePct),
      detail: `${formatNumber(totals.aiLinesAdded)} added lines`,
    },
    {
      label: 'Reviewed AI merges',
      value: pct(reviewCoverage.reviewedPct),
      detail: `${reviewCoverage.aiMergedReviewed} of ${reviewCoverage.aiMerged} merged`,
    },
    {
      label: 'Merged without sign-off',
      value: formatNumber(reviewCoverage.aiMergedBypassed),
      detail: 'AI merges lacking human approval',
    },
  ]
  const hasTrend = ledger.trend.some((point) => point.total > 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="inline-flex items-center gap-2">
              <Fingerprint className="size-4 text-accent" aria-hidden="true" />
              AI authorship ledger
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Share of pull requests and added lines authored by AI agents, and
              how much merged AI work carried a human sign-off. Counts are PR-
              and line-volume based, not intra-file blame.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
            {exportAvailable ? (
              <div className="flex gap-2">
                <Button asChild variant="secondary" size="sm">
                  <a href="/api/compliance/authorship/export?format=csv">
                    <Download aria-hidden="true" />
                    CSV
                  </a>
                </Button>
                <Button asChild variant="secondary" size="sm">
                  <a href="/api/compliance/authorship/export?format=json">
                    <Download aria-hidden="true" />
                    Evidence JSON
                  </a>
                </Button>
              </div>
            ) : (
              <>
                <Button variant="secondary" size="sm" disabled>
                  <Download aria-hidden="true" />
                  Compliance export
                </Button>
                <a
                  href="/settings/billing"
                  className="text-[11px] font-medium text-accent hover:underline"
                >
                  View launch limits
                </a>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {summary.map((item) => (
            <div
              key={item.label}
              className="rounded-control border border-border bg-surface-muted/40 p-4"
            >
              <div className="text-eyebrow text-subtle-foreground">
                {item.label}
              </div>
              <div className="mt-2 text-xl font-semibold tabular-nums tracking-tight text-foreground">
                {item.value}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {item.detail}
              </div>
            </div>
          ))}
        </div>

        {hasTrend ? (
          <div className="space-y-2">
            <div className="text-eyebrow text-subtle-foreground">
              AI-authored share over time
            </div>
            <TrendChart data={ledger.trend} metric="aiAuthoredPct" />
          </div>
        ) : null}

        {ledger.byAgent.length ? (
          <div className="overflow-x-auto">
            <Table>
              <caption className="sr-only">
                Authorship volume and review coverage by agent
              </caption>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">PRs</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                  <TableHead className="text-right">Lines</TableHead>
                  <TableHead className="text-right">Reviewed</TableHead>
                  <TableHead className="text-right">No sign-off</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.byAgent.map((entry) => (
                  <TableRow key={entry.agentSource}>
                    <TableCell>
                      <AgentBadge agentSource={entry.agentSource} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {entry.count}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {pct(entry.pct)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(entry.linesAdded)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-success-strong">
                      {entry.reviewedCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-danger">
                      {entry.bypassedCount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={Fingerprint}
            title="No authorship data yet"
            description="Sync repositories to attribute pull requests and build the ledger."
            className="py-8"
          />
        )}
      </CardContent>
    </Card>
  )
}

function trustTone(score: number) {
  if (score >= 80) return { bar: 'bg-success', text: 'text-success-strong' }
  if (score >= 60) return { bar: 'bg-accent', text: 'text-foreground' }
  if (score >= 40) return { bar: 'bg-attention', text: 'text-attention' }
  return { bar: 'bg-danger', text: 'text-danger' }
}

function ScorecardCard({ scorecards }: { scorecards: AgentScorecardEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent trust scorecard</CardTitle>
        <p className="text-xs text-muted-foreground">
          Trust starts at 100 and is reduced by high-risk volume, test gaps,
          rule violations, reverts, and merges without human sign-off. Reverts
          are detected from pull requests that reference an earlier PR.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {scorecards.length ? (
          scorecards.map((entry) => (
            <ScorecardRow key={entry.agentSource} entry={entry} />
          ))
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title="No agent activity yet"
            description="Sync repositories to attribute pull requests and build per-agent trust scores."
            className="py-8"
          />
        )}
      </CardContent>
    </Card>
  )
}

function ScorecardRow({ entry }: { entry: AgentScorecardEntry }) {
  const tone = trustTone(entry.trustScore)
  const metrics: Array<{ label: string; value: string }> = [
    { label: 'PRs', value: String(entry.total) },
    { label: 'High risk', value: pct(Math.round(entry.highRiskRate * 100)) },
    { label: 'Test gaps', value: pct(Math.round(entry.testGapRate * 100)) },
    {
      label: 'Rule hits',
      value: pct(Math.round(entry.ruleViolationRate * 100)),
    },
    { label: 'Reverted', value: pct(Math.round(entry.revertedRate * 100)) },
    { label: 'No sign-off', value: pct(Math.round(entry.bypassedRate * 100)) },
    {
      label: 'Avg approval',
      value: entry.avgApprovalLatencyHours
        ? `${entry.avgApprovalLatencyHours}h`
        : '—',
    },
  ]

  return (
    <div className="rounded-card border border-border bg-surface-muted/20 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <AgentBadge agentSource={entry.agentSource} />
          <div className="min-w-44 space-y-1.5">
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-semibold tabular-nums tracking-tight ${tone.text}`}
              >
                {entry.trustScore}
              </span>
              <span className="text-xs text-subtle-foreground">
                / 100 trust
              </span>
            </div>
            <Progress
              value={entry.trustScore}
              indicatorClassName={tone.bar}
              aria-label={`Trust score ${entry.trustScore} of 100`}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-x-5 gap-y-2 sm:grid-cols-4 lg:grid-cols-7">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <div className="text-[11px] uppercase tracking-wider text-subtle-foreground">
                {metric.label}
              </div>
              <div className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                {metric.value}
              </div>
            </div>
          ))}
        </div>
      </div>
      {entry.penalties.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-divider pt-3">
          <span className="text-[11px] uppercase tracking-wider text-subtle-foreground">
            Deductions
          </span>
          {entry.penalties.map((penalty) => (
            <span
              key={penalty.label}
              className="rounded-pill bg-surface px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border"
            >
              {penalty.label} −{penalty.points}
            </span>
          ))}
        </div>
      ) : (
        <div className="mt-3 border-t border-divider pt-3 text-[11px] text-success-strong">
          Clean record — no deductions.
        </div>
      )}
    </div>
  )
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading reports">
      {Array.from({ length: 2 }).map((_, card) => (
        <Card key={card}>
          <CardHeader>
            <Skeleton className="h-4 w-44" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, row) => (
              <Skeleton key={row} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
