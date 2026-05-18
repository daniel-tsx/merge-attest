import { NextResponse } from 'next/server'
import {
  processLemonSqueezySubscriptionEvent,
  unmarshalLemonSqueezyWebhook,
} from '@/lib/lemon-squeezy-webhooks'
import { logEvent, reportError } from '@/lib/observability'

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-signature')

  try {
    const event = unmarshalLemonSqueezyWebhook(rawBody, signature)
    const result = await processLemonSqueezySubscriptionEvent(event)

    logEvent({
      area: 'billing',
      action: 'lemon_squeezy_webhook_processed',
      message: result.message,
      metadata: {
        eventName: event.eventName,
        processed: result.processed,
      },
    })

    return NextResponse.json({
      received: true,
      event: event.eventName,
      ...result,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Invalid Lemon Squeezy webhook.'
    reportError({
      area: 'billing',
      action: 'lemon_squeezy_webhook_failed',
      error,
      metadata: { hasSignature: Boolean(signature) },
    })
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
