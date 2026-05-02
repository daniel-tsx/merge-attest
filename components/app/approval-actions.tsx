'use client'

import {
  type ReactNode,
  useActionState,
  useOptimistic,
  useState,
  useTransition,
} from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Check, MessageSquare, ShieldAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Approval, ApprovalStatus } from '@/lib/types'

type ApprovalDecision = Exclude<Approval['decision'], 'not_required'>

type ApprovalActionState = {
  decision: ApprovalDecision | null
  message: string
  status: 'error' | 'idle' | 'success'
}

const initialActionState: ApprovalActionState = {
  decision: null,
  message: 'No decision recorded yet.',
  status: 'idle',
}

function isApprovalDecision(
  value: FormDataEntryValue | null,
): value is ApprovalDecision {
  return (
    value === 'approved' ||
    value === 'requested_tests' ||
    value === 'risk_accepted' ||
    value === 'rejected'
  )
}

function formatDecision(decision: ApprovalDecision) {
  return decision.replaceAll('_', ' ')
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
}: {
  prId: string
  canRecord?: boolean
}) {
  const router = useRouter()
  const [note, setNote] = useState('')
  const [isRefreshing, startTransition] = useTransition()
  const [state, formAction, isPending] = useActionState(
    recordDecision,
    initialActionState,
  )
  const [optimisticDecision, setOptimisticDecision] = useOptimistic<
    ApprovalDecision | null,
    ApprovalDecision
  >(state.decision, (_current, nextDecision) => nextDecision)

  async function recordDecision(
    _previousState: ApprovalActionState,
    formData: FormData,
  ): Promise<ApprovalActionState> {
    const decision = formData.get('decision')

    if (!isApprovalDecision(decision)) {
      return {
        decision: null,
        message: 'Choose an approval decision before submitting.',
        status: 'error',
      }
    }

    setOptimisticDecision(decision)

    const response = await fetch(`/api/pull-requests/${prId}/approval`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision, note: note.trim() }),
    })
    const result = (await response.json()) as {
      error?: string
      approvalStatus?: ApprovalStatus
    }

    if (!response.ok) {
      return {
        decision: null,
        message: result.error ?? 'Unable to record approval decision.',
        status: 'error',
      }
    }

    setNote('')
    startTransition(() => {
      router.refresh()
    })

    return {
      decision,
      message: `Recorded ${formatDecision(decision)}. Current status: ${result.approvalStatus}.`,
      status: 'success',
    }
  }

  const statusMessage =
    optimisticDecision && isPending
      ? `Recording ${formatDecision(optimisticDecision)}...`
      : state.message
  const messageClassName =
    state.status === 'error'
      ? 'text-danger'
      : state.status === 'success'
        ? 'text-success'
        : 'text-muted-foreground'
  const formDisabled = !canRecord || isPending || isRefreshing

  return (
    <form
      action={formAction}
      className="space-y-3"
      aria-busy={isPending || isRefreshing}
    >
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
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Add reviewer context"
          maxLength={1000}
          disabled={formDisabled}
          name="note"
        />
      </label>
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
