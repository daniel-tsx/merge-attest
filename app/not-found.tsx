import Link from 'next/link'
import { GateScan } from '@/components/app/gate-scan'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-col items-start gap-3 border-b-0 pb-0">
          <GateScan size="lg" tone="muted" state="question" />
          <CardTitle className="text-base">Page not found</CardTitle>
          <p className="text-sm text-muted-foreground">
            This page may have moved, or the pull request, repository, or
            workspace resource may no longer be available.
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
