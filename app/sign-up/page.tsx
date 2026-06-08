'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { AuthShell } from '@/components/app/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signUp } from '@/lib/auth-client'
import { safeRelativeRedirect } from '@/lib/redirects'

async function ensureOrganization() {
  const response = await fetch('/api/onboarding/organization', {
    method: 'POST',
  })
  if (response.status === 401) return false
  if (!response.ok) throw new Error('Could not create your workspace.')
  return true
}

export default function SignUpPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const result = await signUp.email({
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
    })

    if (result.error) {
      setSubmitting(false)
      setError(result.error.message || 'Unable to create your account.')
      return
    }

    try {
      const workspaceReady = await ensureOrganization()
      if (!workspaceReady) {
        setSubmitting(false)
        setMessage('Check your email to verify your account before signing in.')
        return
      }
      const searchParams = new URLSearchParams(window.location.search)
      router.push(safeRelativeRedirect(searchParams.get('callbackUrl')))
      router.refresh()
    } catch (err) {
      setSubmitting(false)
      setError(
        err instanceof Error ? err.message : 'Unable to create your workspace.',
      )
    }
  }

  return (
    <AuthShell
      title="Create your workspace"
      description="Start monitoring AI-assisted pull requests in minutes — free to get started."
      footer={
        <>
          Already have an account?{' '}
          <Link
            className="font-medium text-foreground hover:text-accent"
            href="/sign-in"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label
            className="text-xs font-medium uppercase tracking-wider text-subtle-foreground"
            htmlFor="name"
          >
            Full name
          </label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Jane Engineer"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label
            className="text-xs font-medium uppercase tracking-wider text-subtle-foreground"
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
        <div className="space-y-1.5">
          <label
            className="text-xs font-medium uppercase tracking-wider text-subtle-foreground"
            htmlFor="password"
          >
            Password
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
        {error ? (
          <p
            role="alert"
            className="rounded-control border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger"
          >
            {error}
          </p>
        ) : null}
        {message ? (
          <p
            role="status"
            className="rounded-control border border-success-border bg-success-soft px-3 py-2 text-sm text-success-strong"
          >
            {message}
          </p>
        ) : null}
        <Button className="w-full" type="submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
          <ArrowRight aria-hidden="true" />
        </Button>
        <p className="text-center text-xs text-subtle-foreground">
          By creating an account you agree to MergeAttest&apos;s{' '}
          <Link
            href="/terms"
            className="text-foreground underline underline-offset-4"
          >
            terms
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy"
            className="text-foreground underline underline-offset-4"
          >
            privacy policy
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  )
}
