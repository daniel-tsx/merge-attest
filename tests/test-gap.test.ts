import { describe, expect, it } from "vitest";
import { detectTestGap } from "../lib/test-gap";

describe("test gap detector", () => {
  it("flags high-impact auth changes without tests", () => {
    const result = detectTestGap({
      title: "Refactor permission middleware",
      files: [{ path: "lib/auth/permissions.ts", additions: 24, deletions: 8, changeType: "modified" }],
    });

    expect(result.status).toBe("high");
    expect(result.confidence).toBe("high");
  });

  it("suggests regression tests for bug fixes", () => {
    const result = detectTestGap({
      title: "Fix invoice total rounding bug",
      files: [{ path: "lib/billing/invoice-total.ts", additions: 12, deletions: 4, changeType: "modified" }],
    });

    expect(result.suggestedTestCases.some((item) => item.includes("regression"))).toBe(true);
  });

  it("returns none when tests changed", () => {
    const result = detectTestGap({
      title: "Add usage chart",
      files: [
        { path: "components/usage-chart.tsx", additions: 20, deletions: 0, changeType: "added" },
        { path: "tests/components/usage-chart.test.tsx", additions: 10, deletions: 0, changeType: "added" },
      ],
    });

    expect(result.status).toBe("none");
  });
});
