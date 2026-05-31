'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { signOut } from '@/lib/auth-client'

export function SignOutButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSignOut() {
    startTransition(async () => {
      await signOut()
      router.push('/sign-in')
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      className="mt-2 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-control px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-50"
    >
      <LogOut className="size-3.5" aria-hidden="true" />
      {isPending ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
