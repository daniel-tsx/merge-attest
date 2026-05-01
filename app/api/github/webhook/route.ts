import { after, NextResponse } from 'next/server'
import { verifyGitHubWebhook } from '@/lib/github'
import {
  enqueueGitHubWebhookDelivery,
  processQueuedGitHubWebhookDeliveries,
} from '@/lib/github-webhooks'
import { logEvent, reportError } from '@/lib/observability'

function verificationError(
  reason?: 'missing_secret' | 'missing_signature' | 'invalid_signature',
) {
  if (reason === 'missing_secret') {
    return 'GitHub webhook secret is required in production.'
  }

  return 'Invalid GitHub webhook signature'
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const verification = verifyGitHubWebhook(
    rawBody,
    request.headers.get('x-hub-signature-256'),
  )

  if (!verification.ok) {
    logEvent({
      level: 'warn',
      area: 'github',
      action: 'webhook_verification_failed',
      message: verificationError(verification.reason),
      metadata: { reason: verification.reason ?? 'unknown' },
    })
    return NextResponse.json(
      { error: verificationError(verification.reason) },
      { status: 401 },
    )
  }

  const event = request.headers.get('x-github-event') ?? 'unknown'
  const deliveryId = request.headers.get('x-github-delivery')

  try {
    const result = await enqueueGitHubWebhookDelivery({
      deliveryId,
      event,
      rawBody,
    })

    if (result.mode === 'live' && result.queued && result.deliveryId) {
      after(async () => {
        await processQueuedGitHubWebhookDeliveries({
          deliveryId: result.deliveryId,
          limit: 1,
        })
      })
    }

    logEvent({
      area: 'github',
      action: 'webhook_enqueued',
      message: result.message,
      metadata: {
        event,
        deliveryId: result.deliveryId,
        queued: result.queued,
        duplicate: result.duplicate,
      },
    })

    return NextResponse.json(
      {
        ...result,
        mode: verification.mode === 'demo' ? 'demo' : result.mode,
      },
      { status: result.queued ? 202 : 200 },
    )
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid GitHub webhook JSON payload' },
        { status: 400 },
      )
    }

    reportError({
      area: 'github',
      action: 'webhook_processing_failed',
      error,
      metadata: { event, deliveryId },
    })
    return NextResponse.json(
      { error: 'GitHub webhook processing failed' },
      { status: 500 },
    )
  }
}
