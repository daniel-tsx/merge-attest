'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { AuthShell } from '@/components/app/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const searchParams = new URLSearchParams(window.location.search)
    const token = searchParams.get('token')
    const newPassword = String(formData.get('password') ?? '')
    const confirmPassword = String(formData.get('confirmPassword') ?? '')

    if (!token) {
      setError('This password reset link is invalid or expired.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    })
    setSubmitting(false)

    if (!response.ok) {
      setError('Unable to reset your password with this link.')
      return
    }

    router.push('/sign-in')
  }

  return (
    <AuthShell
      title="Choose a new password"
      description="Password reset links are single-use and expire automatically."
      footer={
        <>
          Need another link?{' '}
          <Link
            className="font-medium text-foreground hover:text-accent"
            href="/forgot-password"
          >
            Request password reset
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label
            className="text-xs font-medium uppercase tracking-wider text-subtle-foreground"
            htmlFor="password"
          >
            New password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            placeholder="Minimum 8 characters"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label
            className="text-xs font-medium uppercase tracking-wider text-subtle-foreground"
            htmlFor="confirmPassword"
          >
            Confirm password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        {error ? (
          <p
            role="alert"
            className="rounded-control border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger"
          >
            {error}
          </p>
        ) : null}
        <Button className="w-full" type="submit" disabled={submitting}>
          {submitting ? 'Resetting password...' : 'Reset password'}
        </Button>
      </form>
    </AuthShell>
  )
}
