import { getPrismaClient } from "@/lib/prisma";
import { syncGitHubInstallation, syncGitHubPullRequest } from "@/lib/github-sync";

type WebhookRepository = {
  id?: number;
  node_id?: string;
  name?: string;
  full_name?: string;
  html_url?: string;
  private?: boolean;
  default_branch?: string;
  owner?: { login?: string; id?: number };
};

type WebhookPullRequest = {
  number?: number;
  state?: "open" | "closed";
  merged?: boolean;
  merged_at?: string | null;
  id?: number;
  node_id?: string;
  html_url?: string;
  title?: string;
  user?: { login?: string | null } | null;
  head?: { ref?: string; sha?: string };
  base?: { ref?: string };
};

export type GitHubWebhookPayload = {
  action?: string;
  installation?: { id?: number };
  repository?: WebhookRepository;
  pull_request?: WebhookPullRequest;
};

export type WebhookProcessResult = {
  mode: "demo" | "live";
  received: true;
  event: string;
  action?: string;
  duplicate?: boolean;
  processed: boolean;
  message: string;
};

const pullRequestSyncActions = new Set(["opened", "synchronize", "reopened", "edited", "ready_for_review"]);

export function parseGitHubWebhookPayload(rawBody: string): GitHubWebhookPayload {
  const parsed = JSON.parse(rawBody) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("GitHub webhook payload must be an object.");
  }

  return parsed as GitHubWebhookPayload;
}

export function getWebhookInstallationId(payload: GitHubWebhookPayload) {
  return payload.installation?.id ? String(payload.installation.id) : null;
}

export function shouldSyncPullRequestAction(action?: string) {
  return Boolean(action && pullRequestSyncActions.has(action));
}

function pullRequestStatusFromPayload(pullRequest: WebhookPullRequest) {
  if (pullRequest.state === "open") return "open" as const;
  return pullRequest.merged || pullRequest.merged_at ? ("merged" as const) : ("closed" as const);
}

async function ensureWebhookRepository(input: {
  organizationId: string;
  repository: WebhookRepository;
}) {
  const prisma = getPrismaClient();
  if (!prisma || !input.repository.name || !input.repository.owner?.login) return null;

  const githubRepositoryId = input.repository.id ? String(input.repository.id) : undefined;
  const existing = await prisma.repository.findFirst({
    where: {
      organizationId: input.organizationId,
      OR: [
        ...(githubRepositoryId ? [{ githubRepositoryId }] : []),
        { owner: input.repository.owner.login, name: input.repository.name },
      ],
    },
    select: { id: true },
  });

  if (existing) {
    return prisma.repository.update({
      where: { id: existing.id },
      data: {
        name: input.repository.name,
        owner: input.repository.owner.login,
        githubRepositoryId,
        githubNodeId: input.repository.node_id,
        url: input.repository.html_url,
        defaultBranch: input.repository.default_branch ?? "main",
        visibility: input.repository.private ? "private" : "public",
        connectedStatus: "connected",
        providerMetadata: { fullName: input.repository.full_name },
      },
    });
  }

  return prisma.repository.create({
    data: {
      name: input.repository.name,
      owner: input.repository.owner.login,
      githubRepositoryId,
      githubNodeId: input.repository.node_id,
      url: input.repository.html_url,
      defaultBranch: input.repository.default_branch ?? "main",
      visibility: input.repository.private ? "private" : "public",
      connectedStatus: "connected",
      providerMetadata: { fullName: input.repository.full_name },
      organizationId: input.organizationId,
    },
  });
}

async function updateClosedPullRequestFromPayload(input: {
  organizationId: string;
  repositoryId: string;
  pullRequest: WebhookPullRequest;
}) {
  const prisma = getPrismaClient();
  if (!prisma || !input.pullRequest.number) return false;

  const existing = await prisma.pullRequest.findUnique({
    where: {
      repositoryId_number: {
        repositoryId: input.repositoryId,
        number: input.pullRequest.number,
      },
    },
    select: { id: true },
  });

  if (!existing) return false;

  await prisma.pullRequest.update({
    where: { id: existing.id },
    data: {
      title: input.pullRequest.title,
      author: input.pullRequest.user?.login ?? undefined,
      githubPullRequestId: input.pullRequest.id ? String(input.pullRequest.id) : undefined,
      githubNodeId: input.pullRequest.node_id,
      url: input.pullRequest.html_url,
      headSha: input.pullRequest.head?.sha,
      branch: input.pullRequest.head?.ref,
      baseBranch: input.pullRequest.base?.ref,
      status: pullRequestStatusFromPayload(input.pullRequest),
    },
  });

  await prisma.auditEvent.create({
    data: {
      eventType: "pr_synced",
      actor: "GitHub",
      summary: `GitHub pull request #${input.pullRequest.number} ${pullRequestStatusFromPayload(input.pullRequest)}`,
      metadata: { source: "github_webhook" },
      organizationId: input.organizationId,
      repositoryId: input.repositoryId,
      pullRequestId: existing.id,
    },
  });

  return true;
}

async function processPullRequestWebhook(input: {
  organizationId: string;
  installationId: string;
  action?: string;
  payload: GitHubWebhookPayload;
}) {
  if (!input.payload.repository || !input.payload.pull_request?.number) {
    return { processed: false, message: "Pull request payload is missing repository or PR number." };
  }

  const repository = await ensureWebhookRepository({
    organizationId: input.organizationId,
    repository: input.payload.repository,
  });
  if (!repository) return { processed: false, message: "Repository could not be resolved." };

  if (input.action === "closed") {
    const processed = await updateClosedPullRequestFromPayload({
      organizationId: input.organizationId,
      repositoryId: repository.id,
      pullRequest: input.payload.pull_request,
    });
    return {
      processed,
      message: processed ? "Pull request close state updated from webhook." : "Closed PR was not previously synced.",
    };
  }

  if (!shouldSyncPullRequestAction(input.action)) {
    return { processed: false, message: `Pull request action ${input.action ?? "unknown"} does not require sync.` };
  }

  const processed = await syncGitHubPullRequest({
    organizationId: input.organizationId,
    installationId: input.installationId,
    repositoryId: repository.id,
    owner: repository.owner,
    name: repository.name,
    pullNumber: input.payload.pull_request.number,
  });

  return {
    processed,
    message: processed ? "Pull request synced from GitHub webhook." : "Pull request could not be synced.",
  };
}

export async function processGitHubWebhookDelivery(input: {
  deliveryId: string | null;
  event: string;
  rawBody: string;
}): Promise<WebhookProcessResult> {
  const payload = parseGitHubWebhookPayload(input.rawBody);
  const action = payload.action;
  const prisma = getPrismaClient();

  if (!prisma || !input.deliveryId) {
    return {
      mode: "demo",
      received: true,
      event: input.event,
      action,
      processed: false,
      message: "Webhook received in demo mode; persistence is unavailable.",
    };
  }

  const existingDelivery = await prisma.gitHubWebhookDelivery.findUnique({
    where: { deliveryId: input.deliveryId },
  });
  if (existingDelivery?.status === "processed") {
    return {
      mode: "live",
      received: true,
      event: input.event,
      action,
      duplicate: true,
      processed: false,
      message: "Duplicate GitHub webhook delivery ignored.",
    };
  }

  const installationId = getWebhookInstallationId(payload);
  const organization = installationId
    ? await prisma.organization.findFirst({ where: { githubInstallationId: installationId } })
    : null;

  const delivery =
    existingDelivery ??
    (await prisma.gitHubWebhookDelivery.create({
      data: {
        deliveryId: input.deliveryId,
        event: input.event,
        action,
        status: "received",
        organizationId: organization?.id,
        metadata: {
          installationId,
          repositoryId: payload.repository?.id,
        },
      },
    }));

  if (!installationId || !organization) {
    await prisma.gitHubWebhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "ignored",
        message: "No organization is connected to this GitHub installation.",
        processedAt: new Date(),
      },
    });
    return {
      mode: "live",
      received: true,
      event: input.event,
      action,
      processed: false,
      message: "No organization is connected to this GitHub installation.",
    };
  }

  try {
    let result = { processed: false, message: `Event ${input.event} is not handled yet.` };

    if (input.event === "pull_request") {
      result = await processPullRequestWebhook({
        organizationId: organization.id,
        installationId,
        action,
        payload,
      });
    } else if (input.event === "installation_repositories" || input.event === "installation") {
      const syncResult = await syncGitHubInstallation(organization.id);
      result = { processed: syncResult.mode === "live", message: syncResult.message };
    }

    await prisma.gitHubWebhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: result.processed ? "processed" : "ignored",
        message: result.message,
        organizationId: organization.id,
        processedAt: new Date(),
      },
    });

    return {
      mode: "live",
      received: true,
      event: input.event,
      action,
      processed: result.processed,
      message: result.message,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "GitHub webhook processing failed.";
    await prisma.gitHubWebhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "failed",
        message,
        organizationId: organization.id,
        processedAt: new Date(),
      },
    });
    throw error;
  }
}
