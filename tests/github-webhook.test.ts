import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyGitHubWebhook } from "../lib/github";

function signatureFor(body: string, secret: string) {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

describe("GitHub webhook verification", () => {
  it("allows unsigned demo webhooks outside production", () => {
    const result = verifyGitHubWebhook("{}", null, { NODE_ENV: "development" });

    expect(result).toEqual({ ok: true, mode: "demo" });
  });

  it("fails closed when the webhook secret is missing in production", () => {
    const result = verifyGitHubWebhook("{}", null, { NODE_ENV: "production" });

    expect(result).toEqual({ ok: false, mode: "live", reason: "missing_secret" });
  });

  it("accepts a valid live signature", () => {
    const body = JSON.stringify({ action: "opened" });
    const secret = "webhook-secret";
    const result = verifyGitHubWebhook(body, signatureFor(body, secret), {
      NODE_ENV: "production",
      GITHUB_WEBHOOK_SECRET: secret,
    });

    expect(result).toEqual({ ok: true, mode: "live" });
  });

  it("rejects an invalid live signature", () => {
    const result = verifyGitHubWebhook("{}", "sha256=invalid", {
      NODE_ENV: "production",
      GITHUB_WEBHOOK_SECRET: "webhook-secret",
    });

    expect(result).toEqual({ ok: false, mode: "live", reason: "invalid_signature" });
  });
});
