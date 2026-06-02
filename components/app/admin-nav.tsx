'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  ServerCog,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const items: Array<{
  href: string
  label: string
  icon: LucideIcon
}> = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/organizations', label: 'Organizations', icon: Building2 },
  { href: '/admin/system', label: 'System', icon: ServerCog },
]

export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Admin sections"
      className="flex flex-wrap gap-1 rounded-card border border-border bg-surface p-1 shadow-card"
    >
      {items.map((item) => {
        const Icon = item.icon
        const active =
          pathname === item.href ||
          (item.href !== '/admin' && pathname.startsWith(item.href))
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
