import { NextResponse } from "next/server";
import { verifyGitHubWebhook } from "@/lib/github";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const verification = verifyGitHubWebhook(rawBody, request.headers.get("x-hub-signature-256"));

  if (!verification.ok) {
    return NextResponse.json({ error: "Invalid GitHub webhook signature" }, { status: 401 });
  }

  const event = request.headers.get("x-github-event") ?? "unknown";

  return NextResponse.json({
    mode: verification.mode,
    received: true,
    event,
    message: "Webhook accepted. Persistence and PR sync are intentionally deferred for the MVP.",
  });
}
