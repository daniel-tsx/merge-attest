import type { PlanKey } from "@/lib/types";

export type PlanEntitlements = {
  repositoryLimit: number | null;
  prCheckLimit: number | null;
  auditRetentionDays: number | null;
  features: {
    approvals: boolean;
    customRules: boolean;
    githubComments: boolean;
    auditExport: boolean;
  };
};

export const planEntitlements: Record<PlanKey, PlanEntitlements> = {
  free: {
    repositoryLimit: 1,
    prCheckLimit: 50,
    auditRetentionDays: 7,
    features: {
      approvals: false,
      customRules: false,
      githubComments: false,
      auditExport: false,
    },
  },
  starter: {
    repositoryLimit: 3,
    prCheckLimit: 300,
    auditRetentionDays: 30,
    features: {
      approvals: false,
      customRules: false,
      githubComments: true,
      auditExport: false,
    },
  },
  team: {
    repositoryLimit: 10,
    prCheckLimit: 2_000,
    auditRetentionDays: 180,
    features: {
      approvals: true,
      customRules: true,
      githubComments: true,
      auditExport: false,
    },
  },
  growth: {
    repositoryLimit: 50,
    prCheckLimit: 10_000,
    auditRetentionDays: 365,
    features: {
      approvals: true,
      customRules: true,
      githubComments: true,
      auditExport: true,
    },
  },
  enterprise: {
    repositoryLimit: null,
    prCheckLimit: null,
    auditRetentionDays: null,
    features: {
      approvals: true,
      customRules: true,
      githubComments: true,
      auditExport: true,
    },
  },
};

export function getPlanEntitlements(planKey: PlanKey): PlanEntitlements {
  return planEntitlements[planKey];
}

export function remainingLimit(limit: number | null, used: number) {
  return limit === null ? null : Math.max(0, limit - used);
}

export function canConsume(limit: number | null, used: number, requested = 1) {
  return limit === null || used + requested <= limit;
}

export function limitLabel(limit: number | null, unit: string) {
  return limit === null ? `Unlimited ${unit}` : `${limit.toLocaleString()} ${unit}`;
}
