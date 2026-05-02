import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-control bg-surface-muted',
        className,
      )}
    />
  )
}

export function PageLoading({
  metricCardCount = 4,
  title = 'Loading workspace',
}: {
  metricCardCount?: number
  title?: string
}) {
  return (
    <div className="space-y-6" aria-label={title} aria-live="polite">
      <div className="space-y-2 border-b border-border pb-4">
        <SkeletonBlock className="h-7 w-48" />
        <SkeletonBlock className="h-4 w-full max-w-2xl" />
      </div>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: metricCardCount }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-4">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="h-7 w-16" />
            </CardContent>
          </Card>
        ))}
      </section>
      <Card>
        <CardContent className="space-y-3 p-4">
          <SkeletonBlock className="h-10 w-full max-w-xl" />
          <SkeletonBlock className="h-40 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
