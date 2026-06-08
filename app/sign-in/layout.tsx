import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = createPageMetadata({
  title: 'Sign in',
  description:
    'Sign in to MergeAttest to govern AI-assisted pull requests, review risk scores, and manage repository approvals.',
  path: '/sign-in',
})

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
