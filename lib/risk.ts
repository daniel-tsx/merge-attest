import type { CiStatus, PullRequestFileInput, RiskLevel, RiskSignal } from "@/lib/types";

export type RiskInput = {
  aiAssisted: boolean | null;
  ciStatus: CiStatus;
  files: PullRequestFileInput[];
};

const TEST_FILE_PATTERN = /(^|\/)(tests?|__tests__|e2e|specs?)\/|(\.|-)(test|spec|e2e)\.[tj]sx?$/i;
const AUTH_PATTERN = /(auth|session|permission|policy|acl|rbac|middleware)/i;
const BILLING_PATTERN = /(billing|invoice|subscription|stripe|paddle|payment|checkout)/i;
const MIGRATION_PATTERN = /(prisma\/migrations|migrations\/|schema\.prisma)/i;
const INFRA_PATTERN = /(^|\/)(Dockerfile|docker-compose|\.github\/workflows|terraform|infra|k8s|helm|vercel\.json|next\.config|env)/i;
const DEP_PATTERN = /(^|\/)(package\.json|pnpm-lock\.yaml|yarn\.lock|package-lock\.json|requirements\.txt|go\.mod|Cargo\.toml)$/i;
const API_PATTERN = /(app\/api|pages\/api|routes?\/|openapi|schema|trpc|graphql)/i;
const SECURITY_PACKAGE_PATTERN = /(auth|jsonwebtoken|jose|bcrypt|oauth|passport|saml|openid|helmet|csrf|stripe|paddle)/i;

function pathsMatching(files: PullRequestFileInput[], pattern: RegExp) {
  return files.filter((file) => pattern.test(file.path)).map((file) => file.path);
}

function signal(key: string, label: string, score: number, filePaths: string[] = []): RiskSignal {
  return {
    key,
    label,
    score,
    level: mapRiskLevel(score),
    filePaths,
  };
}

export function hasTestFiles(files: PullRequestFileInput[]) {
  return files.some((file) => TEST_FILE_PATTERN.test(file.path));
}

export function mapRiskLevel(score: number): RiskLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

export function calculateRisk(input: RiskInput) {
  const signals: RiskSignal[] = [];
  const files = input.files;
  const totalChangedLines = files.reduce((sum, file) => sum + file.additions + file.deletions, 0);
  const authFiles = pathsMatching(files, AUTH_PATTERN);
  const billingFiles = pathsMatching(files, BILLING_PATTERN);
  const migrationFiles = pathsMatching(files, MIGRATION_PATTERN);
  const dependencyFiles = pathsMatching(files, DEP_PATTERN);
  const infraFiles = pathsMatching(files, INFRA_PATTERN);
  const apiFiles = pathsMatching(files, API_PATTERN);
  const securityPackageFiles = dependencyFiles.filter((path) => {
    const file = files.find((item) => item.path === path);
    return file ? SECURITY_PACKAGE_PATTERN.test(file.path) || file.additions + file.deletions > 20 : false;
  });

  if (input.aiAssisted) signals.push(signal("ai_assisted", "AI-assisted pull request", 10));
  if (!hasTestFiles(files)) signals.push(signal("no_tests", "No test files changed", 15));
  if (authFiles.length) signals.push(signal("auth_changed", "Auth or permission code changed", 25, authFiles));
  if (billingFiles.length) signals.push(signal("billing_changed", "Billing or payment code changed", 25, billingFiles));
  if (migrationFiles.length) signals.push(signal("db_migration", "Database schema or migration changed", 20, migrationFiles));
  if (dependencyFiles.length) signals.push(signal("dependency_changed", "Dependency files changed", 15, dependencyFiles));
  if (input.ciStatus === "failing") signals.push(signal("failing_ci", "CI is failing", 20));
  if (totalChangedLines >= 500 || files.length >= 12) signals.push(signal("large_diff", "Large diff size", 10));
  if (infraFiles.length) signals.push(signal("infra_changed", "Infrastructure or runtime config changed", 15, infraFiles));
  if (apiFiles.length) signals.push(signal("api_changed", "Public API or route changed", 15, apiFiles));
  if (securityPackageFiles.length) {
    signals.push(signal("security_package", "Security-related package changed", 15, securityPackageFiles));
  }

  const score = Math.min(
    100,
    signals.reduce((sum, item) => sum + item.score, 0),
  );

  return {
    score,
    level: mapRiskLevel(score),
    signals,
  };
}

export const riskPatterns = {
  auth: AUTH_PATTERN,
  billing: BILLING_PATTERN,
  migration: MIGRATION_PATTERN,
  dependency: DEP_PATTERN,
  infra: INFRA_PATTERN,
  api: API_PATTERN,
  test: TEST_FILE_PATTERN,
};
