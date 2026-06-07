import type { SearchParams } from 'nuqs/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { AdminOrgBillingControls } from '@/components/app/admin-org-billing-controls'
import { AdminStatus, readAdminStatus } from '@/components/app/admin-status'
import { EmptyState } from '@/components/app/empty-state'
import { PageHeader } from '@/components/app/page-header'
import { Section } from '@/components/app/section'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getAdminOrganization } from '@/lib/admin/admin-data'
import { BILLING_LABELS, PLAN_LABELS, billingTone } from '@/lib/admin/labels'
import { formatDate, formatNumber } from '@/lib/utils'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParams>
}

function formatDateOnly(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export default async function AdminOrganizationDetailPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, raw] = await Promise.all([params, searchParams])
  const org = await getAdminOrganization(id)
  if (!org) notFound()

  const facts: Array<[string, string]> = [
    ['Slug', org.slug],
    ['Lemon Squeezy status', org.subscriptionStatus ?? '—'],
    ['Customer ID', org.customerId ?? '—'],
    ['Subscription ID', org.subscriptionId ?? '—'],
    ['Trial ends', formatDateOnly(org.trialEndsAt)],
    ['Cancels', formatDateOnly(org.cancellationEffectiveAt)],
    ['Failed payment', formatDateOnly(org.failedPaymentAt)],
    ['Last upgrade', formatDateOnly(org.lastUpgradeAt)],
    ['GitHub install', org.githubInstallationId ?? '—'],
    ['Created', formatDateOnly(org.createdAt)],
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform · Organization"
        title={org.name}
        description={`${formatNumber(org.counts.members)} members · ${formatNumber(org.counts.repositories)} repositories · ${formatNumber(org.counts.pullRequests)} pull requests`}
        actions={
          <Button variant="ghost" asChild>
            <Link href="/admin/organizations">
              <ArrowLeft aria-hidden="true" />
              All organizations
            </Link>
          </Button>
        }
      />
      <AdminStatus status={readAdminStatus(raw)} />

      <Section
        title="Subscription"
        description="Override the plan and billing status in MergeAttest, or open the Lemon Squeezy customer portal."
        contentClassName="space-y-5"
      >
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Plan</span>
          <Badge tone="slate">{PLAN_LABELS[org.planKey]}</Badge>
          <span className="text-muted-foreground">Billing</span>
          <Badge tone={billingTone(org.billingStatus)} withDot>
            {BILLING_LABELS[org.billingStatus]}
          </Badge>
        </div>
        <AdminOrgBillingControls
          orgId={org.id}
          name={org.name}
          planKey={org.planKey}
          billingStatus={org.billingStatus}
          hasPortal={Boolean(org.customerId || org.subscriptionId)}
          returnTo={`/admin/organizations/${org.id}`}
        />
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-eyebrow text-subtle-foreground">{label}</dt>
              <dd className="mt-0.5 truncate text-sm text-foreground">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Members" contentClassName="p-0">
        <div className="overflow-x-auto">
          <Table>
            <caption className="sr-only">Workspace members and roles</caption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {org.members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium text-foreground">
                    {member.name}
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge tone={member.role === 'owner' ? 'blue' : 'slate'}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(member.joinedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {org.members.length === 0 ? (
            <div className="border-t border-border p-5">
              <EmptyState
                title="No members"
                description="This workspace has no members."
              />
            </div>
          ) : null}
        </div>
      </Section>

      <Section title="Repositories" contentClassName="p-0">
        <div className="overflow-x-auto">
          <Table>
            <caption className="sr-only">Connected repositories</caption>
            <TableHeader>
              <TableRow>
                <TableHead>Repository</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Risk profile</TableHead>
                <TableHead className="text-right">PR checks</TableHead>
                <TableHead>Last synced</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {org.repositories.map((repo) => (
                <TableRow key={repo.id}>
                  <TableCell className="font-medium text-foreground">
                    {repo.owner}/{repo.name}
                  </TableCell>
                  <TableCell className="capitalize">
                    {repo.connectedStatus}
                  </TableCell>
                  <TableCell className="capitalize">
                    {repo.visibility}
                  </TableCell>
                  <TableCell className="capitalize">
                    {repo.riskProfile}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(repo.monthlyPrCheckUsage)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {repo.lastSyncedAt ? formatDate(repo.lastSyncedAt) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {org.repositories.length === 0 ? (
            <div className="border-t border-border p-5">
              <EmptyState
                title="No repositories"
                description="This workspace has not connected any repositories."
              />
            </div>
          ) : null}
        </div>
      </Section>

      <Section title="Recent audit events" contentClassName="space-y-2">
        {org.auditEvents.length ? (
          org.auditEvents.map((event) => (
            <div
              key={event.id}
              className="rounded-control border border-border bg-surface-muted/30 p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-foreground">
                  {event.summary}
                </span>
                <span className="whitespace-nowrap text-xs text-subtle-foreground">
                  {formatDate(event.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-xs text-subtle-foreground">
                {event.eventType.replace(/_/g, ' ')}
                {event.actor ? ` · ${event.actor}` : ''}
              </p>
            </div>
          ))
        ) : (
          <EmptyState
            title="No audit events"
            description="Audit activity for this workspace will appear here."
          />
        )}
      </Section>
    </div>
  )
}
