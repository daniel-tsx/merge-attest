import { Suspense } from 'react'
import Link from 'next/link'
import { AdminNav } from '@/components/app/admin-nav'
import { EmptyState } from '@/components/app/empty-state'
import { PageHeader } from '@/components/app/page-header'
import { AdminDashboardSkeleton } from '@/components/app/page-loading'
import {
  PostureHero,
  type HeroAttentionItem,
  type HeroSignal,
} from '@/components/app/posture-hero'
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
import { getAdminOverview, type AdminOverview } from '@/lib/admin/admin-data'
import { PLAN_KEYS, PLAN_LABELS } from '@/lib/admin/labels'
import { cn, formatDate, formatNumber } from '@/lib/utils'

const HEALTH_BADGE = {
  ok: { tone: 'green' as const, label: 'Operational' },
  warning: { tone: 'yellow' as const, label: 'Warnings' },
  error: { tone: 'red' as const, label: 'Errors' },
}

const HEALTH_POSTURE: Record<
  AdminOverview['health'],
  Pick<
    Parameters<typeof PostureHero>[0],
    'verdict' | 'statusLabel' | 'statusTone' | 'gateState' | 'gateTone'
  > & { summary: string }
> = {
  ok: {
    verdict: 'Operational',
    statusLabel: 'All systems normal',
    statusTone: 'success',
    gateState: 'scan',
    gateTone: 'accent',
    summary: 'Platform diagnostics are passing across every workspace.',
  },
  warning: {
    verdict: 'Degraded',
    statusLabel: 'Warnings',
    statusTone: 'warning',
    gateState: 'scan',
    gateTone: 'warning',
    summary: 'Some platform diagnostics need attention — review system health.',
  },
  error: {
    verdict: 'Errors',
    statusLabel: 'Action required',
    statusTone: 'danger',
    gateState: 'fissure',
    gateTone: 'danger',
    summary: 'Platform diagnostics are failing — investigate system health now.',
  },
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
        description="Cross-tenant analytics across every MergeAttest workspace: growth, revenue, plan mix, and platform health."
      />
      <AdminNav />
      <Suspense fallback={<AdminDashboardSkeleton />}>
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

  const posture = HEALTH_POSTURE[overview.health]
  const signupSeries = overview.signupsByWeek.map((bucket) => ({
    label: formatWeekLabel(bucket.weekStart),
    value: bucket.count,
  }))
  const planSeries = PLAN_KEYS.map((plan) => ({
    label: PLAN_LABELS[plan],
    value: overview.planDistribution[plan],
  }))

  const signals: HeroSignal[] = [
    {
      key: 'users',
      label: 'Total users',
      value: formatNumber(overview.totals.users),
      description: 'Registered accounts',
      tone: 'neutral',
    },
    {
      key: 'organizations',
      label: 'Organizations',
      value: formatNumber(overview.totals.organizations),
      description: 'Active workspaces',
      tone: 'neutral',
    },
    {
      key: 'repositories',
      label: 'Repositories',
      value: formatNumber(overview.totals.repositories),
      description: 'Connected sources',
      tone: 'neutral',
    },
    {
      key: 'pullRequests',
      label: 'Pull requests',
      value: formatNumber(overview.totals.pullRequests),
      description: 'Tracked changes',
      tone: 'neutral',
    },
  ]

  const attention: HeroAttentionItem[] = []
  if (overview.subscriptions.pastDue > 0) {
    attention.push({
      label: 'past-due',
      count: overview.subscriptions.pastDue,
      href: '/admin/subscriptions?status=past_due',
      tone: 'danger',
    })
  }

  return (
    <div className="space-y-6">
      <PostureHero
        ariaLabel="Platform posture"
        eyebrow="Platform status"
        verdict={posture.verdict}
        statusLabel={posture.statusLabel}
        statusTone={posture.statusTone}
        gateState={posture.gateState}
        gateTone={posture.gateTone}
        summary={posture.summary}
        attention={attention}
        attentionEmpty="No subscriptions need a payment action."
        signals={signals}
      />

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
        <RevenuePanel overview={overview} />

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

function RevenuePanel({ overview }: { overview: AdminOverview }) {
  const { subscriptions, health } = overview
  const badge = HEALTH_BADGE[health]
  const segments = [
    {
      key: 'active',
      label: 'Active',
      count: subscriptions.active,
      bar: 'bg-success',
      dot: 'bg-success',
    },
    {
      key: 'trialing',
      label: 'Trialing',
      count: subscriptions.trialing,
      bar: 'bg-attention',
      dot: 'bg-attention',
    },
    {
      key: 'past_due',
      label: 'Past due',
      count: subscriptions.pastDue,
      bar: 'bg-danger',
      dot: 'bg-danger',
    },
    {
      key: 'canceled',
      label: 'Canceled',
      count: subscriptions.canceled,
      bar: 'bg-border-strong',
      dot: 'bg-border-strong',
    },
  ]
  const total = segments.reduce((sum, segment) => sum + segment.count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue &amp; subscriptions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-eyebrow text-subtle-foreground">
            Estimated MRR
          </div>
          <div className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
            ${formatNumber(subscriptions.mrr)}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Active and trialing plan value per month
          </div>
        </div>

        {total > 0 ? (
          <>
            <div
              className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-subtle"
              role="img"
              aria-label={`Subscription mix across ${total} subscriptions`}
            >
              {segments
                .filter((segment) => segment.count > 0)
                .map((segment) => (
                  <span
                    key={segment.key}
                    className={cn('h-full', segment.bar)}
                    style={{ width: `${(segment.count / total) * 100}%` }}
                  />
                ))}
            </div>
            <ul className="grid grid-cols-2 gap-2.5">
              {segments.map((segment) => (
                <li
                  key={segment.key}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span
                      aria-hidden="true"
                      className={cn('size-2 rounded-full', segment.dot)}
                    />
                    {segment.label}
                  </span>
                  <span className="font-medium tabular-nums text-foreground">
                    {formatNumber(segment.count)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="rounded-control border border-dashed border-border bg-surface-muted/45 px-3 py-4 text-center text-sm text-muted-foreground">
            No active subscriptions yet.
          </p>
        )}

        <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
          <span className="text-muted-foreground">Platform health</span>
          <Link href="/admin/system">
            <Badge tone={badge.tone} withDot>
              {badge.label}
            </Badge>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
