import { NextResponse } from "next/server";
import {
  approvalStatusForDecision,
  approvalSummary,
  auditEventTypeForDecision,
  isApprovalDecision,
} from "@/lib/approvals";
import { ensureCurrentUserOrganization } from "@/lib/auth/session";
import { postPullRequestComment } from "@/lib/github";
import { isFeatureAvailable } from "@/lib/plans";
import { getPrismaClient } from "@/lib/prisma";
import type { PlanKey } from "@/lib/types";

function canRecordApproval(role: string) {
  return role === "owner" || role === "admin" || role === "member";
}

function commentBody(input: { decision: string; note?: string; reviewer: string; riskScore: number; riskLevel: string }) {
  const lines = [
    `AgentGate decision: ${input.decision.replaceAll("_", " ")}`,
    `Reviewer: ${input.reviewer}`,
    `Risk: ${input.riskScore} (${input.riskLevel})`,
  ];

  if (input.note) lines.push(`Note: ${input.note}`);
  return lines.join("\n");
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const organization = await ensureCurrentUserOrganization();
  const prisma = getPrismaClient();
  const { id } = await params;

  if (!organization || !prisma) {
    return NextResponse.json({ error: "Authentication and database access are required." }, { status: 401 });
  }

  if (!canRecordApproval(organization.role)) {
    return NextResponse.json({ error: "You do not have permission to record approval decisions." }, { status: 403 });
  }

  if (!isFeatureAvailable(organization.planKey, "approvals")) {
    return NextResponse.json({ error: "Approval workflows require the Team plan or higher." }, { status: 403 });
  }

  const body = (await request.json()) as { decision?: unknown; note?: unknown };
  if (!isApprovalDecision(body.decision)) {
    return NextResponse.json({ error: "Invalid approval decision." }, { status: 400 });
  }

  const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) : undefined;
  const pullRequest = await prisma.pullRequest.findFirst({
    where: { id, organizationId: organization.id },
    include: { repository: { include: { organization: true } } },
  });

  if (!pullRequest) {
    return NextResponse.json({ error: "Pull request not found." }, { status: 404 });
  }

  const approvalStatus = approvalStatusForDecision(body.decision);
  const approval = await prisma.approval.create({
    data: {
      decision: body.decision,
      note,
      reviewerId: organization.userId,
      pullRequestId: pullRequest.id,
    },
    include: { reviewer: true },
  });

  await prisma.pullRequest.update({
    where: { id: pullRequest.id },
    data: { approvalStatus },
  });

  await prisma.auditEvent.create({
    data: {
      eventType: auditEventTypeForDecision(body.decision),
      actor: organization.userName || organization.userEmail,
      summary: approvalSummary(body.decision, pullRequest.number),
      metadata: {
        decision: body.decision,
        note,
        approvalStatus,
      },
      organizationId: organization.id,
      repositoryId: pullRequest.repositoryId,
      pullRequestId: pullRequest.id,
    },
  });

  try {
    const canPostGitHubComment = isFeatureAvailable(pullRequest.repository.organization.planKey as PlanKey, "githubComments");
    const comment = canPostGitHubComment
      ? await postPullRequestComment(
          {
            number: pullRequest.number,
            repositoryName: pullRequest.repository.name,
            owner: pullRequest.repository.owner,
            installationId: pullRequest.repository.organization.githubInstallationId ?? undefined,
          },
          commentBody({
            decision: body.decision,
            note,
            reviewer: organization.userName || organization.userEmail,
            riskScore: pullRequest.riskScore,
            riskLevel: pullRequest.riskLevel,
          }),
        )
      : null;

    if (comment?.mode === "live") {
      await prisma.auditEvent.create({
        data: {
          eventType: "github_comment_posted",
          actor: "AgentGate",
          summary: `Posted GitHub approval comment for #${pullRequest.number}`,
          metadata: { decision: body.decision },
          organizationId: organization.id,
          repositoryId: pullRequest.repositoryId,
          pullRequestId: pullRequest.id,
        },
      });
    }
  } catch (error) {
    console.warn("Approval recorded but GitHub comment failed.", error);
  }

  return NextResponse.json({
    approval: {
      id: approval.id,
      decision: approval.decision,
      note: approval.note,
      reviewer: approval.reviewer?.name ?? approval.reviewer?.email ?? "Unknown reviewer",
      createdAt: approval.createdAt.toISOString(),
    },
    approvalStatus,
  });
}
