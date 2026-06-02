import { Suspense } from 'react'
import type { SearchParams } from 'nuqs/server'
import { AdminNav } from '@/components/app/admin-nav'
import { AdminPager } from '@/components/app/admin-pager'
import { AdminStatus, readAdminStatus } from '@/components/app/admin-status'
import { ConfirmSubmitButton } from '@/components/app/confirm-submit-button'
import { EmptyState, ResultSummary } from '@/components/app/empty-state'
import { PageHeader } from '@/components/app/page-header'
import { TableSkeleton } from '@/components/app/page-loading'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { listAdminUsers } from '@/lib/admin/admin-data'
import { formatDate } from '@/lib/utils'
import { deleteUser } from '../actions'
import { AdminUserFilters } from './filters'
import {
  adminUserSearchParamsCache,
  serializeAdminUserSearchParams,
} from './search-params'

type PageProps = { searchParams: Promise<SearchParams> }

export default function AdminUsersPage({ searchParams }: PageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Users"
        description="Every registered account across all workspaces. Deletions are permanent and audit-logged."
      />
      <AdminNav />
      <Suspense fallback={<TableSkeleton label="Loading users" />}>
        <AdminUsersContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function AdminUsersContent({ searchParams }: PageProps) {
  const [filters, raw] = await Promise.all([
    adminUserSearchParamsCache.parse(searchParams),
    searchParams,
  ])
  const page = await listAdminUsers(filters)

  const prevHref = page.prevCursor
    ? `/admin/users${serializeAdminUserSearchParams({ ...filters, before: page.prevCursor, after: '' })}`
    : null
  const nextHref = page.nextCursor
    ? `/admin/users${serializeAdminUserSearchParams({ ...filters, after: page.nextCursor, before: '' })}`
    : null

  return (
    <div className="space-y-6">
      <AdminStatus status={readAdminStatus(raw)} />
      <Card>
        <CardContent className="space-y-5">
          <AdminUserFilters />
          <ResultSummary
            count={page.total}
            label="users"
            detail="Use Previous / Next to page through results"
          />
          <div className="-mx-5 overflow-x-auto">
            <Table>
              <caption className="sr-only">
                Registered users with workspace membership and management
                actions
              </caption>
              <TableHeader className="sticky top-0 z-20">
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Workspaces</TableHead>
                  <TableHead>Last active</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.rows.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="min-w-56 font-medium text-foreground">
                      <div className="inline-flex items-center gap-2.5">
                        <Avatar className="size-7">
                          <AvatarFallback>
                            {user.name?.charAt(0) ?? '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          {user.name}
                          <div className="text-xs text-subtle-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge tone={user.emailVerified ? 'green' : 'slate'}>
                        {user.emailVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="tabular-nums text-foreground">
                        {user.membershipCount}
                      </span>
                      {user.roles.length ? (
                        <div className="text-xs capitalize text-subtle-foreground">
                          {user.roles.join(', ')}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {user.lastActiveAt ? formatDate(user.lastActiveAt) : '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <form
                        action={deleteUser.bind(null, user.id)}
                        className="inline-flex"
                      >
                        <input
                          type="hidden"
                          name="returnTo"
                          value="/admin/users"
                        />
                        <ConfirmSubmitButton
                          size="sm"
                          variant="danger"
                          message={`Delete ${user.email}? This permanently removes the account and all of its memberships.`}
                        >
                          Delete
                        </ConfirmSubmitButton>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {page.rows.length === 0 ? (
              <div className="border-t border-border p-5">
                <EmptyState
                  title="No users match these filters"
                  description="Clear the filters to see every account."
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
