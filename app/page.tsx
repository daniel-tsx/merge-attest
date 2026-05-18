import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Check,
  FileText,
  GitPullRequest,
  ListChecks,
  ShieldAlert,
  ShieldCheck,
  TestTube2,
} from 'lucide-react'
import { GateScan } from '@/components/app/gate-scan'
import { LogoMark } from '@/components/app/logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getServerSession } from '@/lib/auth/session'
import { plans } from '@/lib/plans'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'AgentGate — Governance for AI-generated pull requests',
  description:
    'AgentGate scores risky AI-assisted pull requests, flags missing tests, enforces repository rules, and records every approval before code reaches production.',
}

const problemPoints = [
  'AI agents open pull requests faster than any team can carefully review them.',
  'Risky changes and missing tests slip through when review relies on reviewer attention alone.',
  'After an incident, there is no clear record of who approved what, or why.',
]

const features = [
  {
    icon: ShieldAlert,
    title: 'Deterministic risk scoring',
    description:
      'Every pull request gets a transparent risk score, so reviewers know exactly why a change is flagged — no black-box guesses.',
  },
  {
    icon: TestTube2,
    title: 'Test-gap detection',
    description:
      'Surface code paths shipped without coverage and get path-based suggestions for the tests that are missing.',
  },
  {
    icon: BadgeCheck,
    title: 'Approval workflow',
    description:
      'Route risky changes to the right reviewers and record every approval decision the moment it happens.',
  },
  {
    icon: ListChecks,
    title: 'Custom repository rules',
    description:
      'Define policies for sensitive files and high-risk patterns, then let AgentGate evaluate them on every PR.',
  },
  {
    icon: FileText,
    title: 'Audit-ready trail',
    description:
      'Approvals, syncs, and policy changes are captured automatically and exportable for compliance reviews.',
  },
  {
    icon: GitPullRequest,
    title: 'GitHub-native',
    description:
      'Risk, checks, and review context surface as comments and check runs right where engineers already work.',
  },
]

const steps = [
  {
    title: 'Connect GitHub',
    description:
      'Install the AgentGate GitHub App and sync the repositories you want to govern.',
  },
  {
    title: 'Score every AI PR',
    description:
      'New and updated pull requests are scored for risk and scanned for missing test coverage.',
  },
  {
    title: 'Review and approve',
    description:
      'Reviewers work a prioritized queue, applying repository rules and recording decisions.',
  },
  {
    title: 'Keep an audit trail',
    description:
      'Every decision is logged and retained, ready to export the moment compliance asks.',
  },
]

const popularPlan = 'team'

export default async function Home() {
  const session = await getServerSession()
  if (session) redirect('/dashboard')

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-control bg-primary text-primary-foreground">
              <LogoMark className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              AgentGate
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-foreground"
            >
              How it works
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild variant="accent" size="sm">
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div className="bg-dot-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-accent-ring bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                AI code governance
              </span>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
                The control center for AI-assisted pull requests
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                AgentGate scores risky changes, flags missing tests, enforces
                your repository rules, and records every approval — before
                AI-generated code reaches production.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild variant="accent" size="lg">
                  <Link href="/sign-up">
                    Start for free
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <a href="#how-it-works">See how it works</a>
                </Button>
              </div>
              <p className="mt-4 text-xs text-subtle-foreground">
                Free plan available · No credit card required
              </p>
            </div>

            <div className="mx-auto mt-14 max-w-2xl">
              <div className="rounded-card border border-border bg-surface shadow-card-hover">
                <div className="flex items-center gap-3 border-b border-border px-5 py-4">
                  <GateScan size="sm" tone="accent" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold tracking-tight text-foreground">
                      #482 · Add retry logic to payment webhook
                    </div>
                    <div className="font-mono text-xs text-subtle-foreground">
                      acme/api-gateway
                    </div>
                  </div>
                  <Badge tone="blue" withDot>
                    Scanning
                  </Badge>
                </div>
                <div className="space-y-3 px-5 py-4">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-muted-foreground">
                        Risk score
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-mono font-semibold tabular-nums text-foreground">
                          72
                        </span>
                        <Badge tone="red">High</Badge>
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-surface-subtle">
                      <div
                        className="h-full rounded-pill bg-danger"
                        style={{ width: '72%' }}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="flex items-center gap-2 rounded-control border border-border bg-surface-muted/40 px-3 py-2.5">
                      <TestTube2
                        className="size-4 shrink-0 text-attention"
                        aria-hidden="true"
                      />
                      <span className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          2 test gaps
                        </span>{' '}
                        detected
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-control border border-border bg-surface-muted/40 px-3 py-2.5">
                      <ListChecks
                        className="size-4 shrink-0 text-danger"
                        aria-hidden="true"
                      />
                      <span className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          1 rule
                        </span>{' '}
                        violation
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border bg-surface-muted/40 px-5 py-3">
                  <span className="text-xs text-subtle-foreground">
                    Approval required · 2 reviewers
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-control bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                    <BadgeCheck className="size-3.5" aria-hidden="true" />
                    Awaiting review
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                The problem
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Review can&apos;t keep up with AI
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Coding agents ship pull requests around the clock. Manual review
                was never designed for this volume — and the gaps are where
                production incidents start.
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
              {problemPoints.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 rounded-card border border-border bg-background p-5"
                >
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-control bg-attention-soft text-attention ring-1 ring-attention-border">
                    <AlertTriangle className="size-3.5" aria-hidden="true" />
                  </span>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="border-b border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                Features
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Everything you need to govern AI code
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                From the first commit to the audit log, AgentGate gives reviewers
                the signal they need to merge with confidence.
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="rounded-card border border-border bg-surface p-6 shadow-card transition-shadow hover:shadow-card-hover"
                  >
                    <span className="flex size-10 items-center justify-center rounded-control bg-accent-soft text-accent ring-1 ring-accent-ring">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-sm font-semibold tracking-tight text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="relative overflow-hidden border-b border-border bg-primary text-primary-foreground"
        >
          <div className="bg-dot-grid-on-dark pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/55">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Live in minutes, governed from day one
              </h2>
              <p className="mt-4 text-base leading-relaxed text-primary-foreground/70">
                Connect a repository and AgentGate starts scoring pull requests
                immediately — no pipeline changes required.
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-card border border-primary-foreground/10 bg-primary-foreground/5 p-6"
                >
                  <span className="flex size-9 items-center justify-center rounded-control bg-primary-foreground/10 font-mono text-sm font-semibold text-primary-foreground ring-1 ring-primary-foreground/15">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-sm font-semibold tracking-tight text-primary-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-primary-foreground/65">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="border-b border-border bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                Pricing
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Plans that scale with your team
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Start free and upgrade as you connect more repositories. Every
                plan includes risk scoring and test-gap detection.
              </p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {plans.map((plan) => {
                const popular = plan.key === popularPlan
                return (
                  <div
                    key={plan.key}
                    className={cn(
                      'flex flex-col rounded-card border bg-background p-5',
                      popular
                        ? 'border-accent ring-1 ring-accent-ring'
                        : 'border-border',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold tracking-tight text-foreground">
                        {plan.name}
                      </h3>
                      {popular ? <Badge tone="blue">Popular</Badge> : null}
                    </div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-2xl font-semibold tracking-tight text-foreground">
                        {plan.priceMonthly}
                      </span>
                      {plan.priceMonthly !== 'Custom' ? (
                        <span className="text-xs text-subtle-foreground">
                          /month
                        </span>
                      ) : null}
                    </div>
                    <ul className="mt-4 space-y-1.5 border-t border-border pt-4 text-xs text-muted-foreground">
                      <li>{plan.repositoryLimit}</li>
                      <li>{plan.prCheckLimit}</li>
                      <li>{plan.auditRetention}</li>
                    </ul>
                    <ul className="mt-4 flex-1 space-y-2 text-xs text-muted-foreground">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check
                            className="mt-0.5 size-3.5 shrink-0 text-success"
                            aria-hidden="true"
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      variant={popular ? 'accent' : 'secondary'}
                      size="sm"
                      className="mt-6 w-full"
                    >
                      <Link href="/sign-up">
                        {plan.key === 'free' ? 'Start free' : 'Get started'}
                      </Link>
                    </Button>
                  </div>
                )
              })}
            </div>
            <p className="mt-6 text-center text-xs text-subtle-foreground">
              All prices in USD. Enterprise plans include custom limits and
              priority support.
            </p>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <div className="relative overflow-hidden rounded-card bg-primary px-6 py-14 text-center sm:px-12">
              <div className="bg-dot-grid-on-dark pointer-events-none absolute inset-0 opacity-50" />
              <div className="relative mx-auto max-w-xl">
                <h2 className="text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">
                  Ship AI code with confidence
                </h2>
                <p className="mt-3 text-base leading-relaxed text-primary-foreground/70">
                  Connect your first repository and see risk scores on your open
                  pull requests in minutes.
                </p>
                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button asChild variant="accent" size="lg">
                    <Link href="/sign-up">
                      Start for free
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg">
                    <Link href="/sign-in">Sign in</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-control bg-primary text-primary-foreground">
              <LogoMark className="size-3.5" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              AgentGate
            </span>
          </div>
          <nav className="flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </a>
            <Link
              href="/sign-in"
              className="transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
          </nav>
          <p className="text-xs text-subtle-foreground">
            © {new Date().getFullYear()} AgentGate
          </p>
        </div>
      </footer>
    </div>
  )
}
