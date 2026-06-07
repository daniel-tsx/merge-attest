'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell,
  BrainCircuit,
  Database,
  Fingerprint,
  GitPullRequest,
  KeyRound,
  Rocket,
  Settings as SettingsIcon,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const items: Array<{
  href: string
  label: string
  icon: LucideIcon
  description: string
}> = [
  {
    href: '/settings',
    label: 'Workspace',
    icon: SettingsIcon,
    description: 'Profile and preferences',
  },
  {
    href: '/settings/team',
    label: 'Team',
    icon: Users,
    description: 'Members and invites',
  },
  {
    href: '/settings/github',
    label: 'GitHub app',
    icon: GitPullRequest,
    description: 'Installation and webhooks',
  },
  {
    href: '/settings/ai',
    label: 'AI reviews',
    icon: BrainCircuit,
    description: 'Review provider access',
  },
  {
    href: '/settings/agents',
    label: 'Agent registry',
    icon: Fingerprint,
    description: 'AI authorship attribution',
  },
  {
    href: '/settings/usage',
    label: 'Usage',
    icon: Database,
    description: 'PR check consumption',
  },
  {
    href: '/settings/billing',
    label: 'Plan',
    icon: Rocket,
    description: 'Launch limits',
  },
  {
    href: '/settings#api-keys',
    label: 'API keys',
    icon: KeyRound,
    description: 'Programmatic access',
  },
  {
    href: '/settings#notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Alerts and digests',
  },
]

export function SettingsNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Settings sections"
      className="flex flex-wrap gap-1 rounded-card border border-border bg-surface p-1 shadow-card"
    >
      {items.map((item) => {
        const Icon = item.icon
        const active =
          pathname === item.href ||
          (item.href !== '/settings' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-2 rounded-control px-3 py-1.5 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
              active
                ? 'bg-surface-subtle text-foreground shadow-card'
                : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
