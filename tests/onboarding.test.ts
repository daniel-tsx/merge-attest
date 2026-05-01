import { describe, expect, it } from "vitest";
import { getOnboardingStatus } from "../lib/onboarding";

describe("getOnboardingStatus", () => {
  it("blocks GitHub setup until app credentials are configured", () => {
    const status = getOnboardingStatus({
      dataMode: "live",
      githubConfigured: false,
      hasGitHubInstallation: false,
      repositoryCount: 0,
      pullRequestCount: 0,
    });

    expect(status.completed).toBe(false);
    expect(status.steps.map((step) => [step.id, step.status])).toEqual([
      ["workspace", "complete"],
      ["github", "blocked"],
      ["repositories", "blocked"],
      ["pull_requests", "blocked"],
    ]);
  });

  it("points new live organizations at repository sync after GitHub is installed", () => {
    const status = getOnboardingStatus({
      dataMode: "live",
      githubConfigured: true,
      hasGitHubInstallation: true,
      repositoryCount: 0,
      pullRequestCount: 0,
    });

    expect(status.steps.find((step) => step.id === "repositories")?.status).toBe("current");
    expect(status.steps.find((step) => step.id === "pull_requests")?.status).toBe("blocked");
  });

  it("treats demo data with repositories and pull requests as complete", () => {
    const status = getOnboardingStatus({
      dataMode: "demo",
      githubConfigured: false,
      hasGitHubInstallation: false,
      repositoryCount: 2,
      pullRequestCount: 3,
    });

    expect(status.completed).toBe(true);
  });
});
