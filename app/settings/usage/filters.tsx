'use client'

import { UrlFilterForm } from '@/components/app/url-filter-form'
import { usageSearchParams } from './search-params'

export function UsageFilters() {
  return (
    <UrlFilterForm
      parsers={usageSearchParams}
      className="md:grid-cols-[220px_auto]"
      fields={[
        {
          name: 'period',
          label: 'View',
          type: 'select',
          options: [
            { value: 'all', label: 'Current period and history' },
            { value: 'current', label: 'Current period only' },
            { value: 'history', label: 'Usage history only' },
          ],
        },
      ]}
    />
  )
}
