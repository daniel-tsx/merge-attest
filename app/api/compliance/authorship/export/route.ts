import { NextRequest, NextResponse } from 'next/server'
import { getAuditRetentionStart } from '@/lib/audit-export'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import { canExportAudit } from '@/lib/collaboration'
import {
  buildAuthorshipEvidenceBundle,
  serializeAuthorshipLedgerCsv,
} from '@/lib/compliance-export'
import { listPullRequests } from '@/lib/data/app-data'
import { isFeatureAvailable } from '@/lib/plans'
import { getPrismaClient } from '@/lib/prisma'
import { buildAuthorshipLedger } from '@/lib/reporting'

function exportHeaders(fileName: string, contentType: string) {
  return {
    'Cache-Control': 'private, no-store',
    'Content-Disposition': `attachment; filename="${fileName}"`,
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
  }
}

export async function GET(request: NextRequest) {
  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()

  if (!organization || !prisma) {
    return NextResponse.json(
      { error: 'Authentication and database access are required.' },
      { status: 401 },
    )
  }

  if (!canExportAudit(organization.role)) {
    return NextResponse.json(
      { error: 'Only owners and admins can export compliance evidence.' },
      { status: 403 },
    )
  }

  if (!isFeatureAvailable(organization.planKey, 'auditExport')) {
    return NextResponse.json(
      { error: 'Compliance exports are not enabled for this workspace.' },
      { status: 403 },
    )
  }

  const format =
    request.nextUrl.searchParams.get('format') === 'json' ? 'json' : 'csv'
  const retentionStart = getAuditRetentionStart(organization.planKey)
  const allPullRequests = await listPullRequests(organization.id)
  const pullRequests = retentionStart
    ? allPullRequests.filter(
        (pr) => new Date(pr.updatedAt).getTime() >= retentionStart.getTime(),
      )
    : allPullRequests

  const timestamp = new Date().toISOString().slice(0, 10)
  let body: string
  let fileName: string
  let contentType: string

  if (format === 'json') {
    const bundle = buildAuthorshipEvidenceBundle({
      organization: {
        id: organization.id,
        name: organization.name,
        planKey: organization.planKey,
      },
      pullRequests,
      retentionWindowStart: retentionStart?.toISOString(),
    })
    body = JSON.stringify(bundle, null, 2)
    fileName = `mergeattest-authorship-evidence-${timestamp}.json`
    contentType = 'application/json; charset=utf-8'
  } else {
    const ledger = buildAuthorshipLedger(pullRequests)
    body = serializeAuthorshipLedgerCsv(ledger)
    fileName = `mergeattest-authorship-${timestamp}.csv`
    contentType = 'text/csv; charset=utf-8'
  }

  await prisma.auditExport.create({
    data: {
      fileName,
      format,
      filters: Object.fromEntries(
        Object.entries({
          exportType: 'authorship',
          retentionWindowStart: retentionStart?.toISOString(),
        }).filter(([, value]) => value !== undefined),
      ),
      eventCount: pullRequests.length,
      createdById: organization.userId,
      organizationId: organization.id,
    },
  })

  return new Response(body, {
    headers: exportHeaders(fileName, contentType),
  })
}
