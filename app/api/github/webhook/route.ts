import { NextResponse } from "next/server";
import { verifyGitHubWebhook } from "@/lib/github";

function verificationError(reason?: "missing_secret" | "missing_signature" | "invalid_signature") {
  if (reason === "missing_secret") {
    return "GitHub webhook secret is required in production.";
  }

  return "Invalid GitHub webhook signature";
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const verification = verifyGitHubWebhook(rawBody, request.headers.get("x-hub-signature-256"));

  if (!verification.ok) {
    return NextResponse.json({ error: verificationError(verification.reason) }, { status: 401 });
  }

  const event = request.headers.get("x-github-event") ?? "unknown";

  return NextResponse.json({
    mode: verification.mode,
    received: true,
    event,
    message: "Webhook accepted. Persistence and PR sync are intentionally deferred for the MVP.",
  });
}
