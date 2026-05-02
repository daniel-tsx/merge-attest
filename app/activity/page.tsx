import type { SearchParams } from 'nuqs/server'
import Link from 'next/link'
import { EmptyState, ResultSummary } from '@/components/app/empty-state'
import { PageHeader } from '@/components/app/page-header'
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

export default async function ActivityPage({ searchParams }: PageProps) {
  const [filters, organization] = await Promise.all([
    activitySearchParamsCache.parse(searchParams),
    getCurrentOrganization(),
  ])
  const [repositories, activityEvents] = await Promise.all([
    listRepositories(organization.id),
    listActivityEvents(organization.id, filters),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Activity"
        description="Compact timeline of agent-originated and review-relevant repository events."
      />
      <Card>
        <CardContent className="space-y-4">
          <ActivityFilters repositories={repositories} />
          <ResultSummary
            count={activityEvents.length}
            label="activity events"
            detail="Matching repository, source, and risk filters"
          />
          <div className="divide-y divide-border">
            {activityEvents.map((event) => (
              <div
                key={event.id}
                className="grid gap-3 py-3 md:grid-cols-[180px_1fr_140px_120px] md:items-center"
              >
                <div className="text-xs text-muted-foreground">
                  {formatDate(event.timestamp)}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {event.summary}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {event.repositoryName} ·{' '}
                    {event.pullRequestNumber && event.pullRequestId ? (
                      <Link
                        href={`/pull-requests/${event.pullRequestId}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        PR #{event.pullRequestNumber}
                      </Link>
                    ) : event.pullRequestNumber ? (
                      `PR #${event.pullRequestNumber}`
                    ) : (
                      'No PR'
                    )}{' '}
                    · {event.actor}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {event.agentSource.replace('_', ' ')}
                </div>
                <RiskBadge level={event.riskLevel} />
              </div>
            ))}
            {activityEvents.length === 0 ? (
              <div className="py-4">
                <EmptyState
                  title="No activity matches these filters"
                  description="Sync repositories or clear the filters to see more events."
                />
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
