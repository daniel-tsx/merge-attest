'use client'

import { type ReactNode, useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Check, MessageSquare, ShieldAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  recordApprovalDecision,
  type ApprovalActionState,
} from '@/app/pull-requests/actions'

type ApprovalDecision = NonNullable<ApprovalActionState['decision']>

const initialActionState: ApprovalActionState = {
  decision: null,
  message: 'No decision recorded yet.',
  status: 'idle',
}

function ApprovalDecisionButton({
  decision,
  disabled,
  icon,
  label,
  pendingLabel,
  variant = 'secondary',
}: {
  decision: ApprovalDecision
  disabled: boolean
  icon: ReactNode
  label: string
  pendingLabel: string
  variant?: 'danger' | 'default' | 'secondary'
}) {
  const { data, pending } = useFormStatus()
  const isCurrentSubmission = pending && data?.get('decision') === decision

  return (
    <Button
      type="submit"
      name="decision"
      value={decision}
      size="sm"
      variant={variant}
      disabled={disabled || pending}
    >
      {icon}
      {isCurrentSubmission ? pendingLabel : label}
    </Button>
  )
}

export function ApprovalActions({
  prId,
  canRecord = true,
  attestable = false,
}: {
  prId: string
  canRecord?: boolean
  attestable?: boolean
}) {
  const [state, formAction, isPending] = useActionState(
    recordApprovalDecision.bind(null, prId),
    initialActionState,
  )

  useEffect(() => {
    if (state.status === 'success') toast.success(state.message)
    else if (state.status === 'error') toast.error(state.message)
  }, [state])

  const statusMessage = isPending ? 'Recording decision…' : state.message
  const messageClassName =
    state.status === 'error'
      ? 'text-danger'
      : state.status === 'success'
        ? 'text-success'
        : 'text-muted-foreground'
  const formDisabled = !canRecord || isPending

  return (
    <form action={formAction} className="space-y-3" aria-busy={isPending}>
      {!canRecord ? (
        <p className="rounded-control border border-info-border bg-info-soft p-3 text-sm text-info">
          You have read-only access to approval decisions.
        </p>
      ) : null}
      <label className="space-y-1.5">
        <span className="block text-xs font-medium text-muted-foreground">
          Optional reviewer note
        </span>
        <Textarea
          name="note"
          placeholder="Add reviewer context"
          maxLength={1000}
          disabled={formDisabled}
        />
      </label>
      {attestable ? (
        <label className="flex items-start gap-2 rounded-control border border-attention-border bg-attention-soft/40 p-3 text-xs text-foreground">
          <input
            type="checkbox"
            name="attest"
            disabled={formDisabled}
            className="mt-0.5 size-4 shrink-0 rounded border-border accent-accent"
          />
          <span>
            I take responsibility for reviewing this AI-authored change.
            Recorded as a human accountability sign-off when you approve or
            accept risk.
          </span>
        </label>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <ApprovalDecisionButton
          decision="approved"
          disabled={formDisabled}
          icon={<Check aria-hidden="true" />}
          label="Approve"
          pendingLabel="Approving..."
          variant="default"
        />
        <ApprovalDecisionButton
          decision="requested_tests"
          disabled={formDisabled}
          icon={<MessageSquare aria-hidden="true" />}
          label="Request tests"
          pendingLabel="Requesting..."
        />
        <ApprovalDecisionButton
          decision="risk_accepted"
          disabled={formDisabled}
          icon={<ShieldAlert aria-hidden="true" />}
          label="Accept risk"
          pendingLabel="Recording..."
        />
        <ApprovalDecisionButton
          decision="rejected"
          disabled={formDisabled}
          icon={<X aria-hidden="true" />}
          label="Reject"
          pendingLabel="Rejecting..."
          variant="danger"
        />
      </div>
      <p className={`text-xs ${messageClassName}`} aria-live="polite">
        {statusMessage}
      </p>
    </form>
  )
}
