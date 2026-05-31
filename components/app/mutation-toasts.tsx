'use client'

import * as React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

type ToastEntry = { type: 'success' | 'info' | 'error'; text: string }

const assignmentMessages: Record<string, ToastEntry> = {
  assigned: { type: 'success', text: 'Reviewer assignment updated.' },
  unassigned: { type: 'info', text: 'Reviewer assignment cleared.' },
  forbidden: {
    type: 'error',
    text: 'You do not have permission to assign reviewers.',
  },
  invalid_assignee: { type: 'error', text: 'That reviewer is not eligible.' },
  not_found: { type: 'error', text: 'Pull request not found.' },
  auth_required: { type: 'error', text: 'Sign in to assign reviewers.' },
}

const commentMessages: Record<string, ToastEntry> = {
  added: { type: 'success', text: 'Internal review note added.' },
  forbidden: {
    type: 'error',
    text: 'You do not have permission to add review notes.',
  },
  empty: { type: 'info', text: 'Write a note before submitting.' },
  not_found: { type: 'error', text: 'Pull request not found.' },
  auth_required: { type: 'error', text: 'Sign in to add review notes.' },
}

function fire(entry: ToastEntry) {
  if (entry.type === 'success') toast.success(entry.text)
  else if (entry.type === 'error') toast.error(entry.text)
  else toast(entry.text)
}

/**
 * Surfaces server-action results (assignment / comment redirects) as toasts,
 * then strips the params so they don't re-fire on refresh or back-navigation.
 */
export function MutationToasts() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const assignment = searchParams.get('assignment')
  const comment = searchParams.get('comment')

  React.useEffect(() => {
    if (!assignment && !comment) return

    const entries = [
      assignment ? assignmentMessages[assignment] : undefined,
      comment ? commentMessages[comment] : undefined,
    ].filter((entry): entry is ToastEntry => Boolean(entry))
    entries.forEach(fire)

    const params = new URLSearchParams(searchParams)
    params.delete('assignment')
    params.delete('comment')
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    })
  }, [assignment, comment, pathname, router, searchParams])

  return null
}
