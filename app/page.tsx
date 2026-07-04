import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LogoMark } from '@/components/app/logo'
import { ThemeToggle } from '@/components/app/theme-toggle'
import {
  agents,
  authorship,
  faqs,
  heroLede,
  samplePr,
  signals,
  steps,
} from '@/components/marketing/content'
import { displayFont } from '@/components/marketing/display-font'
import { getServerSession } from '@/lib/auth/session'
import { JsonLd } from '@/lib/seo/json-ld'
import { createHomeJsonLd } from '@/lib/seo/home-json-ld'
import { createPageMetadata } from '@/lib/seo/metadata'

export const metadata = createPageMetadata({
  title: 'AI Pull Request Governance for GitHub Teams',
  description:
    'MergeAttest attributes every pull request to the AI agent that wrote it, scores risk, tracks per-agent trust, and exports AI-authorship evidence for EU AI Act and SOC2 reviews — with approvals and an audit trail.',
  path: '/',
})

// "Paper of Record" landing: a documentary register built on the app's design
// tokens (theme-aware, light-first). The attestation record is the hero
// artifact; the merge board is the mid-page product proof. Ceremony type is
// Fraunces via `font-serif` (components/marketing/display-font.ts). Motion:
// one signature moment (the seal's `attest-draw`) plus the shared
// `[data-intro]` hero stagger — nothing loops.

const two = (n: number) => String(n).padStart(2, '0')

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring'

const inkLink = `${focusRing} rounded-sm underline decoration-border-strong underline-offset-[3px] transition-colors hover:text-accent hover:decoration-accent`

const primaryCta = `${focusRing} inline-flex items-center justify-center rounded-control bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover`

/** What each deterministic signal writes into the record (sample PR #482). */
const signalEntries: Record<(typeof signals)[number], string> = {
  'diff size': '+218 −34 across 6 files',
  'sensitive paths': 'payments/webhooks/** touched',
  'test coverage': '2 changed paths without tests',
  'dependency changes': 'no manifest changes',
  'migration files': 'none detected',
  'secret patterns': 'none detected',
  'API surface': '1 public endpoint modified',
  'lockfile drift': 'lockfile unchanged',
}

const problems = [
  {
    title: 'Generation outran review.',
    body: 'Coding agents multiplied pull request volume, and careful human review did not multiply with it. Changes merge on momentum.',
  },
  {
    title: 'Authorship became a guess.',
    body: 'Six months from now, nobody on the team can say which agent wrote the change that broke payments — or which human accepted the risk.',
  },
  {
    title: 'Now someone is asking for proof.',
    body: 'EU AI Act human-oversight expectations and SOC2 reviews are starting to ask for AI-authorship evidence. A guess is not evidence. A record is.',
  },
]

type Verdict = 'clear' | 'hold' | 'scoring'

/** Mid-page product proof: the pull request monitor as a racked board. */
const board: Array<{
  id: string
  title: string
  repo: string
  agent: string
  score: number | null
  verdict: Verdict
  note: string
}> = [
  {
    id: '#484',
    title: 'Add tests for coupon code edge cases',
    repo: 'acme/web',
    agent: 'codex',
    score: 9,
    verdict: 'clear',
    note: 'low risk · tests included',
  },
  {
    id: '#483',
    title: 'Rotate webhook secrets in terraform',
    repo: 'acme/infra',
    agent: 'devin',
    score: 87,
    verdict: 'hold',
    note: 'sensitive paths · secret patterns',
  },
  {
    id: '#482',
    title: 'Add retry logic to payment webhook',
    repo: 'acme/api-gateway',
    agent: 'claude-code',
    score: 72,
    verdict: 'hold',
    note: '2 test gaps · 1 rule violation',
  },
  {
    id: '#481',
    title: 'Bump pg pool timeouts for burst load',
    repo: 'acme/api-gateway',
    agent: 'copilot',
    score: 34,
    verdict: 'clear',
    note: 'medium-low · no rule hits',
  },
  {
    id: '#485',
    title: 'Refactor invoice PDF generation',
    repo: 'acme/web',
    agent: 'cursor',
    score: null,
    verdict: 'scoring',
    note: 'received · scoring in progress',
  },
]

const willNot = [
  {
    title: 'It will not send your code to a model.',
    body: 'Scoring, attribution, and rule checks run without any language model. An advisory AI layer exists, uses your own OpenRouter key, and is off unless you turn it on.',
  },
  {
    title: 'It will not generate an opinion and call it a score.',
    body: 'Every score decomposes into the exact signals that produced it. If you disagree with a number, you can point at the rule that made it.',
  },
  {
    title: 'It will not store your source files.',
    body: 'It works from pull request metadata: changed paths, risk signals, approvals, audit events. Your code stays on GitHub.',
  },
  {
    title: 'It will not hold your evidence hostage.',
    body: 'Export audit records and reports whenever you want. Disconnect the GitHub App at any time. Leaving is a button, not a negotiation.',
  },
]

const packetFiles = [
  { name: 'attestations.csv', note: 'per-PR authorship + risk record' },
  { name: 'approvals.json', note: 'who signed off, and when' },
  { name: 'agent-scorecards.csv', note: 'per-agent trust history' },
  { name: 'audit-log.json', note: 'every governance event, retained' },
]

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] tracking-[0.24em] text-subtle-foreground uppercase">
      {children}
    </p>
  )
}

function Seal({ size = 108 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 108 108"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label="MergeAttest attestation seal"
      className="text-accent"
    >
      <circle cx="54" cy="54" r="52" stroke="currentColor" strokeWidth="1.5" />
      <circle
        cx="54"
        cy="54"
        r="41"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeDasharray="2 3"
      />
      <defs>
        <path id="seal-arc" d="M54 8.5 a45.5 45.5 0 1 1 -0.01 0" fill="none" />
      </defs>
      <text
        fill="currentColor"
        style={{
          font: '500 8.5px var(--font-geist-mono), monospace',
          letterSpacing: '0.32em',
        }}
      >
        <textPath href="#seal-arc" startOffset="0">
          ATTESTED · MERGEATTEST · ON THE RECORD ·
        </textPath>
      </text>
      <g
        transform="translate(37, 37)"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5.5 27 V7 L17 19.5 L28.5 7 V27" />
        <path className="attest-draw" d="M9.5 21.5 L15 27 L25.5 14.5" />
      </g>
    </svg>
  )
}

function RecordRow({
  term,
  children,
}: {
  term: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 border-t border-border px-5 py-3 first:border-t-0 sm:grid-cols-[8.5rem_1fr]">
      <dt className="pt-px font-mono text-[10px] tracking-[0.18em] text-subtle-foreground uppercase">
        {term}
      </dt>
      <dd className="text-[13px] leading-relaxed text-foreground">
        {children}
      </dd>
    </div>
  )
}

function VerdictChip({ verdict }: { verdict: Verdict }) {
  if (verdict === 'clear')
    return (
      <span className="inline-flex items-center rounded-sm border border-success-border bg-success-soft px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] text-success uppercase">
        clear
      </span>
    )
  if (verdict === 'hold')
    return (
      <span className="inline-flex items-center rounded-sm border border-attention-border bg-attention-soft px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] text-attention uppercase">
        hold
      </span>
    )
  return (
    <span className="inline-flex items-center rounded-sm border border-border px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
      scoring
    </span>
  )
}

export default async function Home() {
  const session = await getServerSession()
  if (session) redirect('/dashboard')

  return (
    <div
      className={`${displayFont.variable} flex min-h-screen flex-col bg-background text-foreground`}
    >
      <JsonLd data={createHomeJsonLd()} />

      {/* Masthead */}
      <header className="border-b border-border-strong">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <div className="flex items-center justify-between border-b border-border py-2.5">
            <p className="font-mono text-[10px] tracking-[0.24em] text-subtle-foreground uppercase">
              Public register · AI-assisted pull requests
            </p>
            <p className="hidden font-mono text-[10px] tracking-[0.24em] text-subtle-foreground uppercase sm:block">
              Free early access
            </p>
          </div>
          <div className="flex h-16 items-center justify-between">
            <Link
              href="/"
              className={`${focusRing} flex items-center gap-2.5 rounded-sm`}
            >
              <span className="flex size-8 items-center justify-center rounded-control bg-primary text-primary-foreground">
                <LogoMark className="size-4" />
              </span>
              <span className="font-serif text-[19px] font-semibold tracking-tight">
                MergeAttest
              </span>
            </Link>
            <nav
              aria-label="Primary"
              className="hidden items-center gap-7 text-[13px] text-muted-foreground md:flex"
            >
              <a className={inkLink} href="#method">
                Method
              </a>
              <a className={inkLink} href="#live">
                The register
              </a>
              <a className={inkLink} href="#evidence">
                Evidence
              </a>
              <a className={inkLink} href="#faq">
                FAQ
              </a>
            </nav>
            <div className="flex items-center gap-3 text-[13px]">
              <ThemeToggle />
              <Link
                className={`${inkLink} hidden text-muted-foreground sm:inline`}
                href="/sign-in"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className={`${focusRing} rounded-control bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover`}
              >
                Open the register
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl items-start gap-12 px-5 pt-14 pb-20 sm:px-8 sm:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
          <div data-intro>
            <Eyebrow>Merge + attest — the name is the method</Eyebrow>
            <h1 className="mt-5 font-serif text-[2.7rem] leading-[1.06] font-medium tracking-[-0.015em] text-balance sm:text-[3.6rem] lg:text-[4rem]">
              Every AI pull request, on&nbsp;the&nbsp;record.
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              {heroLede}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/sign-up" className={primaryCta}>
                Open the register — free
              </Link>
              <a
                href="#method"
                className={`${inkLink} inline-flex items-center justify-center px-2 py-3 text-sm text-muted-foreground`}
              >
                Read the method
              </a>
            </div>
            <p className="mt-6 font-mono text-[11px] tracking-wide text-subtle-foreground">
              GitHub-native · no pipeline changes · no credit card
            </p>
          </div>

          {/* The attestation record — the product's real output as the hero */}
          <div data-intro style={{ ['--intro-index' as string]: 1 }}>
            <div
              id="record"
              className="rounded-card border border-border-strong bg-surface-elevated shadow-card"
            >
              <div className="flex items-baseline justify-between border-b border-border-strong px-5 py-3.5">
                <p className="font-mono text-[10px] tracking-[0.24em] text-muted-foreground uppercase">
                  Attestation record
                </p>
                <p className="font-mono text-[12px] tabular-nums">№ 0482</p>
              </div>
              <dl>
                <RecordRow term="Repository">
                  <span className="font-mono text-[12.5px]">
                    {samplePr.repo}
                  </span>
                </RecordRow>
                <RecordRow term="Pull request">
                  {samplePr.title}{' '}
                  <span className="font-mono text-[12px] text-subtle-foreground tabular-nums">
                    {samplePr.id} · {samplePr.diff}
                  </span>
                </RecordRow>
                <RecordRow term="Attributed to">
                  <span className="font-mono text-[12.5px]">
                    {samplePr.agent}
                  </span>{' '}
                  <span className="text-[12.5px] text-muted-foreground tabular-nums">
                    · confidence 95%
                  </span>
                  <span className="mt-1 block text-[12px] text-subtle-foreground">
                    evidence: commit trailer, bot account
                  </span>
                </RecordRow>
                <RecordRow term="Risk score">
                  <span className="font-mono text-[13px] font-medium tabular-nums">
                    {samplePr.score}/100
                  </span>{' '}
                  <span className="text-[12.5px] text-attention">
                    · {samplePr.band} — deterministic, reproducible
                  </span>
                  <span
                    aria-hidden="true"
                    className="mt-2 block h-1 w-full max-w-[220px] rounded-full bg-surface-muted"
                  >
                    <span
                      className="block h-full rounded-full bg-attention"
                      style={{ width: `${samplePr.score}%` }}
                    />
                  </span>
                </RecordRow>
                <RecordRow term="Findings">
                  <span className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
                    {samplePr.findings.map((f) => (
                      <span
                        key={f.label}
                        className={
                          f.tone === 'danger' ? 'text-danger' : 'text-attention'
                        }
                      >
                        {f.label}
                      </span>
                    ))}
                  </span>
                </RecordRow>
                <RecordRow term="Disposition">
                  Held for human review — approval will be recorded with
                  reviewer, role, and timestamp.
                </RecordRow>
              </dl>
              <div className="flex items-center justify-between gap-4 border-t border-border px-5 py-4">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.18em] text-subtle-foreground uppercase">
                    Exportable
                  </p>
                  <p className="mt-1 font-mono text-[12px] text-muted-foreground tabular-nums">
                    JSON · CSV · retained per plan
                  </p>
                </div>
                <Seal size={96} />
              </div>
            </div>
          </div>
        </section>

        {/* Problem, stated plainly */}
        <section className="border-t border-border-strong">
          <div className="mx-auto w-full max-w-6xl px-5 py-18 sm:px-8">
            <Eyebrow>The problem, stated plainly</Eyebrow>
            <h2 className="mt-4 max-w-2xl font-serif text-[2rem] leading-[1.12] font-medium tracking-[-0.01em] sm:text-[2.6rem]">
              Review didn&rsquo;t scale with generation.
            </h2>
            <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
              {problems.map((p, i) => (
                <div key={p.title} className="border-t border-border pt-5">
                  <p className="font-mono text-[11px] text-accent tabular-nums">
                    ¶ {two(i + 1)}
                  </p>
                  <h3 className="mt-3 font-serif text-[1.2rem] leading-snug font-medium">
                    {p.title}
                  </h3>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What goes on the record — the 8 signals as a ledger */}
        <section id="method" className="border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-5 py-18 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div>
                <Eyebrow>What goes on the record</Eyebrow>
                <h2 className="mt-4 font-serif text-[2rem] leading-[1.12] font-medium tracking-[-0.01em] sm:text-[2.6rem]">
                  Eight signals, inspected on every diff.
                </h2>
                <p className="mt-5 max-w-md text-[14px] leading-relaxed text-muted-foreground">
                  Risk scoring is rule-based, not model-generated. Every entry
                  below is written to the record with the exact reason behind it
                  — the same diff always produces the same score.
                </p>
                <p className="mt-6 font-mono text-[11px] tracking-wide text-subtle-foreground">
                  No model guesswork · fully reproducible
                </p>
              </div>
              <div
                className="border-t border-border-strong"
                role="list"
                aria-label="Deterministic signals recorded on every pull request"
              >
                {signals.map((sig, i) => (
                  <div
                    key={sig}
                    role="listitem"
                    className="grid grid-cols-[2.4rem_1fr] items-baseline gap-3 border-b border-border py-3.5 sm:grid-cols-[2.4rem_11rem_1fr]"
                  >
                    <span className="font-mono text-[11px] text-accent tabular-nums">
                      {two(i + 1)}
                    </span>
                    <span className="text-[13.5px] font-medium capitalize">
                      {sig}
                    </span>
                    <span className="col-start-2 font-mono text-[12px] text-subtle-foreground sm:col-start-3">
                      {signalEntries[sig]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* The register, live — merge board product proof */}
        <section id="live" className="border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-5 py-18 sm:px-8">
            <div className="max-w-2xl">
              <Eyebrow>The register, live</Eyebrow>
              <h2 className="mt-4 font-serif text-[2rem] leading-[1.12] font-medium tracking-[-0.01em] sm:text-[2.6rem]">
                Entries are written as traffic arrives.
              </h2>
              <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
                This is the product surface, not an illustration: the pull
                request monitor sequences every inbound AI-assisted change —
                identified, scored, and cleared or held for a recorded human
                sign-off.
              </p>
            </div>
            <div className="mt-10 rounded-card border border-border bg-surface shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
                <p className="font-mono text-[10px] tracking-[0.2em] text-subtle-foreground uppercase">
                  merge board · inbound pull requests
                </p>
                <p className="font-mono text-[10px] tracking-[0.2em] text-subtle-foreground uppercase">
                  sample traffic
                </p>
              </div>
              <div role="list" aria-label="Sample merge queue" className="p-2">
                {board.map((pr) => (
                  <div
                    key={pr.id}
                    role="listitem"
                    className={`mb-1.5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-control border p-3.5 transition-colors last:mb-0 sm:grid-cols-[3.2rem_1.4fr_0.7fr_0.7fr_6.5rem_5rem] sm:items-center ${
                      pr.verdict === 'hold'
                        ? 'border-attention-border bg-attention-soft'
                        : 'border-border bg-surface hover:bg-surface-hover'
                    }`}
                  >
                    <span className="font-mono text-[12px] text-subtle-foreground tabular-nums">
                      {pr.id}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-medium">
                        {pr.title}
                      </span>
                      <span className="mt-0.5 block font-mono text-[10.5px] text-subtle-foreground sm:hidden">
                        {pr.repo} · {pr.agent} · {pr.note}
                      </span>
                    </span>
                    <span className="hidden truncate font-mono text-[11.5px] text-muted-foreground sm:block">
                      {pr.repo}
                    </span>
                    <span className="hidden font-mono text-[11.5px] text-muted-foreground sm:block">
                      {pr.agent}
                    </span>
                    <span className="col-start-1 flex items-center gap-2 sm:col-start-auto">
                      <span className="w-7 font-mono text-[12px] font-medium tabular-nums">
                        {pr.score === null ? '——' : pr.score}
                      </span>
                      <span
                        aria-hidden="true"
                        className="block h-1 w-14 overflow-hidden rounded-full bg-surface-muted"
                      >
                        {pr.score !== null && (
                          <span
                            className={`block h-full rounded-full ${
                              pr.score >= 60
                                ? 'bg-attention'
                                : pr.score >= 35
                                  ? 'bg-warning'
                                  : 'bg-success'
                            }`}
                            style={{ width: `${pr.score}%` }}
                          />
                        )}
                      </span>
                    </span>
                    <span className="col-start-2 justify-self-end sm:col-start-auto">
                      <VerdictChip verdict={pr.verdict} />
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5">
                <p className="font-mono text-[10.5px] text-subtle-foreground">
                  holds require recorded human sign-off before merge
                </p>
                <p className="font-mono text-[10.5px] text-subtle-foreground tabular-nums">
                  2 held · 2 cleared · 1 scoring
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Procedure clauses */}
        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-5 py-18 sm:px-8">
            <Eyebrow>Procedure</Eyebrow>
            <h2 className="mt-4 max-w-2xl font-serif text-[2rem] leading-[1.12] font-medium tracking-[-0.01em] sm:text-[2.6rem]">
              From install to evidence, in four clauses.
            </h2>
            <div className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <div
                  key={s.title}
                  className="border-t border-border-strong pt-5"
                >
                  <p className="font-serif text-[1.4rem] font-medium text-accent tabular-nums">
                    §{two(i + 1)}
                  </p>
                  <h3 className="mt-3 text-[14.5px] font-semibold">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Per-agent accountability */}
        <section className="border-t border-border">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-18 sm:px-8 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <div>
              <Eyebrow>Per-agent accountability</Eyebrow>
              <h2 className="mt-4 font-serif text-[2rem] leading-[1.12] font-medium tracking-[-0.01em] sm:text-[2.6rem]">
                The ledger reads by agent.
              </h2>
              <p className="mt-5 max-w-md text-[14px] leading-relaxed text-muted-foreground">
                Built-in detection attributes each pull request to the agent
                behind it, with a confidence score and the evidence — commit
                trailers, bot accounts, emails, branch prefixes.
              </p>
              <div className="mt-8 border-t border-border-strong">
                {agents.map((a) => (
                  <div
                    key={a.name}
                    className="grid grid-cols-[7rem_1fr_3rem] items-center gap-4 border-b border-border py-3"
                  >
                    <span className="text-[13px] font-medium">{a.name}</span>
                    <span
                      aria-hidden="true"
                      className="block h-px w-full bg-border"
                    >
                      <span
                        className="block h-px bg-accent"
                        style={{ width: `${a.confidence}%` }}
                      />
                    </span>
                    <span className="text-right font-mono text-[12px] text-muted-foreground tabular-nums">
                      {a.confidence}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 font-mono text-[11px] text-subtle-foreground">
                sample attribution confidence · your own conventions can be
                mapped in the identity registry
              </p>
            </div>
            <div className="lg:pt-24">
              {authorship.map((a, i) => (
                <div
                  key={a.title}
                  className="border-t border-border py-5 first:border-t-0 lg:first:border-t"
                >
                  <div className="grid grid-cols-[2.4rem_1fr] gap-3">
                    <span className="pt-1 font-mono text-[11px] text-accent tabular-nums">
                      {two(i + 1)}
                    </span>
                    <div>
                      <h3 className="text-[14.5px] font-semibold">{a.title}</h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                        {a.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What it will not do */}
        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-5 py-18 sm:px-8">
            <Eyebrow>Refusals, for the record</Eyebrow>
            <h2 className="mt-4 max-w-2xl font-serif text-[2rem] leading-[1.12] font-medium tracking-[-0.01em] sm:text-[2.6rem]">
              What it will not do.
            </h2>
            <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {willNot.map((item, i) => (
                <div key={item.title} className="border-t border-border pt-5">
                  <p className="font-mono text-[11px] text-danger tabular-nums">
                    N-{two(i + 1)}
                  </p>
                  <h3 className="mt-3 font-serif text-[1.2rem] leading-snug font-medium">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Evidence & compliance */}
        <section id="evidence" className="border-t border-border">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-18 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <Eyebrow>Evidence &amp; compliance</Eyebrow>
              <h2 className="mt-4 font-serif text-[2rem] leading-[1.12] font-medium tracking-[-0.01em] sm:text-[2.6rem]">
                Exportable the day the auditor asks.
              </h2>
              <p className="mt-5 max-w-lg text-[14px] leading-relaxed text-muted-foreground">
                Track what share of your codebase AI wrote and how much of it
                carried a human sign-off. Export a review packet that supports
                EU AI Act human-oversight and SOC2 reviews — the record, not a
                certification.
              </p>
              <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-muted-foreground">
                Every approval is written down the moment it happens: who signed
                off, in what role, on which evidence. Nothing is reconstructed
                after the fact.
              </p>
            </div>
            <div className="self-start rounded-card border border-border-strong bg-surface-elevated shadow-card">
              <div className="border-b border-border-strong px-5 py-3.5">
                <p className="font-mono text-[10px] tracking-[0.24em] text-muted-foreground uppercase">
                  Evidence packet · contents
                </p>
              </div>
              <ul>
                {packetFiles.map((f) => (
                  <li
                    key={f.name}
                    className="flex items-baseline justify-between gap-4 border-t border-border px-5 py-3 first:border-t-0"
                  >
                    <span className="font-mono text-[12.5px]">{f.name}</span>
                    <span className="text-right text-[12px] text-subtle-foreground">
                      {f.note}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-border">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-18 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div className="lg:sticky lg:top-10 lg:self-start">
              <Eyebrow>Questions</Eyebrow>
              <h2 className="mt-4 font-serif text-[2rem] leading-[1.12] font-medium tracking-[-0.01em] sm:text-[2.6rem]">
                Asked and answered.
              </h2>
              <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
                What MergeAttest does, what it touches, and what it costs — no
                fine print.
              </p>
              <a
                href="mailto:support@mergeattest.com"
                className={`${inkLink} mt-5 inline-block font-mono text-[12px] text-muted-foreground`}
              >
                support@mergeattest.com
              </a>
            </div>
            <dl className="border-t border-border-strong">
              {faqs.map((item, i) => (
                <div
                  key={item.q}
                  className="grid grid-cols-[2.4rem_1fr] gap-3 border-b border-border py-5"
                >
                  <span className="pt-1 font-mono text-[11px] text-accent tabular-nums">
                    {two(i + 1)}
                  </span>
                  <div>
                    <dt className="font-serif text-[1.05rem] leading-snug font-medium">
                      {item.q}
                    </dt>
                    <dd className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                      {item.a}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Colophon CTA */}
        <section className="border-t border-border-strong">
          <div className="mx-auto w-full max-w-6xl px-5 py-20 text-center sm:px-8">
            <div className="mx-auto flex justify-center">
              <Seal size={84} />
            </div>
            <h2 className="mx-auto mt-7 max-w-xl font-serif text-[2.2rem] leading-[1.1] font-medium tracking-[-0.01em] text-balance sm:text-[2.9rem]">
              Put your merges on the record.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-muted-foreground">
              Connect a repository and the register opens on your next pull
              request. Free during early access.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/sign-up" className={primaryCta}>
                Open the register — free
              </Link>
              <Link
                href="/sign-in"
                className={`${inkLink} inline-flex items-center justify-center px-2 py-3 text-sm text-muted-foreground`}
              >
                Sign in
              </Link>
            </div>
            <p className="mt-6 font-mono text-[11px] tracking-wide text-subtle-foreground">
              3 repositories · 200 PR checks/month · no credit card
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-strong">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-5 py-7 sm:flex-row sm:px-8">
          <p className="font-serif text-sm font-semibold tracking-tight">
            MergeAttest
          </p>
          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center justify-center gap-5 text-[12px] text-muted-foreground"
          >
            <a className={inkLink} href="#method">
              Method
            </a>
            <a className={inkLink} href="#faq">
              FAQ
            </a>
            <Link className={inkLink} href="/privacy">
              Privacy
            </Link>
            <Link className={inkLink} href="/terms">
              Terms
            </Link>
            <a className={inkLink} href="mailto:support@mergeattest.com">
              Contact
            </a>
          </nav>
          <div className="flex flex-col items-center gap-1 sm:items-end">
            <p className="font-mono text-[11px] text-subtle-foreground">
              © {new Date().getFullYear()} MergeAttest
            </p>
            <p className="font-mono text-[11px] text-subtle-foreground">
              From the{' '}
              <a
                href="https://eastbase.studio"
                target="_blank"
                rel="noopener"
                className={`${inkLink} text-accent`}
              >
                Eastbase
              </a>{' '}
              studio
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
