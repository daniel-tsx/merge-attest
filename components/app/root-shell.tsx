'use client'

import { usePathname } from 'next/navigation'
import { AppShell } from '@/components/app/app-shell'
import { publicAppPaths } from '@/lib/site'
import type { PlanKey } from '@/lib/types'

const publicRoutes = new Set<string>(publicAppPaths)

export function RootShell({
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

  if (publicRoutes.has(pathname)) {
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
    >
      {children}
    </AppShell>
  )
}
