import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { plans } from "@/lib/plans";

export function getPaddleClient() {
  if (!process.env.PADDLE_API_KEY) return null;

  return new Paddle(process.env.PADDLE_API_KEY, {
    environment: process.env.PADDLE_ENVIRONMENT === "production" ? Environment.production : Environment.sandbox,
  });
}

export function getBillingMode() {
  return getPaddleClient() ? "live" : "mock";
}

export { plans };
