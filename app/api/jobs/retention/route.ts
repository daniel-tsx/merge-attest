import { NextResponse } from 'next/server'
import { authorizeJobRequest } from '@/lib/job-auth'
import { logEvent } from '@/lib/observability'
import { cleanupOperationalData } from '@/lib/retention'

export async function POST(request: Request) {
  const authorization = authorizeJobRequest(request)
  if (!authorization.ok) {
    return NextResponse.json(
      { error: authorization.message },
      { status: authorization.status },
    )
  }

  const result = await cleanupOperationalData()

  logEvent({
    area: 'jobs',
    action: 'retention_cleanup_completed',
    message: 'Operational retention cleanup completed.',
    metadata: result,
  })

  return NextResponse.json(result)
}
