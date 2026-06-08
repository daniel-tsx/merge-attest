import type { ReactNode } from 'react'
import Link from 'next/link'
import { LogoMark } from '@/components/app/logo'
import { ThemeToggle } from '@/components/app/theme-toggle'
import { Button } from '@/components/ui/button'

export function LegalPageShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-control bg-primary text-primary-foreground">
              <LogoMark className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              MergeAttest
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="accent" size="sm">
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <article className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <header className="border-b border-border pb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              {description}
            </p>
          </header>
          <div className="prose-legal mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
            {children}
          </div>
        </article>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <nav className="flex flex-wrap items-center justify-center gap-5 font-medium">
            <Link href="/" className="transition-colors hover:text-foreground">
              Home
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              Terms
            </Link>
          </nav>
          <p className="font-mono text-[11px] text-subtle-foreground">
            © {new Date().getFullYear()} MergeAttest
          </p>
        </div>
      </footer>
    </div>
  )
}
