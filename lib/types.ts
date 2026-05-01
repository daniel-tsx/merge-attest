export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type TestGapStatus = 'none' | 'warning' | 'high'
export type CiStatus = 'pending' | 'passing' | 'failing' | 'unknown'
export type ApprovalStatus =
  | 'not_required'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'risk_accepted'
export type AgentSource =
  | 'cursor'
  | 'codex'
  | 'claude_code'
  | 'copilot'
  | 'devin'
  | 'manual'
  | 'unknown'
export type PullRequestStatus = 'open' | 'merged' | 'closed'
export type Severity = RiskLevel

export type PullRequestFileInput = {
  path: string
  additions: number
  deletions: number
  changeType: 'added' | 'modified' | 'deleted' | 'renamed'
}

export type RiskSignal = {
  key: string
  label: string
  score: number
  level: RiskLevel
  filePaths: string[]
}

export type Repository = {
  id: string
  name: string
  provider: 'GitHub'
  owner: string
  defaultBranch: string
  visibility: 'public' | 'private'
  connectedStatus: 'connected' | 'disconnected' | 'demo'
  lastSyncedAt: string
  activeRulesCount: number
  monthlyPrCheckUsage: number
  riskProfile: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
}

export type PullRequest = {
  id: string
  repositoryId: string
  repositoryName: string
  number: number
  title: string
  author: string
  branch: string
  baseBranch: string
  status: PullRequestStatus
  aiAssisted: boolean | null
  agentSource: AgentSource
  riskScore: number
  riskLevel: RiskLevel
  testGapStatus: TestGapStatus
  ciStatus: CiStatus
  approvalStatus: ApprovalStatus
  filesChangedCount: number
  linesAdded: number
  linesDeleted: number
  createdAt: string
  updatedAt: string
  assignedReviewer?: {
    id: string
    name: string
    email: string
  }
  reviewDueAt?: string
  reviewSlaStatus: 'none' | 'on_track' | 'due_soon' | 'overdue'
  reviewerSuggestion?: string
  files: PullRequestFileInput[]
  riskSignals: RiskSignal[]
  testGapAnalysis: TestGapResult
  ruleViolations: RuleViolation[]
  approvals: Approval[]
  comments: PullRequestComment[]
}

export type TestGapResult = {
  status: TestGapStatus
  summary: string
  affectedFiles: string[]
  suggestedTestFiles: string[]
  suggestedTestCases: string[]
  confidence: 'low' | 'medium' | 'high'
}

export type RepoRule = {
  id: string
  repositoryId: string
  name: string
  description: string
  enabled: boolean
  triggerType:
    | 'ai_assisted'
    | 'high_risk'
    | 'auth_changed'
    | 'billing_changed'
    | 'database_migration'
    | 'dependency_changed'
    | 'high_test_gap'
    | 'failing_ci'
  actionType:
    | 'warn'
    | 'require_approval'
    | 'block_merge'
    | 'request_tests'
    | 'request_security_review'
    | 'publish_github_check'
  severity: Severity
  branchPattern?: string
  pathPattern?: string
  labelPattern?: string
  agentSource?: AgentSource
  minimumRiskLevel?: RiskLevel
  codeOwnerHint?: string
  createdAt: string
  updatedAt: string
}

export type RuleViolation = {
  id: string
  ruleName: string
  summary: string
  severity: Severity
  actionType: RepoRule['actionType']
  codeOwnerHint?: string
  resolved: boolean
  createdAt: string
}

export type Approval = {
  id: string
  reviewer: string
  decision:
    | 'approved'
    | 'rejected'
    | 'requested_tests'
    | 'risk_accepted'
    | 'not_required'
  note: string
  createdAt: string
}

export type PullRequestComment = {
  id: string
  author: string
  body: string
  createdAt: string
}

export type ActivityEvent = {
  id: string
  timestamp: string
  repositoryId: string
  repositoryName: string
  pullRequestId?: string
  pullRequestNumber?: number
  actor: string
  agentSource: AgentSource
  eventType:
    | 'pr_opened'
    | 'commit_pushed'
    | 'files_changed'
    | 'ci_failed'
    | 'ci_passed'
    | 'rule_triggered'
    | 'approval_requested'
    | 'approved'
    | 'rejected'
    | 'merged'
  summary: string
  riskLevel: RiskLevel
  metadata: Record<string, string | number | boolean | undefined>
}

export type AuditEvent = {
  id: string
  eventType:
    | 'repository_connected'
    | 'pr_synced'
    | 'risk_score_calculated'
    | 'test_gap_detected'
    | 'rule_triggered'
    | 'approval_requested'
    | 'pr_approved'
    | 'pr_rejected'
    | 'risk_accepted'
    | 'github_comment_posted'
    | 'github_check_run_published'
    | 'settings_changed'
  repositoryId?: string
  pullRequestId?: string
  actor?: string
  repositoryName?: string
  pullRequestNumber?: number
  summary: string
  metadata: Record<string, string | number | boolean | undefined>
  createdAt: string
}

export type AuditExport = {
  id: string
  fileName: string
  format: string
  filters: Record<string, string | number | boolean | undefined>
  eventCount: number
  createdBy?: string
  createdAt: string
}

export type PlanKey = 'free' | 'starter' | 'team' | 'growth' | 'enterprise'
