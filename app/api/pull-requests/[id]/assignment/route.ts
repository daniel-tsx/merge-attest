import { NextRequest, NextResponse } from 'next/server'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import { canRecordApproval, defaultReviewDueAt } from '@/lib/collaboration'
import { getPrismaClient } from '@/lib/prisma'

function redirectToPullRequest(
  request: NextRequest,
  pullRequestId: string,
  status: string,
) {
  const url = new URL(`/pull-requests/${pullRequestId}`, request.url)
  url.searchParams.set('assignment', status)
  return NextResponse.redirect(url, { status: 303 })
}

function parseDueAt(value: FormDataEntryValue | null, fallback: Date) {
  if (typeof value !== 'string' || !value) return fallback
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()
  const { id } = await params

  if (!organization || !prisma) {
    return redirectToPullRequest(request, id, 'auth_required')
  }

  if (!canRecordApproval(organization.role)) {
    return redirectToPullRequest(request, id, 'forbidden')
  }

  const pullRequest = await prisma.pullRequest.findFirst({
    where: { id, organizationId: organization.id },
    include: { repository: true },
  })

  if (!pullRequest) return redirectToPullRequest(request, id, 'not_found')

  const formData = await request.formData()
  const assigneeId = String(formData.get('assigneeId') ?? '')
  const fallbackDueAt = defaultReviewDueAt(pullRequest.riskLevel)
  const reviewDueAt = parseDueAt(formData.get('reviewDueAt'), fallbackDueAt)
  const assignee = assigneeId
    ? await prisma.organizationMember.findFirst({
        where: {
          organizationId: organization.id,
          userId: assigneeId,
          role: { not: 'viewer' },
        },
        include: { user: true },
      })
    : null

  if (assigneeId && !assignee) {
    return redirectToPullRequest(request, id, 'invalid_assignee')
  }

  await prisma.pullRequest.update({
    where: { id: pullRequest.id },
    data: {
      assignedReviewerId: assignee?.userId ?? null,
      reviewDueAt: assignee ? reviewDueAt : null,
    },
  })

  await prisma.auditEvent.create({
    data: {
      eventType: 'approval_requested',
      actor: organization.userName || organization.userEmail,
      summary: assignee
        ? `Assigned #${pullRequest.number} to ${assignee.user.name || assignee.user.email}`
        : `Cleared reviewer assignment for #${pullRequest.number}`,
      metadata: {
        assigneeId: assignee?.userId,
        assigneeEmail: assignee?.user.email,
        reviewDueAt: assignee ? reviewDueAt.toISOString() : undefined,
      },
      organizationId: organization.id,
      repositoryId: pullRequest.repositoryId,
      pullRequestId: pullRequest.id,
    },
  })

  return redirectToPullRequest(
    request,
    id,
    assignee ? 'assigned' : 'unassigned',
  )
}
