'use client'

import { UrlFilterForm } from '@/components/app/url-filter-form'
import { BILLING_FILTER_OPTIONS, PLAN_FILTER_OPTIONS } from '@/lib/admin/labels'
import { adminSubscriptionSearchParams } from './search-params'

export function AdminSubscriptionFilters() {
  return (
    <UrlFilterForm
      parsers={adminSubscriptionSearchParams}
      className="md:grid-cols-[minmax(220px,1fr)_180px_180px_auto]"
      resetKeys={['after', 'before']}
      fields={[
        {
          name: 'q',
          label: 'Search',
          type: 'search',
          placeholder: 'Organization name or slug',
        },
        {
          name: 'plan',
          label: 'Plan',
          type: 'select',
          options: PLAN_FILTER_OPTIONS,
        },
        {
          name: 'status',
          label: 'Billing status',
          type: 'select',
          options: BILLING_FILTER_OPTIONS,
        },
      ]}
    />
  )
}
