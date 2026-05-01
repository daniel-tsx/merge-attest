'use client'

import { UrlFilterForm } from '@/components/app/url-filter-form'
import { pullRequestSearchParams } from './search-params'

export function PullRequestFilters() {
  return (
    <UrlFilterForm
      parsers={pullRequestSearchParams}
      className="md:grid-cols-[minmax(220px,1fr)_160px_160px_180px_auto]"
      fields={[
        {
          name: 'query',
          label: 'Search',
          type: 'search',
          placeholder: 'Filter pull requests',
        },
        {
          name: 'riskLevel',
          label: 'Risk',
          type: 'select',
          options: [
            { value: 'all', label: 'All risk' },
            { value: 'critical', label: 'Critical' },
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' },
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
          name: 'approvalStatus',
          label: 'Approval',
          type: 'select',
          options: [
            { value: 'all', label: 'Approval status' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'risk_accepted', label: 'Risk accepted' },
            { value: 'not_required', label: 'Not required' },
          ],
        },
      ]}
    />
  )
}
