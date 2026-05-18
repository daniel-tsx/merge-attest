import { Suspense } from 'react'
import {
  ArrowUpRight,
  Bell,
  BrainCircuit,
  Database,
  GitPullRequest,
  KeyRound,
  Receipt,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/app/page-header'
import { SettingsNav } from '@/components/app/settings-nav'
import { FormSkeleton } from '@/components/app/page-loading'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getApiKeyCount,
  getCurrentOrganization,
  listRepositories,
  listTeamMembers,
} from '@/lib/data/app-data'
import { getOrganizationOpenRouterCredential } from '@/lib/ai/credentials'
import { githubConfigured } from '@/lib/github'
import { getPrCheckUsage } from '@/lib/usage'
import { formatNumber } from '@/lib/utils'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Organization profile, integration state, billing gates, usage, API keys, retention, and notifications."
      />
      <SettingsNav />
      <Suspense fallback={<FormSkeleton />}>
        <SettingsOverview />
      </Suspense>
    </div>
  )
}

async function SettingsOverview() {
  const organization = await getCurrentOrganization()
  const [
    members,
    repositories,
    prCheckUsage,
    apiKeyCount,
    openRouterCredential,
  ] = await Promise.all([
    listTeamMembers(organization.id),
    listRepositories(organization.id),
    getPrCheckUsage(organization.id),
    getApiKeyCount(organization.id),
    getOrganizationOpenRouterCredential(organization.id),
  ])
  const displayedUsage =
    organization.dataMode === 'live'
      ? prCheckUsage
      : repositories.reduce(
          (sum, repository) => sum + repository.monthlyPrCheckUsage,
          0,
        )
  const settings = [
    {
      href: '/settings/team',
      label: 'Team members',
      icon: Users,
      description: 'Manage workspace roles, invites, and access.',
      value: `${members.length} ${members.length === 1 ? 'member' : 'members'}`,
    },
    {
      href: '/settings/github',
      label: 'GitHub app',
      icon: GitPullRequest,
      description: 'Installation, webhook health, and manual sync.',
      value: organization.githubInstallationId
        ? `${repositories.length} repos synced`
        : githubConfigured()
          ? 'Ready to install'
          : 'Not configured',
    },
    {
      href: '/settings/ai',
      label: 'AI reviews',
      icon: BrainCircuit,
      description: 'OpenRouter provider key and review queue readiness.',
      value: openRouterCredential ? 'OpenRouter connected' : 'Not configured',
    },
    {
      href: '/settings/billing',
      label: 'Billing plan',
      icon: Receipt,
      description: 'Plans, checkout, and subscription lifecycle.',
      value: `${organization.planKey} · ${organization.billingStatus.replaceAll('_', ' ')}`,
    },
    {
      href: '/settings/usage',
      label: 'Usage',
      icon: Database,
      description: 'PR check consumption and history.',
      value: `${formatNumber(displayedUsage)} checks`,
    },
    {
      href: '/settings',
      label: 'API keys',
      icon: KeyRound,
      description: 'Programmatic access and rotation.',
      value: `${apiKeyCount} active`,
    },
    {
      href: '/settings',
      label: 'Notifications',
      icon: Bell,
      description: 'Alert routing and digest preferences.',
      value: 'Not configured',
    },
  ]

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Organization profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-control border border-border bg-surface-muted/30 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
              Name
            </div>
            <div className="mt-1 font-medium text-foreground">
              {organization.name}
            </div>
          </div>
          <div className="rounded-control border border-border bg-surface-muted/30 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
              Slug
            </div>
            <div className="mt-1 font-mono text-sm font-medium text-foreground">
              {organization.slug}
            </div>
          </div>
          <div className="rounded-control border border-border bg-surface-muted/30 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
              Plan
            </div>
            <div className="mt-1.5">
              <Badge tone="blue" withDot className="capitalize">
                {organization.planKey}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {settings.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.label} href={item.href} className="group">
              <Card className="h-full transition-all hover:border-border-strong hover:shadow-card-hover">
                <CardContent className="flex h-full flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex size-9 items-center justify-center rounded-control bg-surface-subtle text-subtle-foreground transition-colors group-hover:bg-accent-soft group-hover:text-accent">
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                    <ArrowUpRight
                      className="size-3.5 text-subtle-foreground transition-colors group-hover:text-accent"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-semibold tracking-tight text-foreground">
                      {item.label}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-auto inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface-subtle px-2.5 py-1 text-xs font-medium capitalize text-foreground">
                    {item.value}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </>
  )
}
