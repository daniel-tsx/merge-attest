'use client'

import { useEffect } from 'react'
import { GateScan } from '@/components/app/gate-scan'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-col items-start gap-3 border-b-0 pb-0">
          <GateScan size="lg" tone="danger" state="fissure" />
          <CardTitle className="text-base">
            The gate held this request
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Auteur could not load this view. The error has been surfaced to the
            runtime logs with the current release context.
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-subtle-foreground">
              ref: {error.digest}
            </p>
          )}
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 pt-4">
          <Button type="button" onClick={() => unstable_retry()}>
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
