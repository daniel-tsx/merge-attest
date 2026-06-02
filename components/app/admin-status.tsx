import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const messages: Record<
  string,
  { tone: 'info' | 'success' | 'danger'; text: string }
> = {
  org_updated: {
    tone: 'success',
    text: 'Organization plan and billing status updated.',
  },
  user_deleted: { tone: 'success', text: 'User deleted.' },
  forbidden: {
    tone: 'danger',
    text: 'Platform admin access is required for that action.',
  },
  invalid: {
    tone: 'danger',
    text: 'That plan or billing status is not valid.',
  },
  not_found: { tone: 'danger', text: 'That record no longer exists.' },
  no_portal: {
    tone: 'info',
    text: 'No Lemon Squeezy customer portal is available for that organization yet.',
  },
  cannot_delete_admin: {
    tone: 'danger',
    text: 'You cannot delete your own account or another platform admin.',
  },
  sole_owner: {
    tone: 'danger',
    text: 'That user is the sole owner of an organization. Reassign ownership before deleting.',
  },
}

const toneClass: Record<'info' | 'success' | 'danger', string> = {
  info: 'border-info-border bg-info-soft/40 text-info',
  success: 'border-success-border bg-success-soft/40 text-success-strong',
  danger: 'border-danger-border bg-danger-soft/40 text-danger',
}

export function readAdminStatus(
  params: Record<string, string | string[] | undefined> | undefined,
) {
  const value = params?.admin
  return Array.isArray(value) ? value[0] : value
}

export function AdminStatus({ status }: { status?: string | null }) {
  const message = status ? messages[status] : undefined
  if (!message) return null
  return (
    <Card className={cn(toneClass[message.tone])}>
      <CardContent className="text-sm" role="status">
        {message.text}
      </CardContent>
    </Card>
  )
}
