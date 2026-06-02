import { Suspense } from 'react'
import type { SearchParams } from 'nuqs/server'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { AdminNav } from '@/components/app/admin-nav'
import { AdminPager } from '@/components/app/admin-pager'
import { AdminStatus, readAdminStatus } from '@/components/app/admin-status'
import { EmptyState, ResultSummary } from '@/components/app/empty-state'
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
import { listAdminOrganizations } from '@/lib/admin/admin-data'
import { PLAN_LABELS, billingTone } from '@/lib/admin/labels'
import { formatDate, formatNumber } from '@/lib/utils'
import { AdminOrganizationFilters } from './filters'
import {
  adminOrganizationSearchParamsCache,
  serializeAdminOrganizationSearchParams,
} from './search-params'

type PageProps = { searchParams: Promise<SearchParams> }

export default function AdminOrganizationsPage({ searchParams }: PageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Organizations"
        description="Every workspace on the platform. Open a workspace to inspect members, repositories, and billing overrides."
      />
      <AdminNav />
      <Suspense fallback={<TableSkeleton label="Loading organizations" />}>
        <AdminOrganizationsContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function AdminOrganizationsContent({ searchParams }: PageProps) {
  const [filters, raw] = await Promise.all([
    adminOrganizationSearchParamsCache.parse(searchParams),
    searchParams,
  ])
  const page = await listAdminOrganizations(filters)

  const prevHref = page.prevCursor
    ? `/admin/organizations${serializeAdminOrganizationSearchParams({ ...filters, before: page.prevCursor, after: '' })}`
    : null
  const nextHref = page.nextCursor
    ? `/admin/organizations${serializeAdminOrganizationSearchParams({ ...filters, after: page.nextCursor, before: '' })}`
    : null

  return (
    <div className="space-y-6">
      <AdminStatus status={readAdminStatus(raw)} />
      <Card>
        <CardContent className="space-y-5">
          <AdminOrganizationFilters />
          <ResultSummary
            count={page.total}
            label="organizations"
            detail="Use Previous / Next to page through results"
          />
          <div className="-mx-5 overflow-x-auto">
            <Table>
              <caption className="sr-only">
                Workspaces with plan, billing, members, repositories, and usage
              </caption>
              <TableHeader className="sticky top-0 z-20">
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead className="text-right">Members</TableHead>
                  <TableHead className="text-right">Repos</TableHead>
                  <TableHead className="text-right">PR checks</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">View</TableHead>
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
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.memberCount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.repositoryCount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.prCheckUsage)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(row.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/organizations/${row.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                      >
                        Open
                        <ArrowUpRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {page.rows.length === 0 ? (
              <div className="border-t border-border p-5">
                <EmptyState
                  title="No organizations match these filters"
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
