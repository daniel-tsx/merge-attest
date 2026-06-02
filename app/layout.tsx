import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { headers } from 'next/headers'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { RootShell } from '@/components/app/root-shell'
import { ThemeProvider } from '@/components/app/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { getPlatformAdminContext } from '@/lib/admin/access'
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
    pathname === '/' ||
    pathname === '/sign-in' ||
    pathname === '/sign-up' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password'
  const [organization, adminContext] = isPublicRoute
    ? ([null, null] as const)
    : await Promise.all([getCurrentOrganization(), getPlatformAdminContext()])

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <NuqsAdapter>
              <RootShell
                organizationName={organization?.name ?? 'AgentGate'}
                planKey={organization?.planKey ?? 'free'}
                dataMode={organization?.dataMode ?? 'live'}
                isAdmin={adminContext?.isAdmin ?? false}
              >
                {children}
              </RootShell>
            </NuqsAdapter>
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
