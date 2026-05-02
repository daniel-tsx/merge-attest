import Link from 'next/link'
import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-4 flex size-10 items-center justify-center rounded-card bg-surface-muted text-muted-foreground">
            <SearchX className="size-5" aria-hidden="true" />
          </div>
          <CardTitle>Page not found</CardTitle>
          <p className="text-sm text-muted-foreground">
            This page may have moved, or the pull request, repository, or
            workspace resource may no longer be available.
          </p>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
