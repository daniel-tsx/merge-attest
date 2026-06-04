import { NextResponse } from 'next/server'
import {
  processLemonSqueezySubscriptionEvent,
  unmarshalLemonSqueezyWebhook,
} from '@/lib/lemon-squeezy-webhooks'
import { logEvent, reportError } from '@/lib/observability'

function getWebhookErrorStatus(error: unknown) {
  if (
    error instanceof Error &&
    error.message === 'Invalid Lemon Squeezy webhook signature.'
  ) {
    return 401
  }
  if (
    error instanceof SyntaxError ||
    (error instanceof Error &&
      error.message === 'Unsupported Lemon Squeezy webhook event payload.')
  ) {
    return 400
  }

  return 500
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-signature')

  try {
    const event = unmarshalLemonSqueezyWebhook(rawBody, signature)
    const result = await processLemonSqueezySubscriptionEvent(event)

    try {
      logEvent({
        area: 'billing',
        action: 'lemon_squeezy_webhook_processed',
        message: result.message,
        metadata: {
          eventName: event.eventName,
          processed: result.processed,
        },
      })
    } catch (error) {
      reportError({
        area: 'billing',
        action: 'lemon_squeezy_webhook_log_failed',
        error,
        metadata: { eventName: event.eventName },
      })
    }

    return NextResponse.json({
      received: true,
      event: event.eventName,
      ...result,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid Lemon Squeezy webhook.'
    const status = getWebhookErrorStatus(error)
    reportError({
      area: 'billing',
      action: 'lemon_squeezy_webhook_failed',
      error,
      metadata: { hasSignature: Boolean(signature) },
    })
    return NextResponse.json(
      {
        error:
          status === 500 ? 'Lemon Squeezy webhook processing failed.' : message,
      },
      { status },
    )
  }
}
