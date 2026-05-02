import {
  Activity,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  GitPullRequest,
  ListChecks,
  ShieldAlert,
  TestTube2,
} from 'lucide-react'
import Link from 'next/link'
import { EmptyState, ResultSummary } from '@/components/app/empty-state'
import { OnboardingChecklist } from '@/components/app/onboarding-checklist'
import { PageHeader } from '@/components/app/page-header'
import { CiBadge, RiskBadge, TestGapBadge } from '@/components/app/status-badge'
import { TrendChart } from '@/components/charts/dashboard-charts'
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
import { buildReportingMetrics } from '@/lib/reporting'
import { formatDate, formatNumber } from '@/lib/utils'

const metricIcons = [
  Boxes,
  GitPullRequest,
  ShieldAlert,
  TestTube2,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ListChecks,
]

export default async function DashboardPage() {
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
  const metricCards = [
    ['Pending approvals', metrics.pendingApprovals, 'Decisions waiting'],
    ['High-risk PRs', metrics.highRiskPrs, 'Needs attention'],
    ['Failed CI checks', metrics.failedCiChecks, 'Blocking confidence'],
    ['PRs with test gaps', metrics.prsWithTestGaps, 'Needs test review'],
    ['Repositories', metrics.repositoriesConnected, 'Connected sources'],
    ['AI PRs this week', metrics.aiPrsThisWeek, 'AI-assisted volume'],
    ['Average risk score', metrics.averageRiskScore, 'Across open PRs'],
    ['Rule violations', metrics.ruleViolations, 'Policy signals'],
  ] as const

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Operational view of AI-assisted pull requests, test gaps, approval pressure, and risky changes."
      />
      <OnboardingChecklist status={onboardingStatus} />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map(([label, value, description], index) => {
          const Icon = metricIcons[index]
          return (
            <Card
              key={label}
              className={index < 4 ? 'border-border-strong' : undefined}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {formatNumber(value)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {description}
                  </p>
                </div>
                <Icon
                  className="size-5 text-subtle-foreground"
                  aria-hidden="true"
                />
              </CardContent>
            </Card>
          )
        })}
      </section>
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Reporting</CardTitle>
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
                className="rounded-control border border-border bg-surface-muted p-3"
              >
                <div className="text-xs uppercase text-muted-foreground">
                  {label}
                </div>
                <div className="mt-2 text-xl font-semibold text-foreground">
                  {value}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Noisy Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reportingMetrics.noisyRules.length ? (
              reportingMetrics.noisyRules.map((rule) => (
                <div
                  key={rule.ruleName}
                  className="flex items-center justify-between rounded-control border border-border p-3 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {rule.ruleName}
                  </span>
                  <span className="text-muted-foreground">
                    {rule.count} triggers
                  </span>
                </div>
              ))
            ) : (
              <EmptyState
                title="No noisy rules yet"
                description="Rule trigger data will appear after repositories have synced pull requests."
                className="p-4"
              />
            )}
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Risk Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Tracking average risk across {trendData.length} reporting
                  periods.
                </p>
                <TrendChart data={trendData} metric="risk" />
              </div>
            ) : (
              <EmptyState
                title="No risk trend data yet"
                description="Synced pull requests will populate this chart."
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Test Gap Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Showing detected test gaps across {trendData.length} reporting
                  periods.
                </p>
                <TrendChart data={trendData} metric="testGaps" />
              </div>
            ) : (
              <EmptyState
                title="No test-gap trend data yet"
                description="Synced pull requests will populate this chart."
              />
            )}
          </CardContent>
        </Card>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Repository Risk Profiles</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-4 pt-4">
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
                  <TableHead>Average Risk</TableHead>
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
            <div className="p-4">
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
            <CardTitle>High Attention Pull Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-4 pt-4">
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
                        <a
                          className="font-medium text-foreground hover:underline"
                          href={`/pull-requests/${item.id}`}
                        >
                          #{item.number} {item.title}
                        </a>
                        <div className="text-xs text-muted-foreground">
                          {item.author}
                        </div>
                      </TableCell>
                      <TableCell>{item.repositoryName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <RiskBadge level={item.riskLevel} />
                          <span className="text-xs text-muted-foreground">
                            {item.riskScore}
                          </span>
                        </div>
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
              <div className="p-4">
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
            <CardTitle>Recent Agent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-control border border-border p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-foreground">
                    {event.repositoryName}
                  </div>
                  <RiskBadge level={event.riskLevel} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {event.summary}
                </p>
                <p className="mt-2 text-xs text-subtle-foreground">
                  {event.agentSource.replace('_', ' ')} by {event.actor} ·{' '}
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
                    className="text-sm font-medium text-foreground hover:underline"
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
