'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { AuthShell } from '@/components/app/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signIn } from '@/lib/auth-client'
import { safeRelativeRedirect } from '@/lib/redirects'

async function ensureOrganization() {
  const response = await fetch('/api/onboarding/organization', {
    method: 'POST',
  })
  if (!response.ok) throw new Error('Could not prepare your workspace.')
}

export default function SignInPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const result = await signIn.email({
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
    })

    if (result.error) {
      setSubmitting(false)
      setError(result.error.message || 'Unable to sign in.')
      return
    }

    try {
      await ensureOrganization()
      const searchParams = new URLSearchParams(window.location.search)
      router.push(safeRelativeRedirect(searchParams.get('callbackUrl')))
      router.refresh()
    } catch (err) {
      setSubmitting(false)
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to prepare your workspace.',
      )
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue to your AI pull request control center."
      footer={
        <>
          New to AgentGate?{' '}
          <Link
            className="font-medium text-foreground hover:text-accent"
            href="/sign-up"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
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
          <div className="flex items-center justify-between">
            <label
              className="text-xs font-medium uppercase tracking-wider text-subtle-foreground"
              htmlFor="password"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-accent hover:underline"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
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
          {submitting ? 'Signing in...' : 'Sign in'}
          <ArrowRight aria-hidden="true" />
        </Button>
      </form>
    </AuthShell>
  )
}
