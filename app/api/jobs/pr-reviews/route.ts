import { NextRequest, NextResponse } from 'next/server'
import { processQueuedAiReviewJobs } from '@/lib/jobs/pr-review-worker'
import { parseJobLimit } from '@/lib/jobs/queue'
import { authorizeJobRequest } from '@/lib/job-auth'
import { logEvent } from '@/lib/observability'

export async function POST(request: NextRequest) {
  const authorization = authorizeJobRequest(request)
  if (!authorization.ok) {
    return NextResponse.json(
      { error: authorization.message },
      { status: authorization.status },
    )
  }

  const limit = parseJobLimit(request.nextUrl.searchParams.get('limit'), {
    fallback: 25,
    max: 100,
  })
  const result = await processQueuedAiReviewJobs({ limit })

  logEvent({
    area: 'jobs',
    action: 'pr_review_runner_completed',
    message: 'PR review job runner completed.',
    metadata: result,
  })

  return NextResponse.json(result)
}
