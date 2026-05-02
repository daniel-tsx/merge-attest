'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-slate-950 text-white">
            <ShieldCheck className="size-5" />
          </div>
          <CardTitle className="text-xl">Reset your password</CardTitle>
          <p className="text-sm text-slate-600">
            Enter your email and we will send a secure reset link if the account
            exists.
          </p>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                Check your email for the password reset link.
              </p>
              <Button asChild className="w-full" variant="secondary">
                <Link href="/sign-in">Back to sign in</Link>
              </Button>
            </div>
          ) : (
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
              {error ? (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}
              <Button className="w-full" type="submit" disabled={submitting}>
                {submitting ? 'Sending reset link...' : 'Send reset link'}
              </Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm text-slate-600">
            Remembered it?{' '}
            <Link
              className="font-medium text-slate-950 hover:underline"
              href="/sign-in"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
