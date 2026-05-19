import type { CSSProperties } from 'react'
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
  TestTube2,
} from 'lucide-react'
import { HeroScanPanel } from '@/components/app/hero-scan-panel'
import { LogoMark } from '@/components/app/logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getServerSession } from '@/lib/auth/session'
import { plans } from '@/lib/plans'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'AgentGate — AI Pull Request Governance',
  description:
    'AgentGate gives teams deterministic risk scoring, test-gap detection, repository rules, approvals, and audit evidence for AI-assisted pull requests.',
}

const introStyle = (index: number): CSSProperties =>
  ({ '--intro-index': index }) as CSSProperties

const inspectionSignals = [
  'diff size',
  'sensitive paths',
  'test coverage',
  'dependency changes',
  'migration files',
  'secret patterns',
  'API surface',
  'lockfile drift',
]

const problemPoints = [
  {
    tag: 'velocity',
    text: 'AI agents open pull requests faster than any team can carefully review them.',
  },
  {
    tag: 'blind spots',
    text: 'Risky changes and missing tests slip through when review relies on reviewer attention alone.',
  },
  {
    tag: 'no record',
    text: 'After an incident, there is no clear record of who approved what, or why.',
  },
]

const riskFactors = [
  { label: 'Sensitive paths touched', value: 28, pct: '80%', bar: 'bg-danger' },
  {
    label: 'Missing test coverage',
    value: 24,
    pct: '64%',
    bar: 'bg-attention',
  },
  { label: 'Diff size & spread', value: 20, pct: '52%', bar: 'bg-warning' },
]

const auditTrail = [
  { label: 'PR #482 flagged high', time: '09:24' },
  { label: 'Approved by @dana', time: '09:31' },
  { label: 'Merged to main', time: '09:33' },
]

const compactFeatures = [
  {
    icon: TestTube2,
    title: 'Test-gap detection',
    description:
      'Surface code paths shipped without coverage, with path-based suggestions for the tests that are missing.',
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
      'Define policies for sensitive files and high-risk patterns, then evaluate them on every PR.',
  },
  {
    icon: GitPullRequest,
    title: 'GitHub-native',
    description:
      'Risk, checks, and review context surface as comments and check runs where engineers already work.',
  },
]

const governancePillars = [
  'Deterministic risk scoring',
  'Missing-test detection',
  'Repository policy rules',
  'Human approval records',
  'Audit-ready review packets',
  'Optional BYOK AI review',
]

const comparisonRows = [
  {
    capability: 'Primary job',
    agentGate: 'Govern AI-assisted pull requests before merge',
    coderabbit: 'Generate AI review comments and developer follow-ups',
    copilot: 'Assist coding and run GitHub-hosted code review',
    others: 'Accelerate PR review, stacking, or code quality workflows',
  },
  {
    capability: 'Trust model',
    agentGate: 'Deterministic signals first, advisory AI second',
    coderabbit: 'AI reviewer output is the main product surface',
    copilot: 'Model-selected review output inside GitHub',
    others: 'AI review and workflow automation vary by product',
  },
  {
    capability: 'Governance controls',
    agentGate: 'Rules, approvals, risk status, and audit trail together',
    coderabbit: 'Enterprise audit logging and RBAC on higher tiers',
    copilot: 'Uses GitHub platform permissions and billing controls',
    others: 'Team controls depend on plan and platform focus',
  },
  {
    capability: 'Test and policy gaps',
    agentGate: 'Flags missing tests and sensitive repository changes',
    coderabbit: 'Focuses on review, fixes, linters, and SAST integrations',
    copilot: 'Focuses on code review assistance',
    others: 'Usually focused on review quality or PR workflow speed',
  },
  {
    capability: 'AI provider control',
    agentGate: 'OpenRouter BYOK boundary for organization-owned keys',
    coderabbit: 'Vendor-managed AI review service',
    copilot: 'GitHub-managed model routing',
    others: 'Vendor-managed model access, with enterprise options',
  },
  {
    capability: 'Pricing shape',
    agentGate: 'Workspace plans from $19/mo, not per-developer seats',
    coderabbit: '$24 or $48 per developer/mo when billed annually',
    copilot: '$10 or $39 per user/mo, with usage changes for reviews',
    others: 'Commonly $30 to $40 per user/mo on team plans',
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

const cardHover =
  'transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-card-hover'

const featureIconBox =
  'flex size-10 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent ring-1 ring-accent-ring transition-colors duration-200 group-hover:bg-accent group-hover:text-accent-foreground'

function SectionIndex({
  index,
  label,
  dark = false,
}: {
  index: string
  label: string
  dark?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'font-mono text-xs font-semibold',
          dark ? 'text-primary-foreground' : 'text-accent',
        )}
      >
        {index}
      </span>
      <span
        className={cn(
          'h-px w-8',
          dark ? 'bg-primary-foreground/25' : 'bg-border-strong',
        )}
      />
      <span
        className={cn(
          'font-mono text-[11px] uppercase tracking-[0.2em]',
          dark ? 'text-primary-foreground/55' : 'text-subtle-foreground',
        )}
      >
        {label}
      </span>
    </div>
  )
}

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
            <a
              href="#features"
              className="transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#comparison"
              className="transition-colors hover:text-foreground"
            >
              Compare
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-foreground"
            >
              How it works
            </a>
            <a
              href="#pricing"
              className="transition-colors hover:text-foreground"
            >
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
          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-14 lg:py-28">
            <div className="flex flex-col">
              <h1
                data-intro
                style={introStyle(0)}
                className="text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl"
              >
                Govern every AI pull request
                <br className="hidden sm:block" /> before it merges.
              </h1>
              <p
                data-intro
                style={introStyle(1)}
                className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                AgentGate is the control layer around AI coding agents:
                deterministic risk scoring, missing-test detection, repository
                rules, human approvals, and audit evidence in one GitHub-native
                workflow.
              </p>
              <div
                data-intro
                style={introStyle(2)}
                className="mt-8 flex flex-col gap-3 sm:flex-row"
              >
                <Button asChild variant="accent" size="lg" className="group">
                  <Link href="/sign-up">
                    Start for free
                    <ArrowRight
                      aria-hidden="true"
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <a href="#how-it-works">See how it works</a>
                </Button>
              </div>
              <p
                data-intro
                style={introStyle(3)}
                className="mt-5 font-mono text-[11px] text-subtle-foreground"
              >
                free plan available · no credit card required
              </p>
            </div>

            <div data-intro style={introStyle(3)}>
              <HeroScanPanel />
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
            <div
              data-reveal
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5"
            >
              <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle-foreground">
                Signals inspected / diff
              </span>
              <div className="flex flex-wrap gap-2">
                {inspectionSignals.map((signal) => (
                  <span
                    key={signal}
                    className="rounded-pill border border-border bg-background px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-surface-subtle hover:text-foreground"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-16">
              <div data-reveal>
                <SectionIndex index="01" label="The problem" />
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Review can&apos;t keep up with AI
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  Coding agents ship pull requests around the clock. Manual
                  review was never designed for this volume — and the gaps are
                  where production incidents start.
                </p>
              </div>
              <div className="flex flex-col">
                {problemPoints.map((point) => (
                  <div
                    key={point.tag}
                    data-reveal
                    className="flex items-start gap-4 border-t border-border py-5 first:border-t-0 first:pt-0"
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-control bg-attention-soft text-attention ring-1 ring-attention-border">
                      <AlertTriangle className="size-4" aria-hidden="true" />
                    </span>
                    <div>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-subtle-foreground">
                        {point.tag}
                      </span>
                      <p className="mt-1 text-[15px] leading-relaxed text-foreground">
                        {point.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-b border-border bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <div data-reveal>
              <SectionIndex index="02" label="Features" />
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                The parts AI reviewers leave around the edges
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                Comments are useful. Governance needs a full record: risk,
                tests, policies, reviewers, approvals, and what changed after
                the decision.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <div
                data-reveal
                className={cn(
                  'group flex flex-col rounded-card border border-border bg-background p-6 shadow-card sm:col-span-2 sm:p-7 lg:col-span-4',
                  cardHover,
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={featureIconBox}>
                    <ShieldAlert className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">
                    Deterministic risk scoring
                  </h3>
                </div>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Every pull request gets a transparent risk score, so reviewers
                  know exactly why a change is flagged. Advisory AI comments can
                  add context, but they do not replace the control.
                </p>
                <div className="mt-5 rounded-control border border-border bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-subtle-foreground">
                      risk breakdown
                    </span>
                    <span className="font-mono text-xs text-subtle-foreground">
                      <span className="font-semibold text-foreground">72</span>{' '}
                      / 100
                    </span>
                  </div>
                  <div className="mt-3 space-y-3">
                    {riskFactors.map((factor) => (
                      <div key={factor.label}>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">
                            {factor.label}
                          </span>
                          <span className="font-mono tabular-nums text-subtle-foreground">
                            +{factor.value}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-surface-subtle">
                          <div
                            className={cn('h-full rounded-pill', factor.bar)}
                            style={{ width: factor.pct }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div
                data-reveal
                className={cn(
                  'group flex flex-col rounded-card border border-border bg-background p-6 shadow-card sm:col-span-2 lg:col-span-2',
                  cardHover,
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={featureIconBox}>
                    <FileText className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">
                    Audit-ready trail
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Approvals, syncs, and policy changes are captured
                  automatically and exportable for compliance reviews.
                </p>
                <ul className="relative mt-auto space-y-3 pt-6 pl-4">
                  <span
                    aria-hidden="true"
                    className="absolute top-7 bottom-1 left-[3px] w-px bg-border"
                  />
                  {auditTrail.map((entry) => (
                    <li
                      key={entry.label}
                      className="relative flex items-center justify-between gap-2"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute -left-4 size-1.5 rounded-full bg-accent ring-2 ring-background"
                      />
                      <span className="text-[11px] text-muted-foreground">
                        {entry.label}
                      </span>
                      <span className="font-mono text-[10px] text-subtle-foreground">
                        {entry.time}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {compactFeatures.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    data-reveal
                    className={cn(
                      'group flex items-start gap-4 rounded-card border border-border bg-background p-6 shadow-card lg:col-span-3',
                      cardHover,
                    )}
                  >
                    <span className={featureIconBox}>
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight text-foreground">
                        {feature.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section id="comparison" className="border-b border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <div data-reveal>
              <div className="grid gap-8 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-end lg:gap-14">
                <div>
                  <SectionIndex index="03" label="Why AgentGate" />
                  <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    Built for governance, not another comment stream
                  </h2>
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                    CodeRabbit, Copilot, Qodo, and Graphite help teams review
                    code faster. AgentGate answers the next question: should
                    this AI-assisted change be allowed to merge, who accepted
                    the risk, and where is the evidence?
                  </p>
                </div>
                <div className="mt-7 flex flex-wrap gap-2">
                  {governancePillars.map((pillar) => (
                    <span
                      key={pillar}
                      className="rounded-pill border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground"
                    >
                      {pillar}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div data-reveal className="mt-10 min-w-0">
              <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
                <div className="border-b border-border bg-surface-muted/60 px-4 py-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <h3 className="text-sm font-semibold tracking-tight text-foreground">
                      Competitive frame
                    </h3>
                    <p className="font-mono text-[10px] text-subtle-foreground">
                      Public pricing checked May 19, 2026
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[880px] text-left text-xs">
                    <caption className="sr-only">
                      Comparison between AgentGate and AI code review tools.
                    </caption>
                    <thead className="bg-background text-[11px] uppercase tracking-wider text-subtle-foreground">
                      <tr>
                        <th
                          scope="col"
                          className="w-[150px] px-4 py-3 font-medium"
                        >
                          Capability
                        </th>
                        <th
                          scope="col"
                          className="w-[210px] px-4 py-3 font-medium text-foreground"
                        >
                          AgentGate
                        </th>
                        <th
                          scope="col"
                          className="w-[190px] px-4 py-3 font-medium"
                        >
                          CodeRabbit
                        </th>
                        <th
                          scope="col"
                          className="w-[190px] px-4 py-3 font-medium"
                        >
                          Copilot Review
                        </th>
                        <th
                          scope="col"
                          className="w-[190px] px-4 py-3 font-medium"
                        >
                          Qodo / Graphite
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {comparisonRows.map((row) => (
                        <tr key={row.capability} className="align-top">
                          <th
                            scope="row"
                            className="bg-background px-4 py-3 font-medium text-foreground"
                          >
                            {row.capability}
                          </th>
                          <td className="px-4 py-3 text-foreground">
                            <div className="flex gap-2">
                              <Check
                                className="mt-0.5 size-3.5 shrink-0 text-success"
                                aria-hidden="true"
                              />
                              <span>{row.agentGate}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {row.coderabbit}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {row.copilot}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {row.others}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-subtle-foreground">
                Competitor details are summarized from public pricing and
                product pages. AgentGate pricing is workspace-based, while many
                AI review tools price by user or developer seat.
              </p>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="border-b border-border bg-surface"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <div data-reveal>
              <SectionIndex index="04" label="How it works" />
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Live in minutes, governed from day one
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                Connect a repository and AgentGate starts scoring pull requests
                immediately — no pipeline changes required.
              </p>
            </div>

            <div className="relative mt-14">
              <span
                aria-hidden="true"
                className="absolute top-5 right-0 left-0 hidden h-px bg-border lg:block"
              />
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                {steps.map((step, index) => (
                  <div key={step.title} data-reveal className="relative">
                    <span className="relative z-10 flex size-10 items-center justify-center rounded-full border border-border bg-surface-elevated font-mono text-sm font-semibold text-foreground shadow-card">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-4 text-sm font-semibold tracking-tight text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="border-b border-border bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <div data-reveal>
              <SectionIndex index="05" label="Pricing" />
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Predictable workspace pricing
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                Start free and upgrade as you connect more repositories. Teams
                do not need a paid reviewer seat for every developer who opens a
                pull request.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {plans.map((plan) => {
                const popular = plan.key === popularPlan
                return (
                  <div
                    key={plan.key}
                    data-reveal
                    className={cn(
                      'relative flex flex-col rounded-card border border-border bg-background p-5',
                      cardHover,
                      popular
                        ? 'border-beam shadow-card-hover ring-1 ring-accent-ring'
                        : '',
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
                        <span className="font-mono text-[11px] text-subtle-foreground">
                          /mo
                        </span>
                      ) : null}
                    </div>
                    <ul className="mt-4 space-y-1.5 border-t border-border pt-4 font-mono text-[11px] text-subtle-foreground">
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
            <p className="mt-6 font-mono text-[11px] text-subtle-foreground">
              All prices in USD · Enterprise plans include custom limits and
              priority support.
            </p>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <div
              data-reveal
              className="rounded-card border border-border bg-surface-elevated px-6 py-14 text-center shadow-card sm:px-12"
            >
              <div className="mx-auto max-w-xl">
                <span className="mx-auto flex size-12 items-center justify-center rounded-control bg-primary text-primary-foreground">
                  <LogoMark className="size-6" />
                </span>
                <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Ship AI code with confidence
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  Connect your first repository and see risk scores on your open
                  pull requests in minutes.
                </p>
                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button asChild variant="accent" size="lg" className="group">
                    <Link href="/sign-up">
                      Start for free
                      <ArrowRight
                        aria-hidden="true"
                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                      />
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
            <a
              href="#features"
              className="transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="transition-colors hover:text-foreground"
            >
              Pricing
            </a>
            <Link
              href="/sign-in"
              className="transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
          </nav>
          <p className="font-mono text-[11px] text-subtle-foreground">
            © {new Date().getFullYear()} AgentGate
          </p>
        </div>
      </footer>
    </div>
  )
}
