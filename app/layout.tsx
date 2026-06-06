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
  title: 'Auteur',
  description: 'Control center for AI-generated pull requests.',
}

// Native <select> popup theming. Injected raw because Tailwind v4's Lightning
// CSS processor strips the experimental customizable-select syntax
// (`appearance: base-select`, `::picker(select)`, `::checkmark`). Progressive
// enhancement: Chromium gets a themed popup (light border, rounded corners, an
// accent-soft/light-purple selected option); other browsers keep the native
// popup. The control stays a real <select>, so FormData forms are unaffected.
const selectPickerStyles = `
select[data-slot="select"] option:checked {
  background-color: var(--accent-soft);
  color: var(--foreground);
}
@supports (appearance: base-select) {
  select[data-slot="select"],
  select[data-slot="select"]::picker(select) {
    appearance: base-select;
  }
  /* base-select renders the control as a flex button; keep the value centered. */
  select[data-slot="select"] {
    display: inline-flex;
    align-items: center;
  }
  select[data-slot="select"]::picker-icon { display: none; }
  select[data-slot="select"]::picker(select) {
    margin-top: 0.25rem;
    padding: 0.25rem;
    background-color: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-overlay);
    scrollbar-width: thin;
    scrollbar-color: var(--border-strong) transparent;
  }
  select[data-slot="select"] option {
    padding: 0.375rem 0.5rem;
    border-radius: var(--radius-control);
    color: var(--foreground);
    background-color: transparent;
  }
  select[data-slot="select"] option:hover { background-color: var(--surface-hover); }
  select[data-slot="select"] option:checked { background-color: var(--accent-soft); color: var(--foreground); }
  select[data-slot="select"] option::checkmark { color: var(--accent); }
}
`

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = (await headers()).get('x-auteur-pathname')
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-strong`}
    >
      <body className="min-h-full">
        <style dangerouslySetInnerHTML={{ __html: selectPickerStyles }} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <NuqsAdapter>
              <RootShell
                organizationName={organization?.name ?? 'Auteur'}
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
