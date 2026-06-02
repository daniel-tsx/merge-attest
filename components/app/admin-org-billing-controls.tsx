import { ExternalLink } from 'lucide-react'
import { openCustomerPortal, updateOrgBilling } from '@/app/admin/actions'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import {
  BILLING_LABELS,
  BILLING_STATUSES,
  PLAN_KEYS,
  PLAN_LABELS,
} from '@/lib/admin/labels'
import type { BillingStatus, PlanKey } from '@/lib/types'
import { cn } from '@/lib/utils'

export function AdminOrgBillingControls({
  orgId,
  name,
  planKey,
  billingStatus,
  hasPortal,
  returnTo,
  className,
}: {
  orgId: string
  name: string
  planKey: PlanKey
  billingStatus: BillingStatus
  hasPortal: boolean
  returnTo: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <form
        action={updateOrgBilling.bind(null, orgId)}
        className="flex flex-wrap items-center gap-2"
      >
        <input type="hidden" name="returnTo" value={returnTo} />
        <Select
          name="planKey"
          defaultValue={planKey}
          aria-label={`Plan for ${name}`}
          className="h-8 px-2 pr-7 text-xs"
        >
          {PLAN_KEYS.map((key) => (
            <option key={key} value={key}>
              {PLAN_LABELS[key]}
            </option>
          ))}
        </Select>
        <Select
          name="billingStatus"
          defaultValue={billingStatus}
          aria-label={`Billing status for ${name}`}
          className="h-8 px-2 pr-7 text-xs"
        >
          {BILLING_STATUSES.map((status) => (
            <option key={status} value={status}>
              {BILLING_LABELS[status]}
            </option>
          ))}
        </Select>
        <Button type="submit" size="sm" variant="secondary">
          Save
        </Button>
      </form>
      <form action={openCustomerPortal.bind(null, orgId)}>
        <input type="hidden" name="returnTo" value={returnTo} />
        <Button type="submit" size="sm" variant="ghost" disabled={!hasPortal}>
          <ExternalLink aria-hidden="true" />
          Portal
        </Button>
      </form>
    </div>
  )
}
