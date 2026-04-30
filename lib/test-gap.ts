import type { PullRequestFileInput, TestGapResult } from "@/lib/types";
import { hasTestFiles, riskPatterns } from "@/lib/risk";

export type TestGapInput = {
  title: string;
  files: PullRequestFileInput[];
};

const SOURCE_PATTERN = /\.(ts|tsx|js|jsx|mjs|cjs|go|rb|py|java|cs)$/i;
const UI_PATTERN = /(components\/|app\/.*page\.tsx|app\/.*layout\.tsx|ui\/)/i;
const BUSINESS_PATTERN = /(services\/|lib\/|domain\/|modules\/|use-cases\/)/i;

function sourceFiles(files: PullRequestFileInput[]) {
  return files.filter((file) => SOURCE_PATTERN.test(file.path) && !riskPatterns.test.test(file.path));
}

function suggestedFileFor(path: string) {
  const normalized = path.replace(/\.(tsx|ts|jsx|js)$/i, ".test.ts");
  if (path.includes("app/api") || path.includes("routes")) return "tests/integration/api-routes.test.ts";
  if (UI_PATTERN.test(path)) return normalized.replace(/^app\//, "tests/components/");
  return normalized.replace(/^lib\//, "tests/lib/");
}

export function detectTestGap(input: TestGapInput): TestGapResult {
  const changedSourceFiles = sourceFiles(input.files);
  const testFilesChanged = hasTestFiles(input.files);

  if (!changedSourceFiles.length || testFilesChanged) {
    return {
      status: "none",
      summary: testFilesChanged ? "Related tests changed with the implementation." : "No source files require test coverage.",
      affectedFiles: [],
      suggestedTestFiles: [],
      suggestedTestCases: [],
      confidence: "high",
    };
  }

  const highImpactFiles = changedSourceFiles.filter(
    (file) =>
      riskPatterns.auth.test(file.path) ||
      riskPatterns.billing.test(file.path) ||
      riskPatterns.migration.test(file.path) ||
      riskPatterns.api.test(file.path) ||
      BUSINESS_PATTERN.test(file.path),
  );
  const bugFixTitle = /\b(fix|bug|regression|hotfix)\b/i.test(input.title);
  const uiFiles = changedSourceFiles.filter((file) => UI_PATTERN.test(file.path));
  const status = highImpactFiles.length ? "high" : "warning";
  const affectedFiles = (highImpactFiles.length ? highImpactFiles : changedSourceFiles).map((file) => file.path);
  const suggestedTestFiles = Array.from(new Set(affectedFiles.slice(0, 5).map(suggestedFileFor)));
  const suggestedTestCases = [
    highImpactFiles.length
      ? "Cover the changed auth, billing, API, database, or business path with a focused regression test."
      : "Add a unit test that exercises the changed source behavior.",
  ];

  if (bugFixTitle) suggestedTestCases.push("Add a regression test that fails before this fix.");
  if (affectedFiles.some((path) => riskPatterns.api.test(path))) {
    suggestedTestCases.push("Add an integration or contract test for the changed route or schema.");
  }
  if (uiFiles.length) suggestedTestCases.push("Add a component or e2e test for the changed UI state.");

  return {
    status,
    summary:
      status === "high"
        ? "High-impact source files changed without accompanying tests."
        : "Source files changed without accompanying tests.",
    affectedFiles,
    suggestedTestFiles,
    suggestedTestCases,
    confidence: highImpactFiles.length || bugFixTitle ? "high" : "medium",
  };
}
