import type { AgentSource, RepoRule, RiskLevel } from '@/lib/types'

export type RuleTemplate = {
  key: string
  name: string
  description: string
  triggerType: RepoRule['triggerType']
  actionType: RepoRule['actionType']
  severity: RepoRule['severity']
  branchPattern?: string
  pathPattern?: string
  labelPattern?: string
  agentSource?: AgentSource
  minimumRiskLevel?: RiskLevel
  codeOwnerHint?: string
}

export const ruleTemplates: RuleTemplate[] = [
  {
    key: 'ai-main-approval',
    name: 'AI changes to main need approval',
    description:
      'AI-assisted pull requests targeting main require human approval.',
    triggerType: 'ai_assisted',
    actionType: 'require_approval',
    severity: 'medium',
    branchPattern: 'main',
    codeOwnerHint: 'Repo maintainers',
  },
  {
    key: 'sensitive-auth-billing',
    name: 'Sensitive app areas need security review',
    description:
      'Auth, billing, permission, and secret-adjacent changes request security review.',
    triggerType: 'high_risk',
    actionType: 'request_security_review',
    severity: 'critical',
    pathPattern:
      'auth,billing,permission,secret,.env,middleware,app/api,prisma/migrations',
    minimumRiskLevel: 'high',
    codeOwnerHint: 'Security or platform owner',
  },
  {
    key: 'migration-check',
    name: 'Database migrations publish AgentGate check',
    description:
      'Database migration changes publish an explicit AgentGate check run.',
    triggerType: 'database_migration',
    actionType: 'publish_github_check',
    severity: 'high',
    pathPattern: 'prisma/migrations,db/migrations,schema.prisma',
    codeOwnerHint: 'Database owner',
  },
  {
    key: 'high-test-gap',
    name: 'High test gaps request tests',
    description: 'High-impact changes without tests request focused coverage.',
    triggerType: 'high_test_gap',
    actionType: 'request_tests',
    severity: 'high',
    minimumRiskLevel: 'medium',
  },
]

export function getRuleTemplate(key: string) {
  return ruleTemplates.find((template) => template.key === key) ?? null
}
