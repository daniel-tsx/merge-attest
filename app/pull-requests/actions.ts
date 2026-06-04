'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  approvalStatusForDecision,
  approvalSummary,
  auditEventTypeForDecision,
  isApprovalDecision,
} from '@/lib/approvals'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'
import {
  canCommentOnPullRequest,
  canRecordApproval,
  defaultReviewDueAt,
} from '@/lib/collaboration'
import { postPullRequestComment, publishAgentGateCheckRun } from '@/lib/github'
import { logEvent, reportError } from '@/lib/observability'
import { isFeatureAvailable } from '@/lib/plans'
import { getPrismaClient } from '@/lib/prisma'
import type { Approval, PlanKey } from '@/lib/types'

type ApprovalDecision = Exclude<Approval['decision'], 'not_required'>

export type ApprovalActionState = {
  decision: ApprovalDecision | null
  message: string
  status: 'error' | 'idle' | 'success'
}

function fail(message: string): ApprovalActionState {
  return { decision: null, message, status: 'error' }
}

function commentBody(input: {
  decision: string
  note?: string
  reviewer: string
  riskScore: number
  riskLevel: string
}) {
  const lines = [
    `AgentGate decision: ${input.decision.replaceAll('_', ' ')}`,
    `Reviewer: ${input.reviewer}`,
    `Risk: ${input.riskScore} (${input.riskLevel})`,
  ]
  if (input.note) lines.push(`Note: ${input.note}`)
  return lines.join('\n')
}

export async function recordApprovalDecision(
  prId: string,
  _prevState: ApprovalActionState,
  formData: FormData,
): Promise<ApprovalActionState> {
  const decision = formData.get('decision')
  if (!isApprovalDecision(decision)) {
    return fail('Choose an approval decision before submitting.')
  }

  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()
  if (!organization || !prisma) {
    return fail('Authentication and database access are required.')
  }
  if (!canRecordApproval(organization.role)) {
    return fail('You do not have permission to record approval decisions.')
  }
  if (!isFeatureAvailable(organization.planKey, 'approvals')) {
    return fail('Approval workflows require the Team plan or higher.')
  }

  const rawNote = formData.get('note')
  const note =
    typeof rawNote === 'string' ? rawNote.trim().slice(0, 1000) : undefined

  const pullRequest = await prisma.pullRequest.findFirst({
    where: { id: prId, organizationId: organization.id },
    include: { repository: { include: { organization: true } } },
  })
  if (!pullRequest) {
    return fail('Pull request not found.')
  }

  const approvalStatus = approvalStatusForDecision(decision)
  await prisma.approval.create({
    data: {
      decision,
      note,
      reviewerId: organization.userId,
      pullRequestId: pullRequest.id,
    },
  })
  await prisma.pullRequest.update({
    where: { id: pullRequest.id },
    data: { approvalStatus },
  })
  await prisma.auditEvent.create({
    data: {
      eventType: auditEventTypeForDecision(decision),
      actor: organization.userName || organization.userEmail,
      summary: approvalSummary(decision, pullRequest.number),
      metadata: { decision, note, approvalStatus },
      organizationId: organization.id,
      repositoryId: pullRequest.repositoryId,
      pullRequestId: pullRequest.id,
    },
  })

  logEvent({
    area: 'approval',
    action: 'approval_decision_recorded',
    message: approvalSummary(decision, pullRequest.number),
    metadata: {
      decision,
      approvalStatus,
      pullRequestId: pullRequest.id,
      repositoryId: pullRequest.repositoryId,
    },
  })

  try {
    const canPostGitHubComment = isFeatureAvailable(
      pullRequest.repository.organization.planKey as PlanKey,
      'githubComments',
    )
    const comment = canPostGitHubComment
      ? await postPullRequestComment(
          {
            number: pullRequest.number,
            repositoryName: pullRequest.repository.name,
            owner: pullRequest.repository.owner,
            installationId:
              pullRequest.repository.organization.githubInstallationId ??
              undefined,
            commentId: pullRequest.githubAgentGateCommentId,
          },
          commentBody({
            decision,
            note,
            reviewer: organization.userName || organization.userEmail,
            riskScore: pullRequest.riskScore,
            riskLevel: pullRequest.riskLevel,
          }),
        )
      : null

    if (comment?.mode === 'live') {
      if (comment.commentId !== pullRequest.githubAgentGateCommentId) {
        await prisma.pullRequest.update({
          where: { id: pullRequest.id },
          data: { githubAgentGateCommentId: comment.commentId },
        })
      }
      await prisma.auditEvent.create({
        data: {
          eventType: 'github_comment_posted',
          actor: 'AgentGate',
          summary: `${comment.action === 'updated' ? 'Updated' : 'Posted'} GitHub approval comment for #${pullRequest.number}`,
          metadata: {
            decision,
            commentId: comment.commentId,
            action: comment.action,
          },
          organizationId: organization.id,
          repositoryId: pullRequest.repositoryId,
          pullRequestId: pullRequest.id,
        },
      })
    }

    const checkRun = canPostGitHubComment
      ? await publishAgentGateCheckRun({
          number: pullRequest.number,
          repositoryName: pullRequest.repository.name,
          owner: pullRequest.repository.owner,
          installationId:
            pullRequest.repository.organization.githubInstallationId ??
            undefined,
          headSha: pullRequest.headSha,
          checkRunId: pullRequest.githubAgentGateCheckRunId,
          riskScore: pullRequest.riskScore,
          riskLevel: pullRequest.riskLevel,
          testGapStatus: pullRequest.testGapStatus,
          ciStatus: pullRequest.ciStatus,
          approvalStatus,
        })
      : null

    if (checkRun?.mode === 'live') {
      if (checkRun.checkRunId !== pullRequest.githubAgentGateCheckRunId) {
        await prisma.pullRequest.update({
          where: { id: pullRequest.id },
          data: { githubAgentGateCheckRunId: checkRun.checkRunId },
        })
      }
      await prisma.auditEvent.create({
        data: {
          eventType: 'github_check_run_published',
          actor: 'AgentGate',
          summary: `${checkRun.action === 'updated' ? 'Updated' : 'Created'} AgentGate check run for #${pullRequest.number}`,
          metadata: {
            action: checkRun.action,
            checkRunId: checkRun.checkRunId,
            conclusion: checkRun.conclusion,
          },
          organizationId: organization.id,
          repositoryId: pullRequest.repositoryId,
          pullRequestId: pullRequest.id,
        },
      })
    }
  } catch (error) {
    reportError({
      area: 'approval',
      action: 'approval_github_output_failed',
      error,
      metadata: { pullRequestId: pullRequest.id, decision },
    })
  }

  revalidatePath(`/pull-requests/${prId}`)
  revalidatePath('/approvals')
  revalidatePath('/dashboard')

  return {
    decision,
    message: `Recorded ${decision.replaceAll('_', ' ')}. Current status: ${approvalStatus}.`,
    status: 'success',
  }
}

function parseDueAt(value: FormDataEntryValue | null, fallback: Date) {
  if (typeof value !== 'string' || !value) return fallback
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date
}

export async function assignReviewer(prId: string, formData: FormData) {
  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()
  if (!organization || !prisma) {
    redirect(`/pull-requests/${prId}?assignment=auth_required`)
  }
  if (!canRecordApproval(organization.role)) {
    redirect(`/pull-requests/${prId}?assignment=forbidden`)
  }

  const pullRequest = await prisma.pullRequest.findFirst({
    where: { id: prId, organizationId: organization.id },
    include: { repository: true },
  })
  if (!pullRequest) {
    redirect(`/pull-requests/${prId}?assignment=not_found`)
  }

  const assigneeId = String(formData.get('assigneeId') ?? '')
  const reviewDueAt = parseDueAt(
    formData.get('reviewDueAt'),
    defaultReviewDueAt(pullRequest.riskLevel),
  )
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
    redirect(`/pull-requests/${prId}?assignment=invalid_assignee`)
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

  revalidatePath(`/pull-requests/${prId}`)
  revalidatePath('/approvals')
  redirect(
    `/pull-requests/${prId}?assignment=${assignee ? 'assigned' : 'unassigned'}`,
  )
}

export async function addReviewNote(prId: string, formData: FormData) {
  const organization = await ensureCurrentUserOrganization()
  const prisma = getPrismaClient()
  if (!organization || !prisma) {
    redirect(`/pull-requests/${prId}?comment=auth_required`)
  }
  if (!canCommentOnPullRequest(organization.role)) {
    redirect(`/pull-requests/${prId}?comment=forbidden`)
  }

  const pullRequest = await prisma.pullRequest.findFirst({
    where: { id: prId, organizationId: organization.id },
  })
  if (!pullRequest) {
    redirect(`/pull-requests/${prId}?comment=not_found`)
  }

  const rawBody = formData.get('body')
  const body = typeof rawBody === 'string' ? rawBody.trim().slice(0, 2000) : ''
  if (!body) {
    redirect(`/pull-requests/${prId}?comment=empty`)
  }

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

  revalidatePath(`/pull-requests/${prId}`)
  redirect(`/pull-requests/${prId}?comment=added`)
}
