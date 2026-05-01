import { getBillingMode } from '@/lib/billing'
import { isDatabaseConfigured } from '@/lib/env'
import { githubConfigured } from '@/lib/github'
import { getPrismaClient } from '@/lib/prisma'

export type DiagnosticStatus = 'ok' | 'warning' | 'error'

export type DiagnosticCheck = {
  name: string
  status: DiagnosticStatus
  message: string
  metadata?: Record<string, string | number | boolean | null>
}

function statusFromBoolean(
  name: string,
  configured: boolean,
  configuredMessage: string,
  missingMessage: string,
): DiagnosticCheck {
  return {
    name,
    status: configured ? 'ok' : 'warning',
    message: configured ? configuredMessage : missingMessage,
  }
}

export async function getHealthDiagnostics(): Promise<DiagnosticCheck[]> {
  const prisma = getPrismaClient()
  const checks: DiagnosticCheck[] = []

  if (!isDatabaseConfigured() || !prisma) {
    checks.push({
      name: 'database',
      status: 'error',
      message: 'DATABASE_URL is not configured.',
    })
  } else {
    try {
      await prisma.$queryRaw`SELECT 1`
      checks.push({
        name: 'database',
        status: 'ok',
        message: 'Database connection succeeded.',
      })
    } catch {
      checks.push({
        name: 'database',
        status: 'error',
        message: 'Database connection failed.',
      })
    }
  }

  checks.push(
    statusFromBoolean(
      'github',
      githubConfigured(),
      'GitHub App credentials are configured.',
      'GitHub App credentials are missing.',
    ),
  )

  const billingMode = getBillingMode()
  checks.push({
    name: 'paddle',
    status: billingMode === 'live' ? 'ok' : 'warning',
    message:
      billingMode === 'live'
        ? 'Paddle API is configured.'
        : `Paddle billing mode is ${billingMode}.`,
  })

  if (prisma) {
    const [queued, failed] = await Promise.all([
      prisma.gitHubWebhookDelivery.count({
        where: { status: { in: ['queued', 'processing'] } },
      }),
      prisma.gitHubWebhookDelivery.count({ where: { status: 'failed' } }),
    ])
    checks.push({
      name: 'jobs',
      status: failed > 0 ? 'warning' : 'ok',
      message:
        failed > 0
          ? `${failed} webhook jobs need attention.`
          : 'Webhook job queue is healthy.',
      metadata: { queued, failed },
    })
  }

  return checks
}

export function summarizeDiagnostics(checks: DiagnosticCheck[]) {
  if (checks.some((check) => check.status === 'error')) return 'error'
  if (checks.some((check) => check.status === 'warning')) return 'warning'
  return 'ok'
}
