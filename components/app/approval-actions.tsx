'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, MessageSquare, ShieldAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Approval } from '@/lib/types'

export function ApprovalActions({
  prId,
  canRecord = true,
}: {
  prId: string
  canRecord?: boolean
}) {
  const router = useRouter()
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('No decision recorded yet.')
  const [submitting, setSubmitting] = useState<Approval['decision'] | null>(
    null,
  )

  async function recordDecision(
    decision: Exclude<Approval['decision'], 'not_required'>,
  ) {
    setSubmitting(decision)
    setMessage('Recording decision...')

    const response = await fetch(`/api/pull-requests/${prId}/approval`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision, note }),
    })
    const result = (await response.json()) as {
      error?: string
      approvalStatus?: string
    }

    setSubmitting(null)

    if (!response.ok) {
      setMessage(result.error ?? 'Unable to record approval decision.')
      return
    }

    setNote('')
    setMessage(
      `Recorded ${decision.replaceAll('_', ' ')}. Current status: ${result.approvalStatus}.`,
    )
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {!canRecord ? (
        <p className="rounded-control border border-info-border bg-info-soft p-3 text-sm text-info">
          You have read-only access to approval decisions.
        </p>
      ) : null}
      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Optional reviewer note"
        maxLength={1000}
        disabled={!canRecord}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => recordDecision('approved')}
          disabled={Boolean(submitting) || !canRecord}
        >
          <Check />
          {submitting === 'approved' ? 'Approving...' : 'Approve'}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => recordDecision('requested_tests')}
          disabled={Boolean(submitting) || !canRecord}
        >
          <MessageSquare />
          {submitting === 'requested_tests' ? 'Requesting...' : 'Request tests'}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => recordDecision('risk_accepted')}
          disabled={Boolean(submitting) || !canRecord}
        >
          <ShieldAlert />
          {submitting === 'risk_accepted' ? 'Recording...' : 'Accept risk'}
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={() => recordDecision('rejected')}
          disabled={Boolean(submitting) || !canRecord}
        >
          <X />
          {submitting === 'rejected' ? 'Rejecting...' : 'Reject'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {message}
      </p>
    </div>
  )
}
