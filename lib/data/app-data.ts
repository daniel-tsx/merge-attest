import { organization as demoOrganization } from "@/lib/demo-data";
import {
  auditEvents as demoAuditEvents,
  getPullRequest as getDemoPullRequest,
  getRepository as getDemoRepository,
  getRepositoryPullRequests as getDemoRepositoryPullRequests,
  getRepositoryRules as getDemoRepositoryRules,
  pullRequests as demoPullRequests,
  repositories as demoRepositories,
} from "@/lib/demo-data";
import { isProduction } from "@/lib/env";
import { ensureCurrentUserOrganization } from "@/lib/auth/session";
import { getPrismaClient } from "@/lib/prisma";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { AuditEvent, PlanKey, PullRequest, PullRequestFileInput, Repository, RepoRule, RiskSignal } from "@/lib/types";

export type OrganizationContext = {
  id: string;
  name: string;
  slug: string;
  planKey: PlanKey;
  dataMode: "live" | "demo";
};

type RepositoryRow = {
  id: string;
  name: string;
  provider: string;
  owner: string;
  defaultBranch: string;
  visibility: string;
  connectedStatus: string;
  lastSyncedAt: Date | null;
  activeRulesCount: number;
  monthlyPrCheckUsage: number;
  riskProfile: string;
  createdAt: Date;
  updatedAt: Date;
};

type RuleRow = {
  id: string;
  repositoryId: string;
  name: string;
  description: string;
  enabled: boolean;
  triggerType: string;
  actionType: string;
  severity: string;
  createdAt: Date;
  updatedAt: Date;
};

type PullRequestRow = {
  id: string;
  repositoryId: string;
  repository: { name: string };
  number: number;
  title: string;
  author: string;
  branch: string;
  baseBranch: string;
  status: string;
  aiAssisted: boolean | null;
  agentSource: string;
  riskScore: number;
  riskLevel: string;
  testGapStatus: string;
  ciStatus: string;
  approvalStatus: string;
  filesChangedCount: number;
  linesAdded: number;
  linesDeleted: number;
  createdAt: Date;
  updatedAt: Date;
  files: Array<{ path: string; additions: number; deletions: number; changeType: string }>;
  riskSignals: Array<{ key: string; label: string; score: number; level: string; filePaths: unknown }>;
  testGapAnalysis: {
    status: string;
    summary: string;
    affectedFiles: unknown;
    confidence: string;
    suggestions: Array<{ testFile: string; testCase: string }>;
  } | null;
  ruleViolations: Array<{
    id: string;
    summary: string;
    resolved: boolean;
    createdAt: Date;
    rule: { name: string; severity: string; actionType: string };
  }>;
  approvals: Array<{
    id: string;
    decision: string;
    note: string | null;
    createdAt: Date;
    reviewer: { name: string; email: string } | null;
  }>;
};

type AuditEventRow = {
  id: string;
  eventType: string;
  actor: string | null;
  summary: string;
  metadata: unknown;
  createdAt: Date;
  repository: { name: string } | null;
  pullRequest: { number: number } | null;
};

function toIso(date: Date | string | null | undefined) {
  if (!date) return new Date(0).toISOString();
  return typeof date === "string" ? date : date.toISOString();
}

function stringArrayFromJson(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function recordFromJson(value: unknown): Record<string, string | number | boolean | undefined> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string | number | boolean | undefined] => {
      const item = entry[1];
      return item === undefined || typeof item === "string" || typeof item === "number" || typeof item === "boolean";
    }),
  );
}

function productionFallbackError(error: unknown): never {
  throw error instanceof Error ? error : new Error("Database query failed.");
}

async function queryWithDemoFallback<T>(query: (client: PrismaClient) => Promise<T>, fallback: () => T, label: string) {
  const client = getPrismaClient();
  if (!client) return fallback();

  try {
    return await query(client);
  } catch (error) {
    if (isProduction()) productionFallbackError(error);
    console.warn(`Falling back to demo data for ${label}.`, error);
    return fallback();
  }
}

function mapOrganization(row: { id: string; name: string; slug: string; planKey: string } | null): OrganizationContext {
  if (!row) {
    return {
      id: demoOrganization.id,
      name: demoOrganization.name,
      slug: demoOrganization.slug,
      planKey: demoOrganization.planKey,
      dataMode: "demo",
    };
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    planKey: row.planKey as PlanKey,
    dataMode: "live",
  };
}

export async function getCurrentOrganization(): Promise<OrganizationContext> {
  const sessionOrganization = await ensureCurrentUserOrganization();
  if (sessionOrganization) {
    return {
      id: sessionOrganization.id,
      name: sessionOrganization.name,
      slug: sessionOrganization.slug,
      planKey: sessionOrganization.planKey,
      dataMode: "live",
    };
  }

  return queryWithDemoFallback(
    async (client) => {
      const organization = await client.organization.findFirst({ orderBy: { createdAt: "asc" } });
      return mapOrganization(organization);
    },
    () => mapOrganization(null),
    "current organization",
  );
}

export function mapRepository(row: RepositoryRow): Repository {
  return {
    id: row.id,
    name: row.name,
    provider: "GitHub",
    owner: row.owner,
    defaultBranch: row.defaultBranch,
    visibility: row.visibility as Repository["visibility"],
    connectedStatus: row.connectedStatus as Repository["connectedStatus"],
    lastSyncedAt: toIso(row.lastSyncedAt ?? row.updatedAt),
    activeRulesCount: row.activeRulesCount,
    monthlyPrCheckUsage: row.monthlyPrCheckUsage,
    riskProfile: row.riskProfile as Repository["riskProfile"],
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function mapRepoRule(row: RuleRow): RepoRule {
  return {
    id: row.id,
    repositoryId: row.repositoryId,
    name: row.name,
    description: row.description,
    enabled: row.enabled,
    triggerType: row.triggerType as RepoRule["triggerType"],
    actionType: row.actionType as RepoRule["actionType"],
    severity: row.severity as RepoRule["severity"],
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function mapPullRequest(row: PullRequestRow): PullRequest {
  return {
    id: row.id,
    repositoryId: row.repositoryId,
    repositoryName: row.repository.name,
    number: row.number,
    title: row.title,
    author: row.author,
    branch: row.branch,
    baseBranch: row.baseBranch,
    status: row.status as PullRequest["status"],
    aiAssisted: row.aiAssisted,
    agentSource: row.agentSource as PullRequest["agentSource"],
    riskScore: row.riskScore,
    riskLevel: row.riskLevel as PullRequest["riskLevel"],
    testGapStatus: row.testGapStatus as PullRequest["testGapStatus"],
    ciStatus: row.ciStatus as PullRequest["ciStatus"],
    approvalStatus: row.approvalStatus as PullRequest["approvalStatus"],
    filesChangedCount: row.filesChangedCount,
    linesAdded: row.linesAdded,
    linesDeleted: row.linesDeleted,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    files: row.files.map((file): PullRequestFileInput => ({
      path: file.path,
      additions: file.additions,
      deletions: file.deletions,
      changeType: file.changeType as PullRequestFileInput["changeType"],
    })),
    riskSignals: row.riskSignals.map((signal): RiskSignal => ({
      key: signal.key,
      label: signal.label,
      score: signal.score,
      level: signal.level as RiskSignal["level"],
      filePaths: stringArrayFromJson(signal.filePaths),
    })),
    testGapAnalysis: {
      status: (row.testGapAnalysis?.status ?? "none") as PullRequest["testGapAnalysis"]["status"],
      summary: row.testGapAnalysis?.summary ?? "No test gap analysis has been recorded.",
      affectedFiles: stringArrayFromJson(row.testGapAnalysis?.affectedFiles),
      suggestedTestFiles: row.testGapAnalysis?.suggestions.map((item) => item.testFile) ?? [],
      suggestedTestCases: row.testGapAnalysis?.suggestions.map((item) => item.testCase) ?? [],
      confidence: (row.testGapAnalysis?.confidence ?? "low") as PullRequest["testGapAnalysis"]["confidence"],
    },
    ruleViolations: row.ruleViolations.map((violation) => ({
      id: violation.id,
      ruleName: violation.rule.name,
      summary: violation.summary,
      severity: violation.rule.severity as PullRequest["ruleViolations"][number]["severity"],
      actionType: violation.rule.actionType as PullRequest["ruleViolations"][number]["actionType"],
      resolved: violation.resolved,
      createdAt: toIso(violation.createdAt),
    })),
    approvals: row.approvals.map((approval) => ({
      id: approval.id,
      reviewer: approval.reviewer?.name ?? approval.reviewer?.email ?? "Unknown reviewer",
      decision: approval.decision as PullRequest["approvals"][number]["decision"],
      note: approval.note ?? "",
      createdAt: toIso(approval.createdAt),
    })),
  };
}

export function mapAuditEvent(row: AuditEventRow): AuditEvent {
  return {
    id: row.id,
    eventType: row.eventType as AuditEvent["eventType"],
    actor: row.actor ?? undefined,
    repositoryName: row.repository?.name,
    pullRequestNumber: row.pullRequest?.number,
    summary: row.summary,
    metadata: recordFromJson(row.metadata),
    createdAt: toIso(row.createdAt),
  };
}

const pullRequestInclude = {
  repository: true,
  files: true,
  riskSignals: true,
  testGapAnalysis: { include: { suggestions: true } },
  ruleViolations: { include: { rule: true } },
  approvals: { include: { reviewer: true } },
};

export async function listRepositories(organizationId: string) {
  return queryWithDemoFallback(
    async (client) => {
      const rows = await client.repository.findMany({
        where: { organizationId },
        orderBy: [{ riskProfile: "desc" }, { name: "asc" }],
      });
      return rows.map(mapRepository);
    },
    () => demoRepositories,
    "repositories",
  );
}

export async function getRepository(organizationId: string, id: string) {
  return queryWithDemoFallback(
    async (client) => {
      const row = await client.repository.findFirst({ where: { id, organizationId } });
      return row ? mapRepository(row) : null;
    },
    () => getDemoRepository(id) ?? null,
    "repository detail",
  );
}

export async function getRepositoryRules(organizationId: string, repositoryId: string) {
  return queryWithDemoFallback(
    async (client) => {
      const rows = await client.repoRule.findMany({
        where: { organizationId, repositoryId },
        orderBy: { updatedAt: "desc" },
      });
      return rows.map(mapRepoRule);
    },
    () => getDemoRepositoryRules(repositoryId),
    "repository rules",
  );
}

export async function listPullRequests(organizationId: string) {
  return queryWithDemoFallback(
    async (client) => {
      const rows = await client.pullRequest.findMany({
        where: { organizationId },
        include: pullRequestInclude,
        orderBy: { updatedAt: "desc" },
      });
      return rows.map(mapPullRequest);
    },
    () => demoPullRequests,
    "pull requests",
  );
}

export async function getRepositoryPullRequests(organizationId: string, repositoryId: string) {
  return queryWithDemoFallback(
    async (client) => {
      const rows = await client.pullRequest.findMany({
        where: { organizationId, repositoryId },
        include: pullRequestInclude,
        orderBy: { updatedAt: "desc" },
      });
      return rows.map(mapPullRequest);
    },
    () => getDemoRepositoryPullRequests(repositoryId),
    "repository pull requests",
  );
}

export async function getPullRequest(organizationId: string, id: string) {
  return queryWithDemoFallback(
    async (client) => {
      const row = await client.pullRequest.findFirst({
        where: { id, organizationId },
        include: pullRequestInclude,
      });
      return row ? mapPullRequest(row) : null;
    },
    () => getDemoPullRequest(id) ?? null,
    "pull request detail",
  );
}

export async function listAuditEvents(
  organizationId: string,
  filters: { repositoryId?: string; pullRequestId?: string; take?: number } = {},
) {
  return queryWithDemoFallback(
    async (client) => {
      const rows = await client.auditEvent.findMany({
        where: {
          organizationId,
          repositoryId: filters.repositoryId,
          pullRequestId: filters.pullRequestId,
        },
        include: { repository: true, pullRequest: true },
        orderBy: { createdAt: "desc" },
        take: filters.take,
      });
      return rows.map(mapAuditEvent);
    },
    () =>
      demoAuditEvents
        .filter((event) => {
          if (filters.repositoryId) {
            const repository = getDemoRepository(filters.repositoryId);
            if (repository && event.repositoryName !== repository.name) return false;
          }
          if (filters.pullRequestId) {
            const pullRequest = getDemoPullRequest(filters.pullRequestId);
            if (
              pullRequest &&
              (event.pullRequestNumber !== pullRequest.number || event.repositoryName !== pullRequest.repositoryName)
            ) {
              return false;
            }
          }
          return true;
        })
        .slice(0, filters.take),
    "audit events",
  );
}
