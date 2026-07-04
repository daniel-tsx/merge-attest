'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { AuthShell } from '@/components/app/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const response = await fetch('/api/auth/request-password-reset', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: String(formData.get('email') ?? ''),
        redirectTo: `${window.location.origin}/reset-password`,
      }),
    })

    setSubmitting(false)
    if (!response.ok) {
      setError('Unable to request a password reset right now.')
      return
    }

    setSent(true)
  }

  return (
    <AuthShell
      title="Reset your password"
      description="Enter your email and we'll send a secure reset link if the account exists."
      footer={
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-accent"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-control bg-success-soft text-success-strong">
            <CheckCircle2 className="size-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Check your inbox
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              If an account exists, we&apos;ve sent a password reset link to
              your email. The link is single-use and expires within an hour.
            </p>
          </div>
          <Button asChild className="w-full" variant="secondary">
            <Link href="/sign-in">Return to sign in</Link>
          </Button>
        </div>
      ) : (
        <form className="space-y-5" method="post" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label
              className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle-foreground"
              htmlFor="email"
            >
              Work email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
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
            {submitting ? 'Sending reset link...' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
