import { createHmac, timingSafeEqual } from "node:crypto";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "octokit";
import { getGitHubWebhookSecret, isProduction } from "@/lib/env";
import type { PullRequest } from "@/lib/types";

function githubConfigured() {
  return Boolean(process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY);
}

export function isGitHubDemoMode() {
  return !githubConfigured();
}

export function getInstallationOctokit(installationId?: string) {
  if (!githubConfigured() || !installationId) return null;

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID!,
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      installationId,
    },
  });
}

export async function syncPullRequests(repository: { owner: string; name: string; installationId?: string }) {
  const octokit = getInstallationOctokit(repository.installationId);
  if (!octokit) {
    return {
      mode: "demo" as const,
      message: "GitHub credentials are missing; using seeded demo pull requests.",
      pullRequests: [],
    };
  }

  const response = await octokit.rest.pulls.list({
    owner: repository.owner,
    repo: repository.name,
    state: "all",
    per_page: 50,
  });

  return {
    mode: "live" as const,
    message: `Synced ${response.data.length} pull requests from GitHub.`,
    pullRequests: response.data,
  };
}

export async function postPullRequestComment(pr: Pick<PullRequest, "number" | "repositoryName"> & { owner?: string }, body: string) {
  const octokit = getInstallationOctokit();
  if (!octokit || !pr.owner) {
    return {
      mode: "demo" as const,
      message: `Mock GitHub comment for ${pr.repositoryName}#${pr.number}: ${body}`,
    };
  }

  await octokit.rest.issues.createComment({
    owner: pr.owner,
    repo: pr.repositoryName,
    issue_number: pr.number,
    body,
  });

  return { mode: "live" as const, message: "GitHub comment posted." };
}

export function verifyGitHubWebhook(
  rawBody: string,
  signatureHeader: string | null,
  env: Record<string, string | undefined> = process.env,
) {
  const secret = getGitHubWebhookSecret(env);
  if (!secret) {
    return isProduction(env)
      ? ({ ok: false, mode: "live" as const, reason: "missing_secret" as const })
      : ({ ok: true, mode: "demo" as const });
  }
  if (!signatureHeader?.startsWith("sha256=")) {
    return { ok: false, mode: "live" as const, reason: "missing_signature" as const };
  }

  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const actual = signatureHeader;
  const ok =
    expected.length === actual.length &&
    timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(actual, "utf8"));

  return ok
    ? ({ ok: true, mode: "live" as const })
    : ({ ok: false, mode: "live" as const, reason: "invalid_signature" as const });
}
