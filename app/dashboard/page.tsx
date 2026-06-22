import { Suspense } from 'react'
import Link from 'next/link'
import { EmptyState, ResultSummary } from '@/components/app/empty-state'
import {
  GovernancePosture,
  type AttentionItem,
  type PostureLevel,
  type PostureSignal,
} from '@/components/app/governance-posture'
import { OnboardingChecklist } from '@/components/app/onboarding-checklist'
import { PageHeader } from '@/components/app/page-header'
import { DashboardSkeleton } from '@/components/app/page-loading'
import { RiskScoreBar } from '@/components/app/risk-score'
import { CiBadge, RiskBadge, TestGapBadge } from '@/components/app/status-badge'
import { GovernanceTrendChart } from '@/components/charts/dashboard-charts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  buildTrendData,
  getCurrentOrganization,
  listActivityEvents,
  listPullRequests,
  listRepositories,
} from '@/lib/data/app-data'
import { githubConfigured } from '@/lib/github'
import { getOnboardingStatus } from '@/lib/onboarding'
import { buildReportingMetrics, buildSignalTrends } from '@/lib/reporting'
import { cn, formatDate, formatNumber } from '@/lib/utils'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Operational view of AI-assisted pull requests, test gaps, approval pressure, and risky changes."
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}

async function DashboardContent() {
  const organization = await getCurrentOrganization()
  const [repositories, pullRequests, activityEvents] = await Promise.all([
    listRepositories(organization.id),
    listPullRequests(organization.id),
    listActivityEvents(organization.id, { take: 8 }),
  ])
  const trendData = pullRequests.length ? buildTrendData(pullRequests) : []
  const onboardingStatus = getOnboardingStatus({
    dataMode: organization.dataMode,
    githubConfigured: githubConfigured(),
    hasGitHubInstallation: Boolean(organization.githubInstallationId),
    repositoryCount: repositories.length,
    pullRequestCount: pullRequests.length,
  })
  const highAttentionPullRequests = pullRequests
    .filter((item) => item.riskScore >= 45 || item.testGapStatus !== 'none')
    .slice(0, 7)
  const averageRiskScore = pullRequests.length
    ? Math.round(
        pullRequests.reduce((total, item) => total + item.riskScore, 0) /
          pullRequests.length,
      )
    : 0
  const reportingMetrics = buildReportingMetrics(pullRequests)
  const signalTrends = buildSignalTrends(pullRequests)
  const aiReviewMetrics = reportingMetrics.aiReviews
  const metrics = {
    repositoriesConnected: repositories.length,
    aiPrsThisWeek: pullRequests.filter((item) => item.aiAssisted).length,
    highRiskPrs: pullRequests.filter(
      (item) => item.riskLevel === 'high' || item.riskLevel === 'critical',
    ).length,
    prsWithTestGaps: pullRequests.filter(
      (item) => item.testGapStatus !== 'none',
    ).length,
    pendingApprovals: pullRequests.filter(
      (item) => item.approvalStatus === 'pending',
    ).length,
    failedCiChecks: pullRequests.filter((item) => item.ciStatus === 'failing')
      .length,
    averageRiskScore,
    ruleViolations: pullRequests.reduce(
      (total, item) => total + item.ruleViolations.length,
      0,
    ),
  }

  const signals: PostureSignal[] = [
    {
      key: 'pendingApprovals',
      label: 'Pending approvals',
      value: metrics.pendingApprovals,
      description: 'Decisions waiting on a reviewer',
      tone: metrics.pendingApprovals > 0 ? 'accent' : 'neutral',
      ...signalTrends.pendingApprovals,
    },
    {
      key: 'highRiskPrs',
      label: 'High-risk PRs',
      value: metrics.highRiskPrs,
      description: 'High or critical risk score',
      tone: metrics.highRiskPrs > 0 ? 'danger' : 'success',
      ...signalTrends.highRiskPrs,
    },
    {
      key: 'failedCi',
      label: 'Failed CI checks',
      value: metrics.failedCiChecks,
      description: 'Blocking merge confidence',
      tone: metrics.failedCiChecks > 0 ? 'warning' : 'success',
      ...signalTrends.failedCi,
    },
    {
      key: 'testGaps',
      label: 'PRs with test gaps',
      value: metrics.prsWithTestGaps,
      description: 'Suggested test coverage',
      tone: metrics.prsWithTestGaps > 0 ? 'warning' : 'success',
      ...signalTrends.testGaps,
    },
  ]

  const hardBlockers =
    metrics.highRiskPrs + metrics.failedCiChecks + metrics.ruleViolations
  const reviewQueue = metrics.pendingApprovals + metrics.prsWithTestGaps
  const postureLevel: PostureLevel =
    hardBlockers > 0 ? 'action' : reviewQueue > 0 ? 'attention' : 'clear'
  const postureSummary =
    postureLevel === 'clear'
      ? 'Every monitored pull request has cleared its risk, test, CI, and approval gates.'
      : postureLevel === 'action'
        ? 'Blocking signals are open on AI-assisted changes. Clear them before these merge to production.'
        : 'Review work is queued. No hard blockers, but these changes still need a human decision.'
  const attentionItems: AttentionItem[] = []
  if (metrics.highRiskPrs > 0)
    attentionItems.push({
      label: 'high-risk',
      count: metrics.highRiskPrs,
      href: '/pull-requests',
      tone: 'danger',
    })
  if (metrics.failedCiChecks > 0)
    attentionItems.push({
      label: 'failing CI',
      count: metrics.failedCiChecks,
      href: '/pull-requests',
      tone: 'warning',
    })
  if (metrics.ruleViolations > 0)
    attentionItems.push({
      label: 'rule violations',
      count: metrics.ruleViolations,
      href: '/pull-requests',
      tone: 'danger',
    })
  if (metrics.pendingApprovals > 0)
    attentionItems.push({
      label: 'awaiting approval',
      count: metrics.pendingApprovals,
      href: '/approvals?approvalStatus=pending',
      tone: 'warning',
    })
  if (metrics.prsWithTestGaps > 0)
    attentionItems.push({
      label: 'missing tests',
      count: metrics.prsWithTestGaps,
      href: '/pull-requests',
      tone: 'warning',
    })

  const secondaryMetrics = [
    {
      label: 'Repositories',
      value: metrics.repositoriesConnected,
      description: 'Connected sources',
    },
    {
      label: 'AI PRs',
      value: metrics.aiPrsThisWeek,
      description: 'AI-assisted volume',
    },
    {
      label: 'Average risk',
      value: metrics.averageRiskScore,
      description: 'Across open PRs',
    },
    {
      label: 'Rule violations',
      value: metrics.ruleViolations,
      description: 'Policy signals',
    },
  ]

  const aiReviewCards = [
    {
      label: 'AI reviews completed',
      value: aiReviewMetrics.completed,
      description: 'Finished review jobs',
      tone: 'success' as const,
    },
    {
      label: 'AI reviews blocked',
      value: aiReviewMetrics.blocked,
      description: 'Needs configuration or plan action',
      tone:
        aiReviewMetrics.blocked > 0
          ? ('warning' as const)
          : ('neutral' as const),
    },
    {
      label: 'AI reviews failed',
      value: aiReviewMetrics.failed,
      description: 'Provider or worker failures',
      tone:
        aiReviewMetrics.failed > 0 ? ('danger' as const) : ('neutral' as const),
    },
    {
      label: 'AI comments',
      value: aiReviewMetrics.commentsPosted,
      description: `${formatNumber(aiReviewMetrics.commentsFiltered)} filtered`,
      tone: 'neutral' as const,
    },
  ]

  return (
    <div className="space-y-8">
      <OnboardingChecklist status={onboardingStatus} />

      <GovernancePosture
        level={postureLevel}
        summary={postureSummary}
        attention={attentionItems}
        signals={signals}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <StatPanel title="Workspace volume" stats={secondaryMetrics} />
        <StatPanel title="AI review activity" stats={aiReviewCards} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Compliance reporting</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              ['Risky PR volume', reportingMetrics.riskyPullRequestVolume],
              ['Test gap volume', reportingMetrics.testGapVolume],
              ['AI-assisted PRs', reportingMetrics.aiAssistedVolume],
              [
                'Avg approval latency',
                `${reportingMetrics.averageApprovalLatencyHours}h`,
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-control border border-border bg-surface-muted/40 p-4"
              >
                <div className="text-eyebrow text-subtle-foreground">
                  {label}
                </div>
                <div className="mt-2 text-xl font-semibold tabular-nums tracking-tight text-foreground">
                  {value}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Noisy rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reportingMetrics.noisyRules.length ? (
              reportingMetrics.noisyRules.map((rule) => (
                <div
                  key={rule.ruleName}
                  className="flex items-center justify-between rounded-control border border-border bg-surface-muted/30 px-3 py-2.5 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {rule.ruleName}
                  </span>
                  <span className="rounded-pill bg-surface px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground ring-1 ring-border">
                    {rule.count} triggers
                  </span>
                </div>
              ))
            ) : (
              <EmptyState
                title="No noisy rules yet"
                description="Rule trigger data will appear after repositories have synced pull requests."
                className="py-6"
              />
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Signal trends</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Average risk score against test-gap volume across the trailing
              window.
            </p>
          </div>
          {trendData.length ? (
            <span className="text-eyebrow shrink-0 text-subtle-foreground">
              {trendData.length} reporting periods
            </span>
          ) : null}
        </CardHeader>
        <CardContent>
          {trendData.length ? (
            <GovernanceTrendChart data={trendData} />
          ) : (
            <EmptyState
              title="No trend data yet"
              description="Synced pull requests will populate risk and test-gap trends here."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Repository risk profiles</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-5 pt-5">
            <ResultSummary
              count={reportingMetrics.repositoryRiskProfiles.length}
              label="repository profiles"
              detail="Ranked by average risk and risky PR count"
            />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <caption className="sr-only">
                Repository risk profiles ranked by average risk and risky pull
                requests
              </caption>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository</TableHead>
                  <TableHead>Average risk</TableHead>
                  <TableHead>Risky PRs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportingMetrics.repositoryRiskProfiles.map((profile) => (
                  <TableRow key={profile.repositoryName}>
                    <TableCell className="font-medium text-foreground">
                      {profile.repositoryName}
                    </TableCell>
                    <TableCell>{profile.averageRiskScore}</TableCell>
                    <TableCell>{profile.riskyPullRequests}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {reportingMetrics.repositoryRiskProfiles.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No repository risk profiles yet"
                description="Repository risk profiles will appear after pull requests are synced."
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>High-attention pull requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-5 pt-5">
              <ResultSummary
                count={highAttentionPullRequests.length}
                label="pull requests"
                detail="High risk or missing test coverage"
              />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <caption className="sr-only">
                  High-attention pull requests with risk, tests, and CI status
                </caption>
                <TableHeader>
                  <TableRow>
                    <TableHead>PR</TableHead>
                    <TableHead>Repo</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Tests</TableHead>
                    <TableHead>CI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {highAttentionPullRequests.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="min-w-72">
                        <Link
                          className="font-medium text-foreground hover:text-accent"
                          href={`/pull-requests/${item.id}`}
                        >
                          #{item.number} {item.title}
                        </Link>
                        <div className="mt-0.5 text-xs text-subtle-foreground">
                          {item.author}
                        </div>
                      </TableCell>
                      <TableCell>{item.repositoryName}</TableCell>
                      <TableCell>
                        <RiskScoreBar
                          level={item.riskLevel}
                          score={item.riskScore}
                        />
                      </TableCell>
                      <TableCell>
                        <TestGapBadge status={item.testGapStatus} />
                      </TableCell>
                      <TableCell>
                        <CiBadge status={item.ciStatus} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {highAttentionPullRequests.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="No high-attention pull requests"
                  description="Sync repositories to populate this queue."
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent agent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-control border border-border bg-surface-muted/30 p-3.5 transition-colors hover:bg-surface-muted/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-foreground">
                    {event.repositoryName}
                  </div>
                  <RiskBadge level={event.riskLevel} />
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {event.summary}
                </p>
                <p className="mt-2 text-xs text-subtle-foreground">
                  {event.agentSource.replace('_', ' ')} · {event.actor} ·{' '}
                  {formatDate(event.timestamp)}
                </p>
              </div>
            ))}
            {activityEvents.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="Sync repositories or process GitHub webhooks to populate the timeline."
                actions={
                  <Link
                    href="/repositories"
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    View repositories
                  </Link>
                }
              />
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

const statToneDot: Record<string, string> = {
  neutral: 'bg-border-strong',
  accent: 'bg-accent',
  danger: 'bg-danger',
  warning: 'bg-attention',
  success: 'bg-success',
}

function StatPanel({
  title,
  stats,
}: {
  title: string
  stats: ReadonlyArray<{
    label: string
    value: number
    description: string
    tone?: 'neutral' | 'accent' | 'danger' | 'warning' | 'success'
  }>
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-px bg-border p-px">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface-elevated p-4">
            <div className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn(
                  'size-1.5 rounded-full',
                  statToneDot[stat.tone ?? 'neutral'],
                )}
              />
              <p className="text-eyebrow text-subtle-foreground">
                {stat.label}
              </p>
            </div>
            <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight text-foreground">
              {formatNumber(stat.value)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {stat.description}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
