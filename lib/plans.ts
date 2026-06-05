import type { PlanKey } from '@/lib/types'
import { getPlanEntitlements } from '@/lib/entitlements'

export type Plan = {
  key: PlanKey
  name: string
  priceMonthly: string
  repositoryLimit: string
  prCheckLimit: string
  auditRetention: string
  features: string[]
}

export const plans: Plan[] = [
  {
    key: 'free',
    name: 'Free',
    priceMonthly: '$0',
    repositoryLimit: '3 repositories',
    prCheckLimit: '200 PR checks/month',
    auditRetention: '7-day audit history',
    features: [
      'Risk scoring and test-gap detection',
      'GitHub PR comments and check runs',
      'Approvals, custom rules, and audit export',
    ],
  },
  {
    key: 'starter',
    name: 'Starter',
    priceMonthly: '$19',
    repositoryLimit: '3 repositories',
    prCheckLimit: '300 PR checks/month',
    auditRetention: '30-day audit history',
    features: ['GitHub PR comments and check runs', 'Higher monthly usage'],
  },
  {
    key: 'team',
    name: 'Team',
    priceMonthly: '$79',
    repositoryLimit: '10 repositories',
    prCheckLimit: '2,000 PR checks/month',
    auditRetention: '180-day audit history',
    features: ['Approval workflow', 'Custom repo rules', 'Team governance'],
  },
  {
    key: 'growth',
    name: 'Growth',
    priceMonthly: '$199',
    repositoryLimit: 'Higher limits',
    prCheckLimit: 'Higher check limits',
    auditRetention: '1-year audit history',
    features: [
      'Advanced risk scoring',
      'Sensitive-file rules',
      'Slack alert placeholder',
      'Exportable audit reports',
    ],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 'Custom',
    repositoryLimit: 'Custom',
    prCheckLimit: 'Custom',
    auditRetention: 'Custom retention',
    features: [
      'SSO placeholder',
      'Self-hosted option placeholder',
      'Compliance exports',
      'Priority support',
    ],
  },
]

export function isFeatureAvailable(
  planKey: PlanKey,
  feature: 'approvals' | 'customRules' | 'githubComments' | 'auditExport',
) {
  return getPlanEntitlements(planKey).features[feature]
}
