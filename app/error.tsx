'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-4 flex size-10 items-center justify-center rounded-card bg-danger-subtle text-danger">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <p className="text-sm text-muted-foreground">
            AgentGate could not load this view. The error has been surfaced to
            the runtime logs with the current release context.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <Button type="button" variant="secondary" asChild>
            <a href="/dashboard">Go to dashboard</a>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
