'use client'

import { UrlFilterForm } from '@/components/app/url-filter-form'
import { activitySearchParams } from './search-params'

type RepositoryOption = {
  id: string
  name: string
}

export function ActivityFilters({
  repositories,
}: {
  repositories: RepositoryOption[]
}) {
  return (
    <UrlFilterForm
      parsers={activitySearchParams}
      className="md:grid-cols-[minmax(220px,1fr)_170px_170px_170px_auto]"
      fields={[
        {
          name: 'query',
          label: 'Search',
          type: 'search',
          placeholder: 'Filter activity',
        },
        {
          name: 'repositoryId',
          label: 'Repository',
          type: 'select',
          options: [
            { value: 'all', label: 'All repositories' },
            ...repositories.map((repository) => ({
              value: repository.id,
              label: repository.name,
            })),
          ],
        },
        {
          name: 'agentSource',
          label: 'Agent',
          type: 'select',
          options: [
            { value: 'all', label: 'All agents' },
            { value: 'cursor', label: 'Cursor' },
            { value: 'codex', label: 'Codex' },
            { value: 'claude_code', label: 'Claude Code' },
            { value: 'copilot', label: 'Copilot' },
            { value: 'devin', label: 'Devin' },
            { value: 'manual', label: 'Manual' },
          ],
        },
        {
          name: 'eventType',
          label: 'Event type',
          type: 'select',
          options: [
            { value: 'all', label: 'All event types' },
            { value: 'pr_opened', label: 'PR opened' },
            { value: 'files_changed', label: 'Files changed' },
            { value: 'rule_triggered', label: 'Rule triggered' },
            { value: 'ci_failed', label: 'CI failed' },
            { value: 'ci_passed', label: 'CI passed' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'merged', label: 'Merged' },
          ],
        },
      ]}
    />
  )
}
