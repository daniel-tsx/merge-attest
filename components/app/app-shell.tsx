'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
import { Badge, StatusDot } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { CommandPalette } from '@/components/app/command-palette'
import { LogoMark } from '@/components/app/logo'
import { SignOutButton } from '@/components/app/sign-out-button'
import { ThemeToggle } from '@/components/app/theme-toggle'
import { cn } from '@/lib/utils'
import type { PlanKey } from '@/lib/types'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  description: string
}

type NavSection = { label: string; items: NavItem[] }

const baseNavSections: NavSection[] = [
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

const adminNavSection: NavSection = {
  label: 'Platform',
  items: [
    {
      href: '/admin',
      label: 'Admin',
      icon: ShieldCheck,
      description: 'Platform analytics and operations',
    },
  ],
}

function buildNavSections(isAdmin: boolean): NavSection[] {
  return isAdmin ? [...baseNavSections, adminNavSection] : baseNavSections
}

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
        'group flex min-h-10 items-center gap-3 rounded-control px-2.5 py-2 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
        active
          ? 'border border-border bg-surface-elevated text-foreground shadow-card'
          : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
      )}
    >
      <span
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-control transition-colors',
          active
            ? 'bg-primary text-primary-foreground'
            : 'text-subtle-foreground group-hover:text-foreground',
        )}
      >
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {active ? (
        <ChevronRight
          className="size-3.5 text-subtle-foreground"
          aria-hidden="true"
        />
      ) : null}
    </Link>
  )
}

function Navigation({
  sections,
  pathname,
  onNavigate,
}: {
  sections: NavSection[]
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <nav className="space-y-6" aria-label="Primary navigation">
      {sections.map((section) => (
        <div key={section.label}>
          <h2 className="px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-foreground">
            {section.label}
          </h2>
          <div className="mt-2 space-y-0.5">
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

function WorkspaceCard({
  organizationName,
  planKey,
  dataMode,
}: {
  organizationName: string
  planKey: PlanKey
  dataMode: 'live' | 'demo'
}) {
  return (
    <div className="rounded-card border border-border bg-surface-elevated p-3 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle-foreground">
            Workspace
          </div>
          <div className="mt-0.5 truncate text-sm font-semibold text-foreground">
            {organizationName}
          </div>
        </div>
        {dataMode === 'demo' ? (
          <div className="flex shrink-0 items-center gap-1.5 rounded-pill border border-border bg-surface px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            <StatusDot tone="blue" />
            Demo
          </div>
        ) : null}
      </div>
      <Separator className="my-3" />
      <div className="flex items-center justify-between text-xs">
        <span className="text-subtle-foreground">Plan</span>
        <span className="font-medium capitalize text-foreground">
          {planKey}
        </span>
      </div>
      <Link
        href="/settings/github"
        className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-control border border-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:border-border-strong hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        <KeyRound className="size-3.5" aria-hidden="true" />
        Configure GitHub App
      </Link>
      <SignOutButton />
    </div>
  )
}

export function AppShell({
  children,
  organizationName,
  planKey,
  dataMode,
  isAdmin,
}: {
  children: React.ReactNode
  organizationName: string
  planKey: PlanKey
  dataMode: 'live' | 'demo'
  isAdmin: boolean
}) {
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  const mainRef = React.useRef<HTMLElement>(null)
  const previousPathname = React.useRef(pathname)
  const navSections = React.useMemo(() => buildNavSections(isAdmin), [isAdmin])
  const navItems = React.useMemo(
    () => navSections.flatMap((section) => section.items),
    [navSections],
  )
  const currentItem =
    navItems.find((item) => isActivePath(pathname, item.href)) ?? navItems[0]
  const currentSection = navSections.find((section) =>
    section.items.some((item) => isActivePath(pathname, item.href)),
  )

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

      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-surface-muted/55 lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <div className="flex size-8 items-center justify-center rounded-control bg-primary text-primary-foreground">
            <LogoMark className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight">
              AgentGate
            </div>
            <div className="-mt-0.5 text-[11px] text-subtle-foreground">
              Pull request control
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <Navigation sections={navSections} pathname={pathname} />
        </div>

        <div className="border-t border-border p-3">
          <WorkspaceCard
            organizationName={organizationName}
            planKey={planKey}
            dataMode={dataMode}
          />
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface/88 px-4 backdrop-blur supports-[backdrop-filter]:bg-surface/78 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="size-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <SheetHeader className="h-16">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-control bg-primary text-primary-foreground">
                      <LogoMark className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <SheetTitle>AgentGate</SheetTitle>
                      <SheetDescription className="truncate">
                        {organizationName}
                      </SheetDescription>
                    </div>
                  </div>
                  <SheetClose asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Close navigation menu"
                    >
                      <X className="size-5" aria-hidden="true" />
                    </Button>
                  </SheetClose>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-4 py-5">
                  <Navigation
                    sections={navSections}
                    pathname={pathname}
                    onNavigate={() => setMobileNavOpen(false)}
                  />
                </div>
                <SheetFooter>
                  <WorkspaceCard
                    organizationName={organizationName}
                    planKey={planKey}
                    dataMode={dataMode}
                  />
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <div className="min-w-0">
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-1.5 text-xs text-subtle-foreground"
              >
                <span className="hidden truncate sm:inline">
                  {currentSection?.label ?? 'Workspace'}
                </span>
                <ChevronRight
                  className="hidden size-3 sm:inline"
                  aria-hidden="true"
                />
                <span className="truncate font-medium text-foreground">
                  {currentItem.label}
                </span>
              </nav>
              <div className="hidden truncate text-xs text-muted-foreground sm:block">
                {currentItem.description}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <CommandPalette />
            {dataMode === 'demo' ? (
              <Badge tone="blue" withDot>
                demo data
              </Badge>
            ) : null}
            <Badge tone="slate" className="hidden capitalize sm:inline-flex">
              {planKey}
            </Badge>
            <ThemeToggle />
          </div>
        </header>

        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl p-4 outline-none sm:p-6 lg:p-8"
        >
          <div key={pathname} data-route-enter>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
