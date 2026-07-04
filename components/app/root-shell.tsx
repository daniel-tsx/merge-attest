'use client'

import { usePathname } from 'next/navigation'
import { AppShell } from '@/components/app/app-shell'
import { publicAppPaths } from '@/lib/site'
import type { NavAttentionCounts } from '@/lib/data/app-data'
import type { PlanKey } from '@/lib/types'

// Prefix matching, consistent with the proxy and the root layout.
const isPublicRoute = (pathname: string) =>
  publicAppPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )

export function RootShell({
  children,
  organizationName,
  planKey,
  dataMode,
  isAdmin,
  navCounts,
}: {
  children: React.ReactNode
  organizationName: string
  planKey: PlanKey
  dataMode: 'live' | 'demo'
  isAdmin: boolean
  navCounts: NavAttentionCounts | null
}) {
  const pathname = usePathname()

  if (isPublicRoute(pathname)) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {children}
      </div>
    )
  }

  return (
    <AppShell
      organizationName={organizationName}
      planKey={planKey}
      dataMode={dataMode}
      isAdmin={isAdmin}
      navCounts={navCounts}
    >
      {children}
    </AppShell>
  )
}
