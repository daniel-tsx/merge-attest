'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { signIn } from '@/lib/auth-client'

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
      router.push(searchParams.get('callbackUrl') || '/dashboard')
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
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-slate-950 text-white">
            <ShieldCheck className="size-5" />
          </div>
          <CardTitle className="text-xl">Sign in to AgentGate</CardTitle>
          <p className="text-sm text-slate-600">
            Continue to your AI pull request control center.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="email"
              >
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="password"
              >
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {error ? (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            New to AgentGate?{' '}
            <Link
              className="font-medium text-slate-950 hover:underline"
              href="/sign-up"
            >
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
