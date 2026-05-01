'use client'

import { UrlFilterForm } from '@/components/app/url-filter-form'
import { auditLogSearchParams } from './search-params'

type RepositoryOption = {
  id: string
  name: string
}

export function AuditLogFilters({
  repositories,
}: {
  repositories: RepositoryOption[]
}) {
  return (
    <UrlFilterForm
      parsers={auditLogSearchParams}
      className="md:grid-cols-[minmax(220px,1fr)_180px_180px_140px] lg:grid-cols-[minmax(220px,1fr)_180px_180px_140px_140px_140px_140px_140px_auto]"
      fields={[
        {
          name: 'query',
          label: 'Search',
          type: 'search',
          placeholder: 'Filter audit events',
        },
        {
          name: 'actor',
          label: 'Actor',
          type: 'text',
          placeholder: 'Actor',
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
          name: 'pullRequestNumber',
          label: 'PR number',
          type: 'text',
          placeholder: 'PR #',
        },
        {
          name: 'eventType',
          label: 'Event type',
          type: 'select',
          options: [
            { value: 'all', label: 'All event types' },
            { value: 'repository_connected', label: 'Repository connected' },
            { value: 'pr_synced', label: 'PR synced' },
            { value: 'risk_score_calculated', label: 'Risk score calculated' },
            { value: 'test_gap_detected', label: 'Test gap detected' },
            { value: 'rule_triggered', label: 'Rule triggered' },
            { value: 'approval_requested', label: 'Approval requested' },
            { value: 'pr_approved', label: 'PR approved' },
            { value: 'pr_rejected', label: 'PR rejected' },
            { value: 'risk_accepted', label: 'Risk accepted' },
            { value: 'github_comment_posted', label: 'GitHub comment posted' },
            { value: 'settings_changed', label: 'Settings changed' },
          ],
        },
        {
          name: 'severity',
          label: 'Severity',
          type: 'select',
          options: [
            { value: 'all', label: 'All severities' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'critical', label: 'Critical' },
          ],
        },
        {
          name: 'from',
          label: 'From',
          type: 'date',
        },
        {
          name: 'to',
          label: 'To',
          type: 'date',
        },
      ]}
    />
  )
}
