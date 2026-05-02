import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { headers } from 'next/headers'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { RootShell } from '@/components/app/root-shell'
import { getCurrentOrganization } from '@/lib/data/app-data'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'AgentGate',
  description: 'Control center for AI-generated pull requests.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = (await headers()).get('x-agentgate-pathname')
  const isPublicRoute =
    !pathname ||
    pathname === '/sign-in' ||
    pathname === '/sign-up' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password'
  const organization = isPublicRoute ? null : await getCurrentOrganization()

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <NuqsAdapter>
          <RootShell
            organizationName={organization?.name ?? 'AgentGate'}
            planKey={organization?.planKey ?? 'free'}
            dataMode={organization?.dataMode ?? 'live'}
          >
            {children}
          </RootShell>
        </NuqsAdapter>
      </body>
    </html>
  )
}
