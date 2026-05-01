export type OnboardingStepId =
  | 'workspace'
  | 'github'
  | 'repositories'
  | 'pull_requests'
export type OnboardingStepStatus = 'complete' | 'current' | 'blocked'

export type OnboardingStatusInput = {
  dataMode: 'live' | 'demo'
  githubConfigured: boolean
  hasGitHubInstallation: boolean
  repositoryCount: number
  pullRequestCount: number
}

export type OnboardingStep = {
  id: OnboardingStepId
  title: string
  description: string
  status: OnboardingStepStatus
  actionLabel?: string
  actionHref?: string
}

export type OnboardingStatus = {
  completed: boolean
  steps: OnboardingStep[]
}

export function getOnboardingStatus(
  input: OnboardingStatusInput,
): OnboardingStatus {
  const githubConnected =
    input.dataMode === 'demo' || input.hasGitHubInstallation
  const hasRepositories = input.repositoryCount > 0
  const hasPullRequests = input.pullRequestCount > 0

  const steps: OnboardingStep[] = [
    {
      id: 'workspace',
      title: 'Create your workspace',
      description: 'Your organization is ready and scoped to your team.',
      status: 'complete',
    },
    {
      id: 'github',
      title: 'Connect GitHub',
      description: input.githubConfigured
        ? 'Install the AgentGate GitHub App so repositories can sync.'
        : 'Add the GitHub App environment variables before installing the app.',
      status: githubConnected
        ? 'complete'
        : input.githubConfigured
          ? 'current'
          : 'blocked',
      actionLabel: input.githubConfigured
        ? 'Install GitHub App'
        : 'Configure GitHub',
      actionHref: '/settings/github',
    },
    {
      id: 'repositories',
      title: 'Sync repositories',
      description:
        'Import repositories and open pull requests from the connected installation.',
      status: hasRepositories
        ? 'complete'
        : githubConnected
          ? 'current'
          : 'blocked',
      actionLabel: 'Sync repositories',
      actionHref: '/repositories',
    },
    {
      id: 'pull_requests',
      title: 'Review your first pull request',
      description:
        'Use risk, test-gap, CI, and approval signals to triage AI-assisted changes.',
      status: hasPullRequests
        ? 'complete'
        : hasRepositories
          ? 'current'
          : 'blocked',
      actionLabel: 'Open PR monitor',
      actionHref: '/pull-requests',
    },
  ]

  return {
    completed: steps.every((step) => step.status === 'complete'),
    steps,
  }
}
