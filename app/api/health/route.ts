import { NextResponse } from 'next/server'
import { getHealthDiagnostics, summarizeDiagnostics } from '@/lib/diagnostics'
import { getErrorTrackingContext, logEvent } from '@/lib/observability'

export async function GET() {
  const checks = await getHealthDiagnostics()
  const status = summarizeDiagnostics(checks)

  logEvent({
    area: 'health',
    action: 'health_check',
    message: `Health check completed with ${status} status.`,
    metadata: { status },
  })

  return NextResponse.json(
    {
      status,
      context: getErrorTrackingContext(),
      checks,
    },
    { status: status === 'error' ? 503 : 200 },
  )
}
