import { NextResponse } from 'next/server'
import { verifyGitHubWebhook } from '@/lib/github'
import { processGitHubWebhookDelivery } from '@/lib/github-webhooks'

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
    return NextResponse.json(
      { error: verificationError(verification.reason) },
      { status: 401 },
    )
  }

  const event = request.headers.get('x-github-event') ?? 'unknown'
  const deliveryId = request.headers.get('x-github-delivery')

  try {
    const result = await processGitHubWebhookDelivery({
      deliveryId,
      event,
      rawBody,
    })

    return NextResponse.json({
      ...result,
      mode: verification.mode === 'demo' ? 'demo' : result.mode,
    })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid GitHub webhook JSON payload' },
        { status: 400 },
      )
    }

    console.error('GitHub webhook processing failed', error)
    return NextResponse.json(
      { error: 'GitHub webhook processing failed' },
      { status: 500 },
    )
  }
}
