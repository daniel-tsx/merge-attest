import {
  Bell,
  Database,
  GitPullRequest,
  KeyRound,
  Receipt,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/app/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getApiKeyCount,
  getCurrentOrganization,
  listRepositories,
  listTeamMembers,
} from '@/lib/data/app-data'
import { githubConfigured } from '@/lib/github'
import { getPrCheckUsage } from '@/lib/usage'
import { formatNumber } from '@/lib/utils'

export default async function SettingsPage() {
  const organization = await getCurrentOrganization()
  const [members, repositories, prCheckUsage, apiKeyCount] = await Promise.all([
    listTeamMembers(organization.id),
    listRepositories(organization.id),
    getPrCheckUsage(organization.id),
    getApiKeyCount(organization.id),
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
      value: `${members.length} members`,
    },
    {
      href: '/settings/github',
      label: 'GitHub app',
      icon: GitPullRequest,
      value: organization.githubInstallationId
        ? `${repositories.length} repos synced`
        : githubConfigured()
          ? 'ready to install'
          : 'not configured',
    },
    {
      href: '/settings/billing',
      label: 'Billing plan',
      icon: Receipt,
      value: `${organization.planKey} · ${organization.billingStatus.replaceAll('_', ' ')}`,
    },
    {
      href: '/settings/usage',
      label: 'Usage',
      icon: Database,
      value: `${formatNumber(displayedUsage)} checks`,
    },
    {
      href: '/settings',
      label: 'API keys',
      icon: KeyRound,
      value: `${apiKeyCount} active`,
    },
    {
      href: '/settings',
      label: 'Notifications',
      icon: Bell,
      value: 'not configured',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Organization profile, integration state, billing gates, usage, API keys, retention, and notifications."
      />
      <Card>
        <CardHeader>
          <CardTitle>Organization Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm md:grid-cols-3">
          <div>
            <div className="text-muted-foreground">Name</div>
            <div className="font-medium text-foreground">
              {organization.name}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Slug</div>
            <div className="font-medium text-foreground">
              {organization.slug}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Plan</div>
            <Badge tone="blue">{organization.planKey}</Badge>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {settings.map((item) => (
          <Link key={item.label} href={item.href}>
            <Card className="h-full transition-colors hover:border-border-strong">
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <item.icon className="size-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-foreground">
                      {item.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.value}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
