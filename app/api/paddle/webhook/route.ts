import { NextResponse } from "next/server";
import { processPaddleSubscriptionEvent, unmarshalPaddleWebhook } from "@/lib/paddle-webhooks";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("paddle-signature");

  try {
    const event = await unmarshalPaddleWebhook(rawBody, signature);
    const result = await processPaddleSubscriptionEvent(event);

    return NextResponse.json({
      received: true,
      event: event.eventType,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Paddle webhook.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
