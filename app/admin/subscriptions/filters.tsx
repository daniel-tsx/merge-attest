'use client'

import { UrlFilterForm } from '@/components/app/url-filter-form'
import { BILLING_FILTER_OPTIONS, PLAN_FILTER_OPTIONS } from '@/lib/admin/labels'
import { adminSubscriptionSearchParams } from './search-params'

export function AdminSubscriptionFilters() {
  return (
    <UrlFilterForm
      parsers={adminSubscriptionSearchParams}
      className="md:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
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
