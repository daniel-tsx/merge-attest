import { describe, expect, it } from "vitest";
import { evaluateRepoRules } from "../lib/rules";
import type { RepoRule } from "../lib/types";

const rules: RepoRule[] = [
  {
    id: "rule-ai",
    repositoryId: "repo",
    name: "AI approval",
    description: "AI-assisted PRs require human approval",
    enabled: true,
    triggerType: "ai_assisted",
    actionType: "require_approval",
    severity: "medium",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rule-ci",
    repositoryId: "repo",
    name: "Failing CI",
    description: "Failing CI blocks approval",
    enabled: true,
    triggerType: "failing_ci",
    actionType: "block_merge",
    severity: "high",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe("repo rule evaluation", () => {
  it("creates violations for matching enabled rules", () => {
    const violations = evaluateRepoRules(rules, {
      aiAssisted: true,
      riskLevel: "medium",
      ciStatus: "failing",
      testGapStatus: "warning",
      riskSignals: [],
    });

    expect(violations).toHaveLength(2);
    expect(violations.map((violation) => violation.actionType)).toContain("block_merge");
  });

  it("ignores rules that do not match", () => {
    const violations = evaluateRepoRules(rules, {
      aiAssisted: false,
      riskLevel: "low",
      ciStatus: "passing",
      testGapStatus: "none",
      riskSignals: [],
    });

    expect(violations).toHaveLength(0);
  });
});
