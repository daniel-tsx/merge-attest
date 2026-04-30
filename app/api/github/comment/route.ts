import { NextResponse } from "next/server";
import { pullRequests } from "@/lib/demo-data";
import { postPullRequestComment } from "@/lib/github";

export async function GET() {
  const pr = pullRequests[0];
  const result = await postPullRequestComment(pr, `AgentGate risk score: ${pr.riskScore} (${pr.riskLevel})`);

  return NextResponse.json(result);
}
