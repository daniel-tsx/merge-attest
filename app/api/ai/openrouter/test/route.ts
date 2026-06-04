import { NextResponse } from 'next/server'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import { canManageSettings } from '@/lib/collaboration'
import {
  normalizeOpenRouterKey,
  verifyOpenRouterKey,
} from '@/lib/ai/openrouter'
import { getPrismaClient } from '@/lib/prisma'

const MAX_OPENROUTER_TEST_BODY_BYTES = 8192

export async function POST(request: Request) {
  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()
  if (!organization || !prisma) {
    return NextResponse.json(
      { valid: false, modelCount: 0, message: 'Authentication required.' },
      { status: 401 },
    )
  }
  if (!canManageSettings(organization.role)) {
    return NextResponse.json(
      { valid: false, modelCount: 0, message: 'Forbidden.' },
      { status: 403 },
    )
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > MAX_OPENROUTER_TEST_BODY_BYTES) {
    return NextResponse.json(
      {
        valid: false,
        modelCount: 0,
        message: 'Request body is too large.',
      },
      { status: 413 },
    )
  }

  const rawBody = await request.text()
  if (rawBody.length > MAX_OPENROUTER_TEST_BODY_BYTES) {
    return NextResponse.json(
      {
        valid: false,
        modelCount: 0,
        message: 'Request body is too large.',
      },
      { status: 413 },
    )
  }

  const body = rawBody
    ? await Promise.resolve()
        .then(() => JSON.parse(rawBody) as { apiKey?: unknown } | null)
        .catch(() => null)
    : null
  const apiKey = normalizeOpenRouterKey(body?.apiKey)
  const result = await verifyOpenRouterKey(apiKey)

  return NextResponse.json(result, { status: result.valid ? 200 : 400 })
}
