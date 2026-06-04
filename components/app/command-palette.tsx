'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  Activity,
  BadgeCheck,
  Boxes,
  ChartNoAxesColumn,
  Gauge,
  GitPullRequest,
  ListChecks,
  Monitor,
  Moon,
  Search,
  Settings,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

type NavCommand = { href: string; label: string; icon: LucideIcon }

const navCommands: NavCommand[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Gauge },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/reports', label: 'Reports', icon: ChartNoAxesColumn },
  { href: '/repositories', label: 'Repositories', icon: Boxes },
  { href: '/pull-requests', label: 'Pull Requests', icon: GitPullRequest },
  { href: '/approvals', label: 'Approvals', icon: BadgeCheck },
  { href: '/audit-log', label: 'Audit Log', icon: ListChecks },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { setTheme } = useTheme()

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const runCommand = React.useCallback((action: () => void) => {
    setOpen(false)
    action()
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command menu"
        className="inline-flex h-9 items-center gap-2 rounded-control border border-border bg-surface px-2.5 text-sm text-subtle-foreground transition-colors hover:border-border-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        <Search className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="ml-3 hidden rounded border border-border bg-surface-muted px-1.5 font-mono text-[10px] leading-5 text-subtle-foreground sm:inline">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search or jump to…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Go to">
            {navCommands.map((command) => {
              const Icon = command.icon
              return (
                <CommandItem
                  key={command.href}
                  value={command.label}
                  onSelect={() => runCommand(() => router.push(command.href))}
                >
                  <Icon aria-hidden="true" />
                  {command.label}
                </CommandItem>
              )
            })}
          </CommandGroup>
          <CommandGroup heading="Theme">
            <CommandItem
              value="theme light"
              onSelect={() => runCommand(() => setTheme('light'))}
            >
              <Sun aria-hidden="true" />
              Light theme
            </CommandItem>
            <CommandItem
              value="theme dark"
              onSelect={() => runCommand(() => setTheme('dark'))}
            >
              <Moon aria-hidden="true" />
              Dark theme
            </CommandItem>
            <CommandItem
              value="theme system"
              onSelect={() => runCommand(() => setTheme('system'))}
            >
              <Monitor aria-hidden="true" />
              System theme
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
