import type { ReactNode } from 'react'
import { requirePlatformAdmin } from '@/lib/admin/access'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  // 404s for anyone who is not an authenticated platform admin.
  await requirePlatformAdmin()
  return <>{children}</>
}
