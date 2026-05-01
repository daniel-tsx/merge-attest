import type {
  ActivityEvent,
  AgentSource,
  AuditEvent,
  Approval,
  ApprovalStatus,
  CiStatus,
  PullRequest,
  PullRequestFileInput,
  PullRequestStatus,
  Repository,
  RepoRule,
} from '@/lib/types'
import { calculateRisk } from '@/lib/risk'
import { evaluateRepoRules } from '@/lib/rules'
import { detectTestGap } from '@/lib/test-gap'

const now = '2026-04-30T08:00:00.000Z'

export const organization = {
  id: 'org-agentgate',
  name: 'Northstar Labs',
  slug: 'northstar-labs',
  planKey: 'team' as const,
}

export const users = [
  {
    id: 'user-1',
    name: 'Maya Chen',
    email: 'maya@northstar.dev',
    role: 'owner',
  },
  {
    id: 'user-2',
    name: 'Owen Reed',
    email: 'owen@northstar.dev',
    role: 'admin',
  },
  {
    id: 'user-3',
    name: 'Leah Patel',
    email: 'leah@northstar.dev',
    role: 'member',
  },
]

export const repositories: Repository[] = [
  repo('repo-billing', 'billing-api', 'northstar', 'private', 'high', 6, 142),
  repo(
    'repo-dashboard',
    'customer-dashboard',
    'northstar',
    'private',
    'medium',
    5,
    96,
  ),
  repo('repo-auth', 'auth-service', 'northstar', 'private', 'high', 7, 81),
  repo('repo-marketing', 'marketing-site', 'northstar', 'public', 'low', 2, 18),
]

function repo(
  id: string,
  name: string,
  owner: string,
  visibility: Repository['visibility'],
  riskProfile: Repository['riskProfile'],
  activeRulesCount: number,
  usage: number,
): Repository {
  return {
    id,
    name,
    provider: 'GitHub',
    owner,
    defaultBranch: 'main',
    visibility,
    connectedStatus: 'demo',
    lastSyncedAt: '2026-04-30T06:30:00.000Z',
    activeRulesCount,
    monthlyPrCheckUsage: usage,
    riskProfile,
    createdAt: '2026-01-12T10:00:00.000Z',
    updatedAt: now,
  }
}

export const repoRules: RepoRule[] = repositories.flatMap((repository) => [
  rule(
    repository.id,
    'ai-approval',
    'AI-assisted PRs require human approval',
    'ai_assisted',
    'require_approval',
    'medium',
  ),
  rule(
    repository.id,
    'failing-ci',
    'Failing CI blocks approval',
    'failing_ci',
    'block_merge',
    'high',
  ),
  rule(
    repository.id,
    'high-test-gap',
    'High test gaps require tests or risk acceptance',
    'high_test_gap',
    'request_tests',
    'high',
  ),
  ...(repository.riskProfile !== 'low'
    ? [
        rule(
          repository.id,
          'sensitive-change-review',
          'Auth, billing, dependency, and database changes require senior review',
          'high_risk',
          'require_approval',
          'critical',
        ),
      ]
    : []),
])

function rule(
  repositoryId: string,
  slug: string,
  description: string,
  triggerType: RepoRule['triggerType'],
  actionType: RepoRule['actionType'],
  severity: RepoRule['severity'],
): RepoRule {
  return {
    id: `${repositoryId}-${slug}`,
    repositoryId,
    name: description.split(' require ')[0],
    description,
    enabled: true,
    triggerType,
    actionType,
    severity,
    createdAt: '2026-02-01T09:00:00.000Z',
    updatedAt: now,
  }
}

const prInputs: Array<{
  repositoryId: string
  number: number
  title: string
  author: string
  branch: string
  status: PullRequestStatus
  aiAssisted: boolean | null
  agentSource: AgentSource
  ciStatus: CiStatus
  approvalStatus?: ApprovalStatus
  files: PullRequestFileInput[]
}> = [
  pr(
    'repo-billing',
    184,
    'Add Stripe subscription upgrade flow',
    'codex-bot',
    'agent/stripe-upgrades',
    'open',
    true,
    'codex',
    'failing',
    [
      file('app/api/billing/upgrade/route.ts', 118, 8),
      file('lib/billing/stripe.ts', 96, 12),
      file(
        'prisma/migrations/202604290910_add_subscriptions/migration.sql',
        24,
        0,
      ),
    ],
  ),
  pr(
    'repo-auth',
    92,
    'Refactor permission middleware',
    'cursor-agent',
    'agent/permissions-rbac',
    'open',
    true,
    'cursor',
    'pending',
    [file('middleware.ts', 83, 41), file('lib/auth/permissions.ts', 124, 68)],
  ),
  pr(
    'repo-billing',
    188,
    'Fix invoice total rounding bug',
    'maya',
    'fix/invoice-rounding',
    'open',
    true,
    'claude_code',
    'passing',
    [file('lib/billing/invoice-total.ts', 31, 17)],
  ),
  pr(
    'repo-dashboard',
    241,
    'Add usage chart to dashboard',
    'copilot',
    'agent/usage-chart',
    'merged',
    true,
    'copilot',
    'passing',
    [
      file('app/dashboard/usage-chart.tsx', 92, 7),
      file('tests/components/usage-chart.test.tsx', 52, 0),
    ],
  ),
  pr(
    'repo-dashboard',
    244,
    'Update OpenAI SDK integration',
    'owen',
    'chore/openai-sdk',
    'open',
    false,
    'manual',
    'passing',
    [
      file('package.json', 4, 4),
      file('pnpm-lock.yaml', 90, 84),
      file('lib/agents/openai-client.ts', 28, 16),
    ],
  ),
  pr(
    'repo-auth',
    98,
    'Add database migration for team roles',
    'devin',
    'agent/team-roles',
    'open',
    true,
    'devin',
    'passing',
    [
      file('prisma/schema.prisma', 33, 8),
      file('prisma/migrations/202604300735_team_roles/migration.sql', 44, 0),
      file('lib/auth/roles.ts', 77, 14),
    ],
  ),
  pr(
    'repo-marketing',
    71,
    'Refresh pricing page copy',
    'leah',
    'copy/pricing-refresh',
    'merged',
    false,
    'manual',
    'passing',
    [file('app/pricing/page.tsx', 25, 19)],
  ),
  pr(
    'repo-dashboard',
    246,
    'Fix regression in saved filters',
    'cursor-agent',
    'agent/filter-regression',
    'open',
    true,
    'cursor',
    'passing',
    [file('lib/filters/saved-filters.ts', 40, 16)],
  ),
  pr(
    'repo-billing',
    191,
    'Add Paddle webhook signature check',
    'codex-bot',
    'agent/paddle-webhook',
    'open',
    true,
    'codex',
    'pending',
    [
      file('app/api/paddle/webhook/route.ts', 91, 5),
      file('lib/billing/paddle.ts', 42, 7),
      file('tests/integration/paddle-webhook.test.ts', 81, 0),
    ],
  ),
  pr(
    'repo-auth',
    101,
    'Rotate JWT signing configuration',
    'owen',
    'security/jwt-rotation',
    'closed',
    false,
    'manual',
    'failing',
    [
      file('lib/auth/jwt.ts', 67, 22),
      file('.github/workflows/security.yml', 19, 3),
    ],
  ),
  pr(
    'repo-dashboard',
    248,
    'Add repository risk filters',
    'claude-code',
    'agent/risk-filters',
    'open',
    true,
    'claude_code',
    'passing',
    [
      file('app/repositories/page.tsx', 62, 11),
      file('components/repository-filters.tsx', 73, 0),
    ],
  ),
  pr(
    'repo-marketing',
    73,
    'Add launch announcement page',
    'copilot',
    'agent/launch-page',
    'merged',
    true,
    'copilot',
    'passing',
    [file('app/launch/page.tsx', 119, 4)],
  ),
  pr(
    'repo-billing',
    194,
    'Update tax calculation dependency',
    'maya',
    'chore/tax-lib',
    'open',
    false,
    'manual',
    'passing',
    [file('package.json', 2, 2), file('pnpm-lock.yaml', 41, 38)],
  ),
  pr(
    'repo-auth',
    105,
    'Hotfix OAuth callback state handling',
    'codex-bot',
    'hotfix/oauth-state',
    'open',
    true,
    'codex',
    'failing',
    [
      file('app/api/auth/callback/route.ts', 36, 9),
      file('lib/auth/oauth-state.ts', 52, 14),
    ],
  ),
  pr(
    'repo-dashboard',
    251,
    'Add customer search empty state',
    'leah',
    'ui/search-empty-state',
    'merged',
    false,
    'manual',
    'passing',
    [
      file('components/customers/search-empty-state.tsx', 43, 2),
      file('tests/components/search-empty-state.test.tsx', 29, 0),
    ],
  ),
  pr(
    'repo-billing',
    196,
    'Add usage metering endpoint',
    'devin',
    'agent/usage-metering',
    'open',
    true,
    'devin',
    'passing',
    [
      file('app/api/usage/meter/route.ts', 78, 6),
      file('lib/billing/usage-meter.ts', 96, 18),
    ],
  ),
  pr(
    'repo-auth',
    108,
    'Remove unused invite token path',
    'owen',
    'cleanup/invite-token',
    'merged',
    false,
    'manual',
    'passing',
    [
      file('lib/auth/invite-token.ts', 0, 58),
      file('tests/lib/invite-token.test.ts', 0, 34),
    ],
  ),
  pr(
    'repo-dashboard',
    254,
    'Add audit export table',
    'cursor-agent',
    'agent/audit-export',
    'open',
    true,
    'cursor',
    'pending',
    [
      file('app/audit-log/page.tsx', 88, 12),
      file('lib/audit/export.ts', 51, 0),
    ],
  ),
  pr(
    'repo-marketing',
    75,
    'Fix mobile nav overlap',
    'claude-code',
    'fix/mobile-nav',
    'open',
    true,
    'claude_code',
    'passing',
    [file('components/site/mobile-nav.tsx', 37, 15)],
  ),
  pr(
    'repo-billing',
    199,
    'Add rollback notes for subscription migration',
    'maya',
    'docs/subscription-rollback',
    'merged',
    false,
    'manual',
    'passing',
    [file('docs/runbooks/subscription-rollback.md', 44, 0)],
  ),
]

function pr(
  repositoryId: string,
  number: number,
  title: string,
  author: string,
  branch: string,
  status: PullRequestStatus,
  aiAssisted: boolean | null,
  agentSource: AgentSource,
  ciStatus: CiStatus,
  files: PullRequestFileInput[],
) {
  return {
    repositoryId,
    number,
    title,
    author,
    branch,
    status,
    aiAssisted,
    agentSource,
    ciStatus,
    files,
  }
}

function file(
  path: string,
  additions: number,
  deletions: number,
): PullRequestFileInput {
  return {
    path,
    additions,
    deletions,
    changeType: additions === 0 ? 'deleted' : 'modified',
  }
}

export const pullRequests: PullRequest[] = prInputs.map((input, index) => {
  const repository = repositories.find(
    (item) => item.id === input.repositoryId,
  )!
  const risk = calculateRisk({
    aiAssisted: input.aiAssisted,
    ciStatus: input.ciStatus,
    files: input.files,
  })
  const testGap = detectTestGap({ title: input.title, files: input.files })
  const base: PullRequest = {
    id: `pr-${input.repositoryId}-${input.number}`,
    repositoryId: input.repositoryId,
    repositoryName: repository.name,
    number: input.number,
    title: input.title,
    author: input.author,
    branch: input.branch,
    baseBranch: 'main',
    status: input.status,
    aiAssisted: input.aiAssisted,
    agentSource: input.agentSource,
    riskScore: risk.score,
    riskLevel: risk.level,
    testGapStatus: testGap.status,
    ciStatus: input.ciStatus,
    approvalStatus:
      input.approvalStatus ??
      (risk.score >= 50 || input.aiAssisted ? 'pending' : 'not_required'),
    filesChangedCount: input.files.length,
    linesAdded: input.files.reduce((sum, item) => sum + item.additions, 0),
    linesDeleted: input.files.reduce((sum, item) => sum + item.deletions, 0),
    createdAt: `2026-04-${String(11 + (index % 18)).padStart(2, '0')}T09:30:00.000Z`,
    updatedAt: `2026-04-${String(22 + (index % 8)).padStart(2, '0')}T14:15:00.000Z`,
    files: input.files,
    riskSignals: risk.signals,
    testGapAnalysis: testGap,
    ruleViolations: [],
    approvals: [],
  }
  const rules = repoRules.filter(
    (ruleItem) => ruleItem.repositoryId === input.repositoryId,
  )
  base.ruleViolations = evaluateRepoRules(rules, base)
  base.approvals = approvalHistory(base)
  return base
})

function approvalHistory(prItem: PullRequest): Approval[] {
  if (prItem.approvalStatus === 'not_required') return []
  if (prItem.status === 'merged') {
    return [
      {
        id: `approval-${prItem.id}`,
        reviewer: 'Maya Chen',
        decision: 'approved',
        note: 'Risk acceptable with the included tests.',
        createdAt: prItem.updatedAt,
      },
    ]
  }
  return [
    {
      id: `approval-${prItem.id}`,
      reviewer: 'Owen Reed',
      decision:
        prItem.testGapStatus === 'high' ? 'requested_tests' : 'risk_accepted',
      note:
        prItem.testGapStatus === 'high'
          ? 'Add focused coverage before approval.'
          : 'Pending final CI result.',
      createdAt: prItem.updatedAt,
    },
  ]
}

export const activityEvents: ActivityEvent[] = pullRequests
  .slice(0, 14)
  .map((pullRequest, index) => ({
    id: `activity-${pullRequest.id}`,
    timestamp: pullRequest.updatedAt,
    repositoryId: pullRequest.repositoryId,
    repositoryName: pullRequest.repositoryName,
    pullRequestId: pullRequest.id,
    pullRequestNumber: pullRequest.number,
    actor: pullRequest.author,
    agentSource: pullRequest.agentSource,
    eventType:
      index % 4 === 0
        ? 'rule_triggered'
        : index % 3 === 0
          ? 'ci_failed'
          : index % 2 === 0
            ? 'files_changed'
            : 'pr_opened',
    summary:
      index % 4 === 0
        ? `${pullRequest.ruleViolations.length} repository rules triggered`
        : `${pullRequest.title} updated with ${pullRequest.filesChangedCount} changed files`,
    riskLevel: pullRequest.riskLevel,
    metadata: {
      riskScore: pullRequest.riskScore,
      filesChanged: pullRequest.filesChangedCount,
    },
  }))

export const auditEvents: AuditEvent[] = pullRequests.slice(0, 16).flatMap(
  (pullRequest, index) =>
    [
      {
        id: `audit-risk-${pullRequest.id}`,
        eventType: 'risk_score_calculated',
        actor: 'AgentGate',
        repositoryName: pullRequest.repositoryName,
        pullRequestNumber: pullRequest.number,
        summary: `Risk score calculated at ${pullRequest.riskScore}`,
        metadata: { riskLevel: pullRequest.riskLevel },
        createdAt: pullRequest.updatedAt,
      },
      ...(pullRequest.ruleViolations.length
        ? [
            {
              id: `audit-rule-${pullRequest.id}`,
              eventType: 'rule_triggered' as const,
              actor: 'AgentGate',
              repositoryName: pullRequest.repositoryName,
              pullRequestNumber: pullRequest.number,
              summary: `${pullRequest.ruleViolations.length} rules triggered`,
              metadata: { severity: pullRequest.ruleViolations[0].severity },
              createdAt: `2026-04-${String(23 + (index % 6)).padStart(2, '0')}T15:20:00.000Z`,
            },
          ]
        : []),
    ] satisfies AuditEvent[],
)

export const trendData = [
  { date: 'Apr 24', risk: 42, testGaps: 5 },
  { date: 'Apr 25', risk: 48, testGaps: 7 },
  { date: 'Apr 26', risk: 51, testGaps: 8 },
  { date: 'Apr 27', risk: 44, testGaps: 4 },
  { date: 'Apr 28', risk: 63, testGaps: 9 },
  { date: 'Apr 29', risk: 56, testGaps: 6 },
  { date: 'Apr 30', risk: 61, testGaps: 8 },
]

export function getDashboardMetrics() {
  const aiPrs = pullRequests.filter((item) => item.aiAssisted)
  const highRisk = pullRequests.filter(
    (item) => item.riskLevel === 'high' || item.riskLevel === 'critical',
  )
  const testGaps = pullRequests.filter((item) => item.testGapStatus !== 'none')
  const pendingApprovals = pullRequests.filter(
    (item) => item.approvalStatus === 'pending',
  )
  const failedCi = pullRequests.filter((item) => item.ciStatus === 'failing')
  const averageRisk = Math.round(
    pullRequests.reduce((sum, item) => sum + item.riskScore, 0) /
      pullRequests.length,
  )

  return {
    repositoriesConnected: repositories.length,
    aiPrsThisWeek: aiPrs.length,
    highRiskPrs: highRisk.length,
    prsWithTestGaps: testGaps.length,
    pendingApprovals: pendingApprovals.length,
    failedCiChecks: failedCi.length,
    averageRiskScore: averageRisk,
    ruleViolations: pullRequests.reduce(
      (sum, item) => sum + item.ruleViolations.length,
      0,
    ),
  }
}

export function getRepository(id: string) {
  return repositories.find((repository) => repository.id === id)
}

export function getPullRequest(id: string) {
  return pullRequests.find((pullRequest) => pullRequest.id === id)
}

export function getRepositoryPullRequests(repositoryId: string) {
  return pullRequests.filter(
    (pullRequest) => pullRequest.repositoryId === repositoryId,
  )
}

export function getRepositoryRules(repositoryId: string) {
  return repoRules.filter((ruleItem) => ruleItem.repositoryId === repositoryId)
}
