import { NextRequest, NextResponse } from 'next/server'
import { processQueuedGitHubWebhookDeliveries } from '@/lib/github-webhooks'
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

  const limitValue = Number(request.nextUrl.searchParams.get('limit') ?? 25)
  const limit = Number.isFinite(limitValue)
    ? Math.min(Math.max(Math.trunc(limitValue), 1), 100)
    : 25
  const result = await processQueuedGitHubWebhookDeliveries({ limit })

  logEvent({
    area: 'jobs',
    action: 'github_webhook_runner_completed',
    message: 'GitHub webhook job runner completed.',
    metadata: result,
  })

  return NextResponse.json(result)
}
