import { NextRequest, NextResponse } from 'next/server'
import { getAuditRetentionStart } from '@/lib/audit-export'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import { canExportAudit } from '@/lib/collaboration'
import {
  getPullRequest,
  listActivityEvents,
  listAuditEvents,
} from '@/lib/data/app-data'
import { isFeatureAvailable } from '@/lib/plans'
import {
  buildPullRequestTimeline,
  serializeIncidentReviewPacket,
} from '@/lib/reporting'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const organization = await ensureCurrentUserOrganization()
  const { id } = await params

  if (!organization) {
    return NextResponse.json(
      { error: 'Authentication and database access are required.' },
      { status: 401 },
    )
  }

  if (!canExportAudit(organization.role)) {
    return NextResponse.json(
      { error: 'Only owners and admins can export review packets.' },
      { status: 403 },
    )
  }

  if (!isFeatureAvailable(organization.planKey, 'auditExport')) {
    return NextResponse.json(
      { error: 'Review packet exports are not enabled for this workspace.' },
      { status: 403 },
    )
  }

  const pullRequest = await getPullRequest(organization.id, id)
  if (!pullRequest) {
    return NextResponse.json(
      { error: 'Pull request not found.' },
      { status: 404 },
    )
  }

  const [auditEvents, activityEvents] = await Promise.all([
    listAuditEvents(organization.id, {
      pullRequestId: pullRequest.id,
      since: getAuditRetentionStart(organization.planKey),
      take: 200,
    }),
    listActivityEvents(organization.id, {
      pullRequestId: pullRequest.id,
      take: 200,
    }),
  ])
  const timeline = buildPullRequestTimeline({
    pullRequest,
    auditEvents,
    activityEvents,
  })
  const packet = serializeIncidentReviewPacket({ pullRequest, timeline })
  const fileName = `auteur-pr-${pullRequest.number}-review-packet.md`

  return new Response(packet, {
    headers: {
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  })
}
