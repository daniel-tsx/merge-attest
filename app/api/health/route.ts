import { NextResponse } from 'next/server'
import { logEvent } from '@/lib/observability'

export async function GET() {
  logEvent({
    area: 'health',
    action: 'health_check',
    message: 'Public health check completed.',
  })

  return NextResponse.json({ status: 'ok' })
}
