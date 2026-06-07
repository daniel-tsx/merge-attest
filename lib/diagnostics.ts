import { getBillingMode } from '@/lib/billing'
import { getEmailDeliveryMode } from '@/lib/email'
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

export function getJobRunnerDiagnostic(
  env: Record<string, string | undefined> = process.env,
): DiagnosticCheck {
  return statusFromBoolean(
    'job_runner',
    Boolean(env.JOB_RUNNER_SECRET?.trim()),
    'Job runner bearer secret is configured.',
    'JOB_RUNNER_SECRET is missing; scheduled jobs cannot run safely.',
  )
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
    name: 'lemon_squeezy',
    status: billingMode === 'unconfigured' ? 'warning' : 'ok',
    message:
      billingMode === 'live'
        ? 'Lemon Squeezy API is configured.'
        : billingMode === 'disabled'
          ? 'Paid billing is disabled for free early access.'
          : `Lemon Squeezy billing mode is ${billingMode}.`,
  })

  checks.push(getJobRunnerDiagnostic())

  const emailDeliveryMode = getEmailDeliveryMode()
  checks.push({
    name: 'email',
    status: emailDeliveryMode === 'live' ? 'ok' : 'warning',
    message:
      emailDeliveryMode === 'live'
        ? 'Transactional email is configured.'
        : `Transactional email mode is ${emailDeliveryMode}.`,
  })

  if (prisma) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const staleAiReviewCutoff = new Date(Date.now() - 60 * 60 * 1000)
    const [queued, failed, staleProcessedDeliveries, staleAuditExports] =
      await Promise.all([
        prisma.gitHubWebhookDelivery.count({
          where: { status: { in: ['queued', 'processing'] } },
        }),
        prisma.gitHubWebhookDelivery.count({ where: { status: 'failed' } }),
        prisma.gitHubWebhookDelivery.count({
          where: {
            status: { in: ['processed', 'ignored'] },
            createdAt: { lt: thirtyDaysAgo },
          },
        }),
        prisma.auditExport.count({
          where: { createdAt: { lt: thirtyDaysAgo } },
        }),
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

    const [aiQueued, aiActive, aiBlocked, aiFailed, staleAiReviewJobs] =
      await Promise.all([
        prisma.aiReviewJob.count({ where: { status: 'queued' } }),
        prisma.aiReviewJob.count({ where: { status: 'in_progress' } }),
        prisma.aiReviewJob.count({ where: { status: 'blocked' } }),
        prisma.aiReviewJob.count({ where: { status: 'failed' } }),
        prisma.aiReviewJob.count({
          where: {
            status: { in: ['queued', 'in_progress'] },
            updatedAt: { lt: staleAiReviewCutoff },
          },
        }),
      ])
    checks.push({
      name: 'ai_review_jobs',
      status: aiFailed > 0 || staleAiReviewJobs > 0 ? 'warning' : 'ok',
      message:
        aiFailed > 0 || staleAiReviewJobs > 0
          ? 'AI review jobs need attention.'
          : 'AI review job lifecycle is healthy.',
      metadata: {
        queued: aiQueued,
        active: aiActive,
        blocked: aiBlocked,
        failed: aiFailed,
        stale: staleAiReviewJobs,
      },
    })

    checks.push({
      name: 'retention',
      status:
        staleProcessedDeliveries > 0 || staleAuditExports > 0
          ? 'warning'
          : 'ok',
      message:
        staleProcessedDeliveries > 0 || staleAuditExports > 0
          ? 'Operational retention cleanup has stale records to remove.'
          : 'Operational retention cleanup is current.',
      metadata: {
        staleProcessedDeliveries,
        staleAuditExports,
      },
    })
  }

  return checks
}

export function summarizeDiagnostics(checks: DiagnosticCheck[]) {
  if (checks.some((check) => check.status === 'error')) return 'error'
  if (checks.some((check) => check.status === 'warning')) return 'warning'
  return 'ok'
}
