import { Suspense } from 'react'
import type { SearchParams } from 'nuqs/server'
import Link from 'next/link'
import { AdminNav } from '@/components/app/admin-nav'
import { AdminOrgBillingControls } from '@/components/app/admin-org-billing-controls'
import { AdminPager } from '@/components/app/admin-pager'
import { AdminStatus, readAdminStatus } from '@/components/app/admin-status'
import { EmptyState, ResultSummary } from '@/components/app/empty-state'
import { MetricCard } from '@/components/app/metric-card'
import { PageHeader } from '@/components/app/page-header'
import { TableSkeleton } from '@/components/app/page-loading'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  getAdminSubscriptionSummary,
  listAdminSubscriptions,
} from '@/lib/admin/admin-data'
import { PLAN_LABELS, billingTone } from '@/lib/admin/labels'
import { formatDate, formatNumber } from '@/lib/utils'
import { AdminSubscriptionFilters } from './filters'
import {
  adminSubscriptionSearchParamsCache,
  serializeAdminSubscriptionSearchParams,
} from './search-params'

type PageProps = { searchParams: Promise<SearchParams> }

export default function AdminSubscriptionsPage({ searchParams }: PageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Subscriptions"
        description="Review billing across every workspace. Plan and status overrides update MergeAttest only — real billing changes happen in the Lemon Squeezy customer portal."
      />
      <AdminNav />
      <Suspense fallback={<TableSkeleton label="Loading subscriptions" />}>
        <AdminSubscriptionsContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function AdminSubscriptionsContent({ searchParams }: PageProps) {
  const [filters, raw] = await Promise.all([
    adminSubscriptionSearchParamsCache.parse(searchParams),
    searchParams,
  ])
  const [page, summary] = await Promise.all([
    listAdminSubscriptions(filters),
    getAdminSubscriptionSummary(filters),
  ])

  const prevHref = page.prevCursor
    ? `/admin/subscriptions${serializeAdminSubscriptionSearchParams({ ...filters, before: page.prevCursor, after: '' })}`
    : null
  const nextHref = page.nextCursor
    ? `/admin/subscriptions${serializeAdminSubscriptionSearchParams({ ...filters, after: page.nextCursor, before: '' })}`
    : null

  return (
    <div className="space-y-6">
      <AdminStatus status={readAdminStatus(raw)} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Estimated MRR"
          value={`$${formatNumber(summary.mrr)}`}
          description="Active + trialing plan value"
          tone="success"
        />
        <MetricCard label="Active" value={summary.active} tone="accent" />
        <MetricCard label="Trialing" value={summary.trialing} tone="warning" />
        <MetricCard
          label="Churn risk"
          value={summary.churnRisk}
          description="Past due or canceled"
          tone={summary.churnRisk > 0 ? 'danger' : 'neutral'}
        />
      </div>

      <Card>
        <CardContent className="space-y-5">
          <AdminSubscriptionFilters />
          <ResultSummary
            count={summary.total}
            label="organizations"
            detail="Use Previous / Next to page through results"
          />
          <div className="-mx-5 overflow-x-auto">
            <Table>
              <caption className="sr-only">
                Organization subscriptions with plan, billing status, and
                management controls
              </caption>
              <TableHeader className="sticky top-0 z-20">
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead className="text-right">Monthly</TableHead>
                  <TableHead>Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="min-w-56 font-medium text-foreground">
                      <Link
                        className="hover:text-accent"
                        href={`/admin/organizations/${row.id}`}
                      >
                        {row.name}
                      </Link>
                      <div className="text-xs text-subtle-foreground">
                        {row.slug}
                      </div>
                    </TableCell>
                    <TableCell>{PLAN_LABELS[row.planKey]}</TableCell>
                    <TableCell>
                      <Badge tone={billingTone(row.billingStatus)} withDot>
                        {row.billingStatus.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.subscriptionStatus ?? '—'}
                      {row.trialEndsAt ? (
                        <div className="text-subtle-foreground">
                          Trial ends {formatDate(row.trialEndsAt)}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      ${formatNumber(row.monthlyPrice)}
                    </TableCell>
                    <TableCell className="min-w-72">
                      <AdminOrgBillingControls
                        orgId={row.id}
                        name={row.name}
                        planKey={row.planKey}
                        billingStatus={row.billingStatus}
                        hasPortal={Boolean(
                          row.customerId || row.subscriptionId,
                        )}
                        returnTo="/admin/subscriptions"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {page.rows.length === 0 ? (
              <div className="border-t border-border p-5">
                <EmptyState
                  title="No subscriptions match these filters"
                  description="Clear the filters to see every workspace."
                />
              </div>
            ) : null}
          </div>
          <AdminPager prevHref={prevHref} nextHref={nextHref} />
        </CardContent>
      </Card>
    </div>
  )
}
