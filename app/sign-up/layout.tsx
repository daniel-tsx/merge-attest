import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = createPageMetadata({
  title: 'Create account',
  description:
    'Create a free MergeAttest workspace to score AI pull requests, attribute coding agents, and keep an audit-ready governance trail on GitHub.',
  path: '/sign-up',
})

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
