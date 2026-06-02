import { Suspense } from 'react'
import Link from 'next/link'
import {
  Boxes,
  Building2,
  CreditCard,
  DollarSign,
  GitPullRequest,
  TimerReset,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { AdminNav } from '@/components/app/admin-nav'
import { EmptyState } from '@/components/app/empty-state'
import { MetricCard } from '@/components/app/metric-card'
import { PageHeader } from '@/components/app/page-header'
import { DashboardSkeleton } from '@/components/app/page-loading'
import { AdminAreaChart, AdminBarChart } from '@/components/charts/admin-charts'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getAdminOverview } from '@/lib/admin/admin-data'
import {
  BILLING_LABELS,
  BILLING_STATUSES,
  PLAN_KEYS,
  PLAN_LABELS,
} from '@/lib/admin/labels'
import { formatDate, formatNumber } from '@/lib/utils'

const HEALTH_TONE = {
  ok: { tone: 'green' as const, label: 'Operational' },
  warning: { tone: 'yellow' as const, label: 'Warnings' },
  error: { tone: 'red' as const, label: 'Errors' },
}

function formatWeekLabel(iso: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Admin overview"
        description="Cross-tenant analytics across every AgentGate workspace: growth, revenue, plan mix, and platform health."
      />
      <AdminNav />
      <Suspense fallback={<DashboardSkeleton />}>
        <AdminOverviewContent />
      </Suspense>
    </div>
  )
}

async function AdminOverviewContent() {
  const overview = await getAdminOverview()
  if (!overview) {
    return (
      <EmptyState
        title="Admin data unavailable"
        description="A database connection is required to load platform analytics."
      />
    )
  }

  const health = HEALTH_TONE[overview.health]
  const signupSeries = overview.signupsByWeek.map((bucket) => ({
    label: formatWeekLabel(bucket.weekStart),
    value: bucket.count,
  }))
  const planSeries = PLAN_KEYS.map((plan) => ({
    label: PLAN_LABELS[plan],
    value: overview.planDistribution[plan],
  }))

  const metrics = [
    {
      label: 'Total users',
      value: overview.totals.users,
      description: 'Registered accounts',
      icon: Users,
      tone: 'neutral' as const,
    },
    {
      label: 'Organizations',
      value: overview.totals.organizations,
      description: 'Workspaces',
      icon: Building2,
      tone: 'neutral' as const,
    },
    {
      label: 'Repositories',
      value: overview.totals.repositories,
      description: 'Connected sources',
      icon: Boxes,
      tone: 'neutral' as const,
    },
    {
      label: 'Pull requests',
      value: overview.totals.pullRequests,
      description: 'Tracked changes',
      icon: GitPullRequest,
      tone: 'neutral' as const,
    },
    {
      label: 'Estimated MRR',
      value: `$${formatNumber(overview.subscriptions.mrr)}`,
      description: 'Active + trialing plan value',
      icon: DollarSign,
      tone: 'success' as const,
    },
    {
      label: 'Active subscriptions',
      value: overview.subscriptions.active,
      description: 'Currently billing',
      icon: CreditCard,
      tone: 'accent' as const,
    },
    {
      label: 'Trialing',
      value: overview.subscriptions.trialing,
      description: 'In trial period',
      icon: TimerReset,
      tone: 'warning' as const,
    },
    {
      label: 'Past due',
      value: overview.subscriptions.pastDue,
      description: 'Payment needs attention',
      icon: TriangleAlert,
      tone:
        overview.subscriptions.pastDue > 0
          ? ('danger' as const)
          : ('success' as const),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            description={metric.description}
            icon={metric.icon}
            tone={metric.tone}
          />
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New signups</CardTitle>
            <p className="text-xs text-muted-foreground">
              Accounts created over the last 12 weeks.
            </p>
          </CardHeader>
          <CardContent>
            <AdminAreaChart data={signupSeries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Plan distribution</CardTitle>
            <p className="text-xs text-muted-foreground">
              Organizations grouped by current plan.
            </p>
          </CardHeader>
          <CardContent>
            <AdminBarChart data={planSeries} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Billing status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {BILLING_STATUSES.map((status) => (
              <div
                key={status}
                className="flex items-center justify-between rounded-control border border-border bg-surface-muted/30 px-3 py-2.5 text-sm"
              >
                <span className="text-muted-foreground">
                  {BILLING_LABELS[status]}
                </span>
                <span className="font-medium tabular-nums text-foreground">
                  {formatNumber(overview.billingDistribution[status])}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 text-sm">
              <span className="text-muted-foreground">Platform health</span>
              <Link href="/admin/system">
                <Badge tone={health.tone} withDot>
                  {health.label}
                </Badge>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent signups</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <caption className="sr-only">
                  Most recently registered users
                </caption>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Workspaces</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-foreground">
                        {user.name}
                        <div className="text-xs text-subtle-foreground">
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge tone={user.emailVerified ? 'green' : 'slate'}>
                          {user.emailVerified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {user.membershipCount}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {overview.recentUsers.length === 0 ? (
                <div className="border-t border-border p-5">
                  <EmptyState
                    title="No users yet"
                    description="New signups will appear here."
                  />
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
