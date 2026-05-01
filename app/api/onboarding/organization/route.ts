import { NextResponse } from 'next/server'
import { ensureCurrentUserOrganization } from '@/lib/auth/session'

export async function POST() {
  const organization = await ensureCurrentUserOrganization()

  if (!organization) {
    return NextResponse.json(
      { error: 'Authentication and database access are required.' },
      { status: 401 },
    )
  }

  return NextResponse.json({ organization })
}
