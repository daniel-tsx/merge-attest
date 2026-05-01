'use client'

import { usePathname } from 'next/navigation'
import { AppShell } from '@/components/app/app-shell'
import type { PlanKey } from '@/lib/types'

const publicRoutes = new Set(['/sign-in', '/sign-up'])

export function RootShell({
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
    >
      {children}
    </AppShell>
  )
}
