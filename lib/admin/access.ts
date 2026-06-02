import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getServerSession } from '@/lib/auth/session'
import { getAdminEmails } from '@/lib/env'
import { getPrismaClient } from '@/lib/prisma'

type Env = Record<string, string | undefined>

export function isPlatformAdminEmail(
  email: string | null | undefined,
  env: Env = process.env,
) {
  if (!email) return false
  return getAdminEmails(env).includes(email.trim().toLowerCase())
}

export type PlatformAdminContext = {
  email: string
  isAdmin: boolean
}

/**
 * Request-scoped platform-admin context. Returns null when there is no
 * database or signed-in session; otherwise reports whether the signed-in
 * user's email is in the `ADMIN_EMAILS` allowlist. Cached so the layout,
 * pages, and server actions share a single session read per request.
 */
export const getPlatformAdminContext = cache(
  async (): Promise<PlatformAdminContext | null> => {
    const prisma = getPrismaClient()
    if (!prisma) return null

    const session = await getServerSession()
    if (!session) return null

    const email = session.user.email
    return { email, isAdmin: isPlatformAdminEmail(email) }
  },
)

/**
 * Guard for admin pages. Renders a 404 (least disclosure) for any request
 * that is not an authenticated platform admin.
 */
export async function requirePlatformAdmin(): Promise<PlatformAdminContext> {
  const context = await getPlatformAdminContext()
  if (!context?.isAdmin) notFound()
  return context
}
