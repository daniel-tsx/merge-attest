import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AdminPager({
  prevHref,
  nextHref,
}: {
  prevHref: string | null
  nextHref: string | null
}) {
  if (!prevHref && !nextHref) return null

  return (
    <div className="flex items-center justify-end gap-2">
      {prevHref ? (
        <Button variant="secondary" size="sm" asChild>
          <Link href={prevHref}>
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            Previous
          </Link>
        </Button>
      ) : (
        <Button variant="secondary" size="sm" disabled>
          <ChevronLeft className="size-3.5" aria-hidden="true" />
          Previous
        </Button>
      )}
      {nextHref ? (
        <Button variant="secondary" size="sm" asChild>
          <Link href={nextHref}>
            Next
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Link>
        </Button>
      ) : (
        <Button variant="secondary" size="sm" disabled>
          Next
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}
