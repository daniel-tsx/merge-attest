import { NextRequest, NextResponse } from 'next/server'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import { canCommentOnPullRequest } from '@/lib/collaboration'
import { getPrismaClient } from '@/lib/prisma'

function redirectToPullRequest(
  request: NextRequest,
  pullRequestId: string,
  status: string,
) {
  const url = new URL(`/pull-requests/${pullRequestId}`, request.url)
  url.searchParams.set('comment', status)
  return NextResponse.redirect(url, { status: 303 })
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

  if (!canCommentOnPullRequest(organization.role)) {
    return redirectToPullRequest(request, id, 'forbidden')
  }

  const pullRequest = await prisma.pullRequest.findFirst({
    where: { id, organizationId: organization.id },
  })

  if (!pullRequest) return redirectToPullRequest(request, id, 'not_found')

  const formData = await request.formData()
  const body =
    typeof formData.get('body') === 'string'
      ? String(formData.get('body')).trim().slice(0, 2000)
      : ''

  if (!body) return redirectToPullRequest(request, id, 'empty')

  const comment = await prisma.pullRequestComment.create({
    data: {
      body,
      authorId: organization.userId,
      pullRequestId: pullRequest.id,
    },
  })

  await prisma.auditEvent.create({
    data: {
      eventType: 'approval_requested',
      actor: organization.userName || organization.userEmail,
      summary: `Added internal review note to #${pullRequest.number}`,
      metadata: { commentId: comment.id },
      organizationId: organization.id,
      repositoryId: pullRequest.repositoryId,
      pullRequestId: pullRequest.id,
    },
  })

  return redirectToPullRequest(request, id, 'added')
}
