import Link from 'next/link'
import { Fraunces } from 'next/font/google'
import {
  agents,
  authorship,
  faqs,
  heroLede,
  samplePr,
  signals,
  steps,
} from '@/components/marketing/content'
import { createPageMetadata } from '@/lib/seo/metadata'

export const metadata = createPageMetadata({
  title: 'Design direction — Paper of Record',
  description:
    'Landing page design exploration: MergeAttest as the system of record for AI-assisted pull requests. Preview only.',
  path: '/design-directions/paper-of-record',
  noIndex: true,
})

// "Paper of Record" direction: a light, documentary register. The attestation
// record itself is the hero artifact. Scoped to `.por`; values mirror the
// app's light token family so marketing and product read as one system.
const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-por-display',
})

const styles = `
.por {
  --paper: oklch(0.977 0.005 250);
  --paper-raised: oklch(0.995 0.002 250);
  --paper-tint: oklch(0.955 0.007 250);
  --ink: oklch(0.17 0.022 252);
  --ink-dim: oklch(0.42 0.028 252);
  --ink-faint: oklch(0.56 0.03 252);
  --rule: oklch(0.872 0.014 250);
  --rule-strong: oklch(0.72 0.024 250);
  --seal: oklch(0.5 0.105 208);
  --seal-soft: oklch(0.945 0.03 205);
  --hold: oklch(0.545 0.145 45);
  --breach: oklch(0.505 0.17 25);
  --clear: oklch(0.475 0.115 160);
  background: var(--paper);
  color: var(--ink);
}
.por-display { font-family: var(--font-por-display), Georgia, serif; }
.por-mono { font-family: var(--font-geist-mono), ui-monospace, monospace; }
.por-num { font-variant-numeric: tabular-nums; }
.por a:focus-visible,
.por button:focus-visible {
  outline: 2px solid var(--seal);
  outline-offset: 3px;
  border-radius: 2px;
}
.por-link {
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
  text-decoration-color: var(--rule-strong);
  transition: text-decoration-color 0.18s ease, color 0.18s ease;
}
.por-link:hover { color: var(--seal); text-decoration-color: var(--seal); }
.por-cta {
  background: var(--ink);
  color: var(--paper-raised);
  transition: background 0.18s ease, box-shadow 0.18s ease;
}
.por-cta:hover {
  background: oklch(0.27 0.035 255);
  box-shadow: 0 10px 28px -14px oklch(0.17 0.022 252 / 0.45);
}
.por-record {
  background: var(--paper-raised);
  border: 1px solid var(--rule-strong);
  box-shadow:
    0 1px 2px oklch(0.17 0.022 252 / 0.05),
    0 18px 44px -28px oklch(0.17 0.022 252 / 0.28);
}
.por-row + .por-row { border-top: 1px solid var(--rule); }
/* Signature moment: the seal's attest check draws itself once on load. The
   global reduced-motion rule collapses the duration so the final state shows. */
.por-check {
  stroke-dasharray: 34;
  stroke-dashoffset: 34;
  animation: por-draw 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.5s both;
}
@keyframes por-draw { to { stroke-dashoffset: 0; } }
`

const two = (n: number) => String(n).padStart(2, '0')

/** What each deterministic signal writes into the record. */
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

const packetFiles = [
  { name: 'attestations.csv', note: 'per-PR authorship + risk record' },
  { name: 'approvals.json', note: 'who signed off, and when' },
  { name: 'agent-scorecards.csv', note: 'per-agent trust history' },
  { name: 'audit-log.json', note: 'every governance event, retained' },
]

const dataHandling = [
  {
    term: 'Full source files',
    detail:
      'Never stored. MergeAttest works from pull request metadata — changed paths, risk signals, approvals, audit events.',
  },
  {
    term: 'Provider credentials',
    detail:
      'Customer-provided keys, such as an OpenRouter key, are encrypted before storage.',
  },
  {
    term: 'Model execution',
    detail:
      'Scoring, attribution, and rules run without any language model. Nothing is sent to a model provider unless you enable it with your own key.',
  },
  {
    term: 'Your exit',
    detail:
      'Export evidence and reports whenever you need them; disconnect the GitHub App at any time.',
  },
]

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

function Seal({ size = 108 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 108 108"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label="MergeAttest attestation seal"
    >
      <circle cx="54" cy="54" r="52" stroke="var(--seal)" strokeWidth="1.5" />
      <circle
        cx="54"
        cy="54"
        r="41"
        stroke="var(--seal)"
        strokeWidth="0.75"
        strokeDasharray="2 3"
      />
      <defs>
        <path
          id="por-seal-arc"
          d="M54 8.5 a45.5 45.5 0 1 1 -0.01 0"
          fill="none"
        />
      </defs>
      <text
        fill="var(--seal)"
        style={{
          font: '500 8.5px var(--font-geist-mono), monospace',
          letterSpacing: '0.32em',
        }}
      >
        <textPath href="#por-seal-arc" startOffset="0">
          ATTESTED · MERGEATTEST · ON THE RECORD ·
        </textPath>
      </text>
      <g
        transform="translate(37, 37)"
        stroke="var(--seal)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5.5 27 V7 L17 19.5 L28.5 7 V27" />
        <path className="por-check" d="M9.5 21.5 L15 27 L25.5 14.5" />
      </g>
    </svg>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="por-mono text-[11px] uppercase tracking-[0.24em] text-[var(--ink-faint)]">
      {children}
    </p>
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
    <div className="por-row grid grid-cols-[7.5rem_1fr] gap-3 px-5 py-3 sm:grid-cols-[8.5rem_1fr]">
      <dt className="por-mono pt-px text-[10px] uppercase tracking-[0.18em] text-[var(--ink-faint)]">
        {term}
      </dt>
      <dd className="text-[13px] leading-relaxed text-[var(--ink)]">
        {children}
      </dd>
    </div>
  )
}

export default function PaperOfRecord() {
  return (
    <div className={`por ${display.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="flex min-h-screen flex-col">
        {/* Masthead */}
        <header className="border-b border-[var(--rule-strong)]">
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
            <div className="flex items-center justify-between border-b border-[var(--rule)] py-2.5">
              <p className="por-mono text-[10px] uppercase tracking-[0.24em] text-[var(--ink-faint)]">
                Public register · AI-assisted pull requests
              </p>
              <p className="por-mono hidden text-[10px] uppercase tracking-[0.24em] text-[var(--ink-faint)] sm:block">
                Free early access
              </p>
            </div>
            <div className="flex h-16 items-center justify-between">
              <Link href="/" className="flex items-baseline gap-2.5">
                <span className="por-display text-[19px] font-semibold tracking-tight">
                  MergeAttest
                </span>
              </Link>
              <nav
                aria-label="Primary"
                className="hidden items-center gap-7 text-[13px] text-[var(--ink-dim)] md:flex"
              >
                <a className="por-link" href="#record">
                  The record
                </a>
                <a className="por-link" href="#method">
                  Method
                </a>
                <a className="por-link" href="#evidence">
                  Evidence
                </a>
                <a className="por-link" href="#faq">
                  FAQ
                </a>
              </nav>
              <div className="flex items-center gap-4 text-[13px]">
                <Link
                  className="por-link hidden text-[var(--ink-dim)] sm:inline"
                  href="/sign-in"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="por-cta rounded-sm px-4 py-2 text-[13px] font-medium"
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
              <h1 className="por-display mt-5 text-[2.7rem] leading-[1.06] font-medium tracking-[-0.015em] text-balance sm:text-[3.6rem] lg:text-[4rem]">
                Every AI pull request, on&nbsp;the&nbsp;record.
              </h1>
              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[var(--ink-dim)] sm:text-base">
                {heroLede}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/sign-up"
                  className="por-cta inline-flex items-center justify-center rounded-sm px-6 py-3 text-sm font-medium"
                >
                  Open the register — free
                </Link>
                <a
                  href="#method"
                  className="por-link inline-flex items-center justify-center px-2 py-3 text-sm text-[var(--ink-dim)]"
                >
                  Read the method
                </a>
              </div>
              <p className="por-mono mt-6 text-[11px] tracking-wide text-[var(--ink-faint)]">
                GitHub-native · no pipeline changes · no credit card
              </p>
            </div>

            {/* The attestation record — the product's real output as the hero */}
            <div data-intro style={{ ['--intro-index' as string]: 1 }}>
              <div className="por-record rounded-sm" id="record">
                <div className="flex items-baseline justify-between border-b border-[var(--rule-strong)] px-5 py-3.5">
                  <p className="por-mono text-[10px] uppercase tracking-[0.24em] text-[var(--ink-dim)]">
                    Attestation record
                  </p>
                  <p className="por-mono por-num text-[12px] text-[var(--ink)]">
                    № 0482
                  </p>
                </div>
                <dl>
                  <RecordRow term="Repository">
                    <span className="por-mono text-[12.5px]">
                      {samplePr.repo}
                    </span>
                  </RecordRow>
                  <RecordRow term="Pull request">
                    {samplePr.title}{' '}
                    <span className="por-mono por-num text-[12px] text-[var(--ink-faint)]">
                      {samplePr.id} · {samplePr.diff}
                    </span>
                  </RecordRow>
                  <RecordRow term="Attributed to">
                    <span className="por-mono text-[12.5px]">
                      {samplePr.agent}
                    </span>{' '}
                    <span className="por-num text-[12.5px] text-[var(--ink-dim)]">
                      · confidence 95%
                    </span>
                    <span className="mt-1 block text-[12px] text-[var(--ink-faint)]">
                      evidence: commit trailer, bot account
                    </span>
                  </RecordRow>
                  <RecordRow term="Risk score">
                    <span className="por-mono por-num text-[13px] font-medium">
                      {samplePr.score}/100
                    </span>{' '}
                    <span className="text-[12.5px] text-[var(--hold)]">
                      · {samplePr.band} — deterministic, reproducible
                    </span>
                    <span
                      aria-hidden="true"
                      className="mt-2 block h-1 w-full max-w-[220px] rounded-full bg-[var(--paper-tint)]"
                    >
                      <span
                        className="block h-full rounded-full bg-[var(--hold)]"
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
                            f.tone === 'danger'
                              ? 'text-[var(--breach)]'
                              : 'text-[var(--hold)]'
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
                <div className="por-row flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="por-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-faint)]">
                      Exportable
                    </p>
                    <p className="por-mono por-num mt-1 text-[12px] text-[var(--ink-dim)]">
                      JSON · CSV · retained per plan
                    </p>
                  </div>
                  <Seal size={96} />
                </div>
              </div>
            </div>
          </section>

          {/* Problem, stated plainly */}
          <section className="border-t border-[var(--rule-strong)]">
            <div className="mx-auto w-full max-w-6xl px-5 py-18 sm:px-8">
              <Eyebrow>The problem, stated plainly</Eyebrow>
              <h2 className="por-display mt-4 max-w-2xl text-[2rem] leading-[1.12] font-medium tracking-[-0.01em] sm:text-[2.6rem]">
                Review didn&rsquo;t scale with generation.
              </h2>
              <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
                {problems.map((p, i) => (
                  <div
                    key={p.title}
                    className="border-t border-[var(--rule)] pt-5"
                  >
                    <p className="por-mono por-num text-[11px] text-[var(--seal)]">
                      ¶ {two(i + 1)}
                    </p>
                    <h3 className="por-display mt-3 text-[1.2rem] leading-snug font-medium">
                      {p.title}
                    </h3>
                    <p className="mt-2.5 text-[13.5px] leading-relaxed text-[var(--ink-dim)]">
                      {p.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* What goes on the record — the 8 signals as a ledger */}
          <section id="method" className="border-t border-[var(--rule)]">
            <div className="mx-auto w-full max-w-6xl px-5 py-18 sm:px-8">
              <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
                <div>
                  <Eyebrow>What goes on the record</Eyebrow>
                  <h2 className="por-display mt-4 text-[2rem] leading-[1.12] font-medium tracking-[-0.01em] sm:text-[2.6rem]">
                    Eight signals, inspected on every diff.
                  </h2>
                  <p className="mt-5 max-w-md text-[14px] leading-relaxed text-[var(--ink-dim)]">
                    Risk scoring is rule-based, not model-generated. Every entry
                    below is written to the record with the exact reason behind
                    it — the same diff always produces the same score.
                  </p>
                  <p className="por-mono mt-6 text-[11px] tracking-wide text-[var(--ink-faint)]">
                    No model guesswork · fully reproducible
                  </p>
                </div>
                <div
                  className="border-t border-[var(--rule-strong)]"
                  role="list"
                  aria-label="Deterministic signals recorded on every pull request"
                >
                  {signals.map((sig, i) => (
                    <div
                      key={sig}
                      role="listitem"
                      className="grid grid-cols-[2.4rem_1fr] items-baseline gap-3 border-b border-[var(--rule)] py-3.5 sm:grid-cols-[2.4rem_11rem_1fr]"
                    >
                      <span className="por-mono por-num text-[11px] text-[var(--seal)]">
                        {two(i + 1)}
                      </span>
                      <span className="text-[13.5px] font-medium capitalize">
                        {sig}
                      </span>
                      <span className="por-mono col-start-2 text-[12px] text-[var(--ink-faint)] sm:col-start-3">
                        {signalEntries[sig]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Workflow clauses */}
          <section className="border-t border-[var(--rule)]">
            <div className="mx-auto w-full max-w-6xl px-5 py-18 sm:px-8">
              <Eyebrow>Procedure</Eyebrow>
              <h2 className="por-display mt-4 max-w-2xl text-[2rem] leading-[1.12] font-medium tracking-[-0.01em] sm:text-[2.6rem]">
                From install to evidence, in four clauses.
              </h2>
              <div className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                {steps.map((s, i) => (
                  <div
                    key={s.title}
                    className="border-t border-[var(--rule-strong)] pt-5"
                  >
                    <p className="por-display por-num text-[1.4rem] font-medium text-[var(--seal)]">
                      §{two(i + 1)}
                    </p>
                    <h3 className="mt-3 text-[14.5px] font-semibold">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-[var(--ink-dim)]">
                      {s.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Per-agent accountability */}
          <section className="border-t border-[var(--rule)]">
            <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-18 sm:px-8 lg:grid-cols-[1fr_1fr] lg:gap-16">
              <div>
                <Eyebrow>Per-agent accountability</Eyebrow>
                <h2 className="por-display mt-4 text-[2rem] leading-[1.12] font-medium tracking-[-0.01em] sm:text-[2.6rem]">
                  The ledger reads by agent.
                </h2>
                <p className="mt-5 max-w-md text-[14px] leading-relaxed text-[var(--ink-dim)]">
                  Built-in detection attributes each pull request to the agent
                  behind it, with a confidence score and the evidence — commit
                  trailers, bot accounts, emails, branch prefixes.
                </p>
                <div className="mt-8 border-t border-[var(--rule-strong)]">
                  {agents.map((a) => (
                    <div
                      key={a.name}
                      className="grid grid-cols-[7rem_1fr_3rem] items-center gap-4 border-b border-[var(--rule)] py-3"
                    >
                      <span className="text-[13px] font-medium">{a.name}</span>
                      <span
                        aria-hidden="true"
                        className="block h-px w-full bg-[var(--rule)]"
                      >
                        <span
                          className="block h-px bg-[var(--seal)]"
                          style={{ width: `${a.confidence}%` }}
                        />
                      </span>
                      <span className="por-mono por-num text-right text-[12px] text-[var(--ink-dim)]">
                        {a.confidence}%
                      </span>
                    </div>
                  ))}
                </div>
                <p className="por-mono mt-4 text-[11px] text-[var(--ink-faint)]">
                  sample attribution confidence · your own conventions can be
                  mapped in the identity registry
                </p>
              </div>
              <div className="lg:pt-24">
                {authorship.map((a, i) => (
                  <div
                    key={a.title}
                    className="border-t border-[var(--rule)] py-5 first:border-t-0 lg:first:border-t"
                  >
                    <div className="grid grid-cols-[2.4rem_1fr] gap-3">
                      <span className="por-mono por-num pt-1 text-[11px] text-[var(--seal)]">
                        {two(i + 1)}
                      </span>
                      <div>
                        <h3 className="text-[14.5px] font-semibold">
                          {a.title}
                        </h3>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--ink-dim)]">
                          {a.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Evidence & compliance */}
          <section id="evidence" className="border-t border-[var(--rule)]">
            <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-18 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
              <div>
                <Eyebrow>Evidence &amp; compliance</Eyebrow>
                <h2 className="por-display mt-4 text-[2rem] leading-[1.12] font-medium tracking-[-0.01em] sm:text-[2.6rem]">
                  Exportable the day the auditor asks.
                </h2>
                <p className="mt-5 max-w-lg text-[14px] leading-relaxed text-[var(--ink-dim)]">
                  Track what share of your codebase AI wrote and how much of it
                  carried a human sign-off. Export a review packet that supports
                  EU AI Act human-oversight and SOC2 reviews — the record, not a
                  certification.
                </p>
                <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-[var(--ink-dim)]">
                  Every approval is written down the moment it happens: who
                  signed off, in what role, on which evidence. Nothing is
                  reconstructed after the fact.
                </p>
              </div>
              <div className="por-record self-start rounded-sm">
                <div className="border-b border-[var(--rule-strong)] px-5 py-3.5">
                  <p className="por-mono text-[10px] uppercase tracking-[0.24em] text-[var(--ink-dim)]">
                    Evidence packet · contents
                  </p>
                </div>
                <ul>
                  {packetFiles.map((f) => (
                    <li
                      key={f.name}
                      className="por-row flex items-baseline justify-between gap-4 px-5 py-3"
                    >
                      <span className="por-mono text-[12.5px] text-[var(--ink)]">
                        {f.name}
                      </span>
                      <span className="text-right text-[12px] text-[var(--ink-faint)]">
                        {f.note}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Data handling */}
          <section className="border-t border-[var(--rule)]">
            <div className="mx-auto w-full max-w-6xl px-5 py-18 sm:px-8">
              <Eyebrow>Data handling</Eyebrow>
              <h2 className="por-display mt-4 max-w-2xl text-[2rem] leading-[1.12] font-medium tracking-[-0.01em] sm:text-[2.6rem]">
                What is never stored.
              </h2>
              <dl className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
                {dataHandling.map((d) => (
                  <div
                    key={d.term}
                    className="border-t border-[var(--rule)] pt-4"
                  >
                    <dt className="text-[14.5px] font-semibold">{d.term}</dt>
                    <dd className="mt-2 text-[13.5px] leading-relaxed text-[var(--ink-dim)]">
                      {d.detail}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="border-t border-[var(--rule)]">
            <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-18 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <div className="lg:sticky lg:top-10 lg:self-start">
                <Eyebrow>Questions</Eyebrow>
                <h2 className="por-display mt-4 text-[2rem] leading-[1.12] font-medium tracking-[-0.01em] sm:text-[2.6rem]">
                  Asked and answered.
                </h2>
                <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-[var(--ink-dim)]">
                  What MergeAttest does, what it touches, and what it costs — no
                  fine print.
                </p>
                <a
                  href="mailto:support@mergeattest.com"
                  className="por-link por-mono mt-5 inline-block text-[12px] text-[var(--ink-dim)]"
                >
                  support@mergeattest.com
                </a>
              </div>
              <dl className="border-t border-[var(--rule-strong)]">
                {faqs.slice(0, 6).map((item, i) => (
                  <div
                    key={item.q}
                    className="grid grid-cols-[2.4rem_1fr] gap-3 border-b border-[var(--rule)] py-5"
                  >
                    <span className="por-mono por-num pt-1 text-[11px] text-[var(--seal)]">
                      {two(i + 1)}
                    </span>
                    <div>
                      <dt className="por-display text-[1.05rem] leading-snug font-medium">
                        {item.q}
                      </dt>
                      <dd className="mt-2 text-[13.5px] leading-relaxed text-[var(--ink-dim)]">
                        {item.a}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* Colophon CTA */}
          <section className="border-t border-[var(--rule-strong)]">
            <div className="mx-auto w-full max-w-6xl px-5 py-20 text-center sm:px-8">
              <div className="mx-auto flex justify-center">
                <Seal size={84} />
              </div>
              <h2 className="por-display mx-auto mt-7 max-w-xl text-[2.2rem] leading-[1.1] font-medium tracking-[-0.01em] text-balance sm:text-[2.9rem]">
                Put your merges on the record.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-[var(--ink-dim)]">
                Connect a repository and the register opens on your next pull
                request. Free during early access.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/sign-up"
                  className="por-cta inline-flex items-center justify-center rounded-sm px-7 py-3 text-sm font-medium"
                >
                  Open the register — free
                </Link>
                <Link
                  href="/sign-in"
                  className="por-link inline-flex items-center justify-center px-2 py-3 text-sm text-[var(--ink-dim)]"
                >
                  Sign in
                </Link>
              </div>
              <p className="por-mono mt-6 text-[11px] tracking-wide text-[var(--ink-faint)]">
                3 repositories · 200 PR checks/month · no credit card
              </p>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-[var(--rule-strong)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-5 py-7 sm:flex-row sm:px-8">
            <p className="por-display text-sm font-semibold tracking-tight">
              MergeAttest
            </p>
            <nav
              aria-label="Footer"
              className="flex flex-wrap items-center justify-center gap-5 text-[12px] text-[var(--ink-dim)]"
            >
              <Link className="por-link" href="/privacy">
                Privacy
              </Link>
              <Link className="por-link" href="/terms">
                Terms
              </Link>
              <a className="por-link" href="mailto:support@mergeattest.com">
                Contact
              </a>
              <Link className="por-link" href="/design-directions">
                All directions
              </Link>
            </nav>
            <div className="flex flex-col items-center gap-1 sm:items-end">
              <p className="por-mono text-[11px] text-[var(--ink-faint)]">
                design direction preview 01/03 — not the production page
              </p>
              <p className="por-mono text-[11px] text-[var(--ink-faint)]">
                from the{' '}
                <a
                  href="https://eastbase.studio"
                  target="_blank"
                  rel="noopener"
                  className="por-link"
                >
                  Eastbase
                </a>{' '}
                studio
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
