'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import {
  Activity,
  BadgeCheck,
  Boxes,
  ChevronRight,
  Gauge,
  GitPullRequest,
  KeyRound,
  ListChecks,
  Menu,
  Settings,
  ShieldCheck,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PlanKey } from '@/lib/types'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  description: string
}

const navSections: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Overview',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        icon: Gauge,
        description: 'Risk, approvals, and activity summary',
      },
      {
        href: '/activity',
        label: 'Activity',
        icon: Activity,
        description: 'Recent agent and review events',
      },
    ],
  },
  {
    label: 'Review work',
    items: [
      {
        href: '/repositories',
        label: 'Repositories',
        icon: Boxes,
        description: 'Connected repos and policy coverage',
      },
      {
        href: '/pull-requests',
        label: 'Pull Requests',
        icon: GitPullRequest,
        description: 'Monitor AI-assisted changes',
      },
      {
        href: '/approvals',
        label: 'Approvals',
        icon: BadgeCheck,
        description: 'Pending decisions and outcomes',
      },
      {
        href: '/audit-log',
        label: 'Audit Log',
        icon: ListChecks,
        description: 'Compliance trail and exports',
      },
    ],
  },
  {
    label: 'Workspace',
    items: [
      {
        href: '/settings',
        label: 'Settings',
        icon: Settings,
        description: 'Team, GitHub, billing, and usage',
      },
    ],
  },
]

const navItems = navSections.flatMap((section) => section.items)

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  onNavigate?: () => void
}) {
  const active = isActivePath(pathname, item.href)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
      className={cn(
        'group flex min-h-11 items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
        active
          ? 'bg-primary text-primary-foreground shadow-card'
          : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
      )}
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-control transition-colors',
          active
            ? 'bg-primary-foreground/10 text-primary-foreground'
            : 'bg-surface-subtle text-subtle-foreground group-hover:text-foreground',
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate">{item.label}</span>
        <span
          className={cn(
            'block truncate text-xs font-normal',
            active ? 'text-primary-foreground/70' : 'text-subtle-foreground',
          )}
        >
          {item.description}
        </span>
      </span>
      {active ? <ChevronRight className="size-4" aria-hidden="true" /> : null}
    </Link>
  )
}

function Navigation({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <nav className="space-y-5" aria-label="Primary navigation">
      {navSections.map((section) => (
        <div key={section.label}>
          <div className="px-3 text-xs font-semibold uppercase tracking-wide text-subtle-foreground">
            {section.label}
          </div>
          <div className="mt-2 space-y-1">
            {section.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

export function AppShell({
  children,
  organizationName,
  planKey,
  dataMode,
}: {
  children: React.ReactNode
  organizationName: string
  planKey: PlanKey
  dataMode: 'live' | 'demo'
}) {
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  const mainRef = React.useRef<HTMLElement>(null)
  const previousPathname = React.useRef(pathname)
  const currentItem =
    navItems.find((item) => isActivePath(pathname, item.href)) ?? navItems[0]

  React.useEffect(() => {
    if (previousPathname.current === pathname) {
      return
    }

    previousPathname.current = pathname
    setMobileNavOpen(false)
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-control bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-focus-ring"
      >
        Skip to main content
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-border bg-surface lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-border px-4">
          <div className="flex size-10 items-center justify-center rounded-card bg-primary text-primary-foreground shadow-card">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold">AgentGate</div>
            <div className="truncate text-xs text-muted-foreground">
              {organizationName}
            </div>
          </div>
        </div>

        <div className="px-3 py-4">
          <Navigation pathname={pathname} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-surface p-4">
          <div className="rounded-card border border-border bg-surface-muted p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">
                  Workspace
                </div>
                <div className="mt-1 truncate text-sm font-semibold">
                  {organizationName}
                </div>
              </div>
              <Badge tone={dataMode === 'live' ? 'green' : 'blue'}>
                {dataMode === 'live' ? 'live' : 'demo'}
              </Badge>
            </div>
            <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Plan</span>
              <span className="font-medium text-foreground">{planKey}</span>
            </div>
            <Link
              href="/settings/github"
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-control border border-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <KeyRound className="size-3.5" aria-hidden="true" />
              Configure GitHub App
            </Link>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Dialog.Root open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <Dialog.Trigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="size-5" aria-hidden="true" />
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-primary/40" />
                <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col border-r border-border bg-surface shadow-card-hover">
                  <div className="flex h-16 items-center justify-between gap-3 border-b border-border px-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-card bg-primary text-primary-foreground">
                        <ShieldCheck className="size-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <Dialog.Title className="text-sm font-semibold">
                          AgentGate
                        </Dialog.Title>
                        <Dialog.Description className="truncate text-xs text-muted-foreground">
                          {organizationName}
                        </Dialog.Description>
                      </div>
                    </div>
                    <Dialog.Close asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Close navigation menu"
                      >
                        <X className="size-5" aria-hidden="true" />
                      </Button>
                    </Dialog.Close>
                  </div>
                  <div className="flex-1 overflow-y-auto px-3 py-4">
                    <Navigation
                      pathname={pathname}
                      onNavigate={() => setMobileNavOpen(false)}
                    />
                  </div>
                  <div className="border-t border-border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="slate">{planKey} plan</Badge>
                      <Badge tone={dataMode === 'live' ? 'green' : 'blue'}>
                        {dataMode === 'live' ? 'live data' : 'demo data'}
                      </Badge>
                    </div>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>

            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {currentItem.label}
              </div>
              <div className="hidden truncate text-xs text-muted-foreground sm:block">
                {currentItem.description}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Badge tone={dataMode === 'live' ? 'green' : 'blue'}>
              {dataMode === 'live' ? 'live data' : 'demo data'}
            </Badge>
            <Badge tone="slate" className="hidden sm:inline-flex">
              {planKey} plan
            </Badge>
          </div>
        </header>

        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl p-4 outline-none sm:p-6"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
