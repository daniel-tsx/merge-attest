import type { ReactNode } from 'react'
import Link from 'next/link'
import { GitPullRequest, ListChecks, ShieldCheck } from 'lucide-react'
import { LogoMark } from '@/components/app/logo'

const trustPoints = [
  {
    icon: ShieldCheck,
    title: 'Risk scoring you can defend',
    description:
      'Deterministic scoring shows reviewers exactly why a change is flagged.',
  },
  {
    icon: GitPullRequest,
    title: 'GitHub-native review queue',
    description:
      'Approvals, rules, and check runs surface where engineers already work.',
  },
  {
    icon: ListChecks,
    title: 'Audit-ready by default',
    description:
      'Every approval, sync, and policy change is captured for compliance.',
  },
]

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <main className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="bg-dot-grid-on-dark pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-primary-foreground"
          >
            <span className="flex size-8 items-center justify-center rounded-control bg-primary-foreground/10 text-primary-foreground ring-1 ring-primary-foreground/15">
              <LogoMark className="size-4" />
            </span>
            AgentGate
          </Link>
        </div>
        <div className="relative max-w-md space-y-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/60">
              Pull Request Control
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight">
              The control center for high-risk pull requests.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-primary-foreground/70">
              Score risky changes, enforce rules, and capture every approval —
              before agent-authored code reaches production.
            </p>
          </div>
          <ul className="space-y-4">
            {trustPoints.map((point) => {
              const Icon = point.icon
              return (
                <li key={point.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-control bg-primary-foreground/10 text-primary-foreground ring-1 ring-primary-foreground/10">
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  <div>
                    <div className="text-sm font-medium text-primary-foreground">
                      {point.title}
                    </div>
                    <div className="mt-0.5 text-xs leading-relaxed text-primary-foreground/65">
                      {point.description}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
        <div className="relative flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary-foreground/45">
          <span className="size-1 rounded-full bg-primary-foreground/40" />
          SOC 2-aligned controls · GDPR ready
        </div>
      </aside>
      <section className="flex min-h-screen flex-col justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-control bg-primary text-primary-foreground">
              <LogoMark className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              AgentGate
            </span>
          </div>
          <div className="mb-8">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
          <div className="rounded-card border border-border bg-surface-elevated p-6 shadow-card">
            {children}
          </div>
          {footer ? (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}

export function AuthFieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string
  children: ReactNode
}) {
  return (
    <label
      className="text-xs font-medium uppercase tracking-wider text-subtle-foreground"
      htmlFor={htmlFor}
    >
      {children}
    </label>
  )
}
