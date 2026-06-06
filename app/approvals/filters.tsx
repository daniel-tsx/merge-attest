'use client'

import { UrlFilterForm } from '@/components/app/url-filter-form'
import { approvalsSearchParams } from './search-params'

type RepositoryOption = {
  id: string
  name: string
}

type TeamMemberOption = {
  name: string
  role: string
  userId: string
}

export function ApprovalFilters({
  repositories,
  teamMembers,
}: {
  repositories: RepositoryOption[]
  teamMembers: TeamMemberOption[]
}) {
  return (
    <UrlFilterForm
      parsers={approvalsSearchParams}
      className="sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-[minmax(180px,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
      fields={[
        {
          name: 'query',
          label: 'Search',
          type: 'search',
          placeholder: 'Filter approvals',
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
          name: 'riskLevel',
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
          name: 'assigneeId',
          label: 'Assignee',
          type: 'select',
          options: [
            { value: 'all', label: 'All assignees' },
            { value: 'unassigned', label: 'Unassigned' },
            ...teamMembers
              .filter((member) => member.role !== 'viewer')
              .map((member) => ({
                value: member.userId,
                label: member.name,
              })),
          ],
        },
        {
          name: 'slaStatus',
          label: 'SLA',
          type: 'select',
          options: [
            { value: 'all', label: 'All SLAs' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'due_soon', label: 'Due soon' },
            { value: 'on_track', label: 'On track' },
            { value: 'none', label: 'No SLA' },
          ],
        },
        {
          name: 'approvalStatus',
          label: 'Approval',
          type: 'select',
          options: [
            { value: 'all', label: 'Needs review' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'risk_accepted', label: 'Risk accepted' },
          ],
        },
      ]}
    />
  )
}
