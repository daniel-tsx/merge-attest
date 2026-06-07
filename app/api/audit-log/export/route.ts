import { NextRequest, NextResponse } from 'next/server'
import {
  getAuditRetentionStart,
  serializeAuditEventsToCsv,
} from '@/lib/audit-export'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import { canExportAudit } from '@/lib/collaboration'
import { listAuditEvents } from '@/lib/data/app-data'
import { isFeatureAvailable } from '@/lib/plans'
import { getPrismaClient } from '@/lib/prisma'

function readParam(request: NextRequest, key: string) {
  return request.nextUrl.searchParams.get(key) || undefined
}

function readDateParam(request: NextRequest, key: string) {
  const value = readParam(request, key)
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
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
      { error: 'Only owners and admins can export audit logs.' },
      { status: 403 },
    )
  }

  if (!isFeatureAvailable(organization.planKey, 'auditExport')) {
    return NextResponse.json(
      { error: 'Audit exports are not enabled for this workspace.' },
      { status: 403 },
    )
  }

  const filters = {
    query: readParam(request, 'query'),
    eventType: readParam(request, 'eventType'),
    actor: readParam(request, 'actor'),
    repositoryId: readParam(request, 'repositoryId'),
    pullRequestNumber: readParam(request, 'pullRequestNumber'),
    severity: readParam(request, 'severity'),
    from: readDateParam(request, 'from'),
    to: readDateParam(request, 'to'),
    since: getAuditRetentionStart(organization.planKey),
    take: 10_000,
  }
  const events = await listAuditEvents(organization.id, {
    ...filters,
  })
  const csv = serializeAuditEventsToCsv(events)
  const timestamp = new Date().toISOString().slice(0, 10)
  const fileName = `auteur-audit-${timestamp}.csv`

  await prisma.auditExport.create({
    data: {
      fileName,
      filters: Object.fromEntries(
        Object.entries(filters)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [
            key,
            value instanceof Date ? value.toISOString() : value,
          ]),
      ),
      eventCount: events.length,
      createdById: organization.userId,
      organizationId: organization.id,
    },
  })

  return new Response(csv, {
    headers: {
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Type': 'text/csv; charset=utf-8',
    },
  })
}
