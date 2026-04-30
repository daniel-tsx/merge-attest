import { describe, expect, it } from "vitest";
import { calculateRisk, mapRiskLevel } from "../lib/risk";

describe("risk scoring", () => {
  it("maps scores to risk levels", () => {
    expect(mapRiskLevel(0)).toBe("low");
    expect(mapRiskLevel(25)).toBe("medium");
    expect(mapRiskLevel(50)).toBe("high");
    expect(mapRiskLevel(75)).toBe("critical");
  });

  it("scores AI-assisted sensitive changes without tests", () => {
    const result = calculateRisk({
      aiAssisted: true,
      ciStatus: "failing",
      files: [
        { path: "lib/auth/permissions.ts", additions: 40, deletions: 8, changeType: "modified" },
        { path: "prisma/migrations/20260430_roles/migration.sql", additions: 30, deletions: 0, changeType: "added" },
      ],
    });

    expect(result.score).toBe(90);
    expect(result.level).toBe("critical");
    expect(result.signals.map((signal) => signal.key)).toContain("auth_changed");
    expect(result.signals.map((signal) => signal.key)).toContain("db_migration");
  });
});
