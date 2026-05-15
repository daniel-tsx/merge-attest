import { Suspense } from 'react'
import type { SearchParams } from 'nuqs/server'
import Link from 'next/link'
import { Activity } from 'lucide-react'
import { EmptyState, ResultSummary } from '@/components/app/empty-state'
import { PageHeader } from '@/components/app/page-header'
import { ListSkeleton } from '@/components/app/page-loading'
import { ActivityFilters } from '@/app/activity/filters'
import { RiskBadge } from '@/components/app/status-badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  getCurrentOrganization,
  listActivityEvents,
  listRepositories,
} from '@/lib/data/app-data'
import { formatDate } from '@/lib/utils'
import { activitySearchParamsCache } from './search-params'

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default function ActivityPage({ searchParams }: PageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Agent activity"
        description="Compact timeline of agent-originated and review-relevant repository events."
      />
      <Suspense fallback={<ListSkeleton />}>
        <ActivityContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function ActivityContent({ searchParams }: PageProps) {
  const [filters, organization] = await Promise.all([
    activitySearchParamsCache.parse(searchParams),
    getCurrentOrganization(),
  ])
  const [repositories, activityEvents] = await Promise.all([
    listRepositories(organization.id),
    listActivityEvents(organization.id, filters),
  ])

  return (
    <Card>
      <CardContent className="space-y-5">
        <ActivityFilters repositories={repositories} />
        <ResultSummary
          count={activityEvents.length}
          label="activity events"
          detail="Matching repository, source, and risk filters"
        />
        {activityEvents.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activity matches these filters"
            description="Sync repositories or clear the filters to see more events."
          />
        ) : (
          <ol className="relative space-y-1">
            {activityEvents.map((event, index) => (
              <li
                key={event.id}
                className="relative flex gap-4 rounded-control px-2 py-3 transition-colors hover:bg-surface-hover/60"
              >
                <div className="relative flex flex-col items-center">
                  <span className="mt-1.5 size-2 rounded-full bg-accent ring-4 ring-accent-soft" />
                  {index < activityEvents.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="absolute top-3.5 h-full w-px bg-divider"
                    />
                  ) : null}
                </div>
                <div className="grid flex-1 gap-2 md:grid-cols-[1fr_auto] md:items-start">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {event.summary}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-subtle-foreground">
                      <span className="font-medium text-foreground/80">
                        {event.repositoryName}
                      </span>
                      <span aria-hidden="true">·</span>
                      {event.pullRequestNumber && event.pullRequestId ? (
                        <Link
                          href={`/pull-requests/${event.pullRequestId}`}
                          className="font-medium text-accent hover:underline"
                        >
                          PR #{event.pullRequestNumber}
                        </Link>
                      ) : event.pullRequestNumber ? (
                        <span>PR #{event.pullRequestNumber}</span>
                      ) : (
                        <span>No PR</span>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{event.actor}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">
                        {event.agentSource.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:justify-end">
                    <RiskBadge level={event.riskLevel} />
                    <span className="text-xs text-subtle-foreground">
                      {formatDate(event.timestamp)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
