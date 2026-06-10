'use client'

import { UrlFilterForm } from '@/components/app/url-filter-form'
import { repositorySearchParams } from './search-params'

export function RepositoryFilters() {
  return (
    <UrlFilterForm
      parsers={repositorySearchParams}
      className="md:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
      fields={[
        {
          name: 'query',
          label: 'Search',
          type: 'search',
          placeholder: 'Filter repositories',
        },
        {
          name: 'riskProfile',
          label: 'Risk profile',
          type: 'select',
          options: [
            { value: 'all', label: 'All risk profiles' },
            { value: 'high', label: 'High risk' },
            { value: 'medium', label: 'Medium risk' },
            { value: 'low', label: 'Low risk' },
          ],
        },
        {
          name: 'visibility',
          label: 'Visibility',
          type: 'select',
          options: [
            { value: 'all', label: 'All visibility' },
            { value: 'private', label: 'Private' },
            { value: 'public', label: 'Public' },
          ],
        },
      ]}
    />
  )
}
