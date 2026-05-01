import { NextResponse } from 'next/server'
import {
  processPaddleSubscriptionEvent,
  unmarshalPaddleWebhook,
} from '@/lib/paddle-webhooks'
import { logEvent, reportError } from '@/lib/observability'

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('paddle-signature')

  try {
    const event = await unmarshalPaddleWebhook(rawBody, signature)
    const result = await processPaddleSubscriptionEvent(event)

    logEvent({
      area: 'billing',
      action: 'paddle_webhook_processed',
      message: result.message,
      metadata: {
        eventType: event.eventType,
        processed: result.processed,
      },
    })

    return NextResponse.json({
      received: true,
      event: event.eventType,
      ...result,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid Paddle webhook.'
    reportError({
      area: 'billing',
      action: 'paddle_webhook_failed',
      error,
      metadata: { hasSignature: Boolean(signature) },
    })
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
