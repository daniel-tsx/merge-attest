import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = createPageMetadata({
  title: 'Forgot password',
  description: 'Reset your MergeAttest account password.',
  path: '/forgot-password',
  noIndex: true,
})

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
