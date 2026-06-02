'use client'

import { UrlFilterForm } from '@/components/app/url-filter-form'
import { adminUserSearchParams } from './search-params'

export function AdminUserFilters() {
  return (
    <UrlFilterForm
      parsers={adminUserSearchParams}
      className="md:grid-cols-[minmax(220px,1fr)_180px_auto]"
      resetKeys={['after', 'before']}
      fields={[
        {
          name: 'q',
          label: 'Search',
          type: 'search',
          placeholder: 'Name or email',
        },
        {
          name: 'verified',
          label: 'Email verified',
          type: 'select',
          options: [
            { value: 'all', label: 'All users' },
            { value: 'yes', label: 'Verified' },
            { value: 'no', label: 'Unverified' },
          ],
        },
      ]}
    />
  )
}
