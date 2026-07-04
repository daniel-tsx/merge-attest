import Link from 'next/link'
import {
  agents,
  authorship,
  faqs,
  signals,
  steps,
} from '@/components/marketing/content'
import { createPageMetadata } from '@/lib/seo/metadata'

export const metadata = createPageMetadata({
  title: 'Design direction — Approach Control',
  description:
    'Landing page design exploration: MergeAttest as approach control for the merge boundary. Preview only.',
  path: '/design-directions/approach-control',
  noIndex: true,
})

// "Approach Control" direction: a live operations console. The hero is a
// flight-strip merge board built from the product's real queue. Scoped to
// `.apc`; values are the app's dark-theme tokens verbatim, so the landing and
// the signed-in product read as the same machine. Geist only — no new fonts.
const styles = `
.apc {
  --bg: oklch(0.175 0.025 255);
  --panel: oklch(0.215 0.028 255);
  --panel-2: oklch(0.255 0.03 255);
  --line: oklch(0.32 0.036 255);
  --line-strong: oklch(0.44 0.044 255);
  --text: oklch(0.93 0.016 250);
  --dim: oklch(0.7 0.03 250);
  --faint: oklch(0.58 0.034 252);
  --cyan: oklch(0.72 0.12 200);
  --cyan-ink: oklch(0.19 0.03 245);
  --cyan-soft: oklch(0.33 0.07 215);
  --hold: oklch(0.74 0.14 55);
  --hold-soft: oklch(0.3 0.06 50);
  --breach: oklch(0.66 0.18 25);
  --clear: oklch(0.7 0.14 160);
  --warn: oklch(0.79 0.12 85);
  background: var(--bg);
  color: var(--text);
}
.apc-mono { font-family: var(--font-geist-mono), ui-monospace, monospace; }
.apc-num { font-variant-numeric: tabular-nums; }
.apc a:focus-visible,
.apc button:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 3px;
  border-radius: 4px;
}
.apc-panel { background: var(--panel); border: 1px solid var(--line); }
.apc-link { transition: color 0.18s ease; }
.apc-link:hover { color: var(--cyan); }
.apc-cta {
  background: var(--cyan);
  color: var(--cyan-ink);
  transition: filter 0.18s ease, box-shadow 0.18s ease;
}
.apc-cta:hover {
  filter: brightness(1.08);
  box-shadow: 0 12px 36px -14px oklch(0.72 0.12 200 / 0.5);
}
.apc-ghost { border: 1px solid var(--line); transition: border-color 0.18s ease, color 0.18s ease; }
.apc-ghost:hover { border-color: var(--line-strong); color: var(--text); }
.apc-strip { transition: border-color 0.18s ease, background 0.18s ease; }
.apc-strip:hover { border-color: var(--line-strong); background: var(--panel-2); }
@media (prefers-reduced-motion: no-preference) {
  /* Signature moment: strips settle into the rack once on load. */
  .apc-settle {
    animation: apc-settle 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: calc(var(--strip-index, 0) * 110ms + 0.15s);
  }
  /* The single permitted loop: the live status pulse. */
  .apc-pulse { animation: apc-pulse 2.2s ease-in-out infinite; }
}
@keyframes apc-settle {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes apc-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
`

const two = (n: number) => String(n).padStart(2, '0')

type Verdict = 'clear' | 'hold' | 'scoring'

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

const incidentLog = [
  { t: '09:02', line: 'agent opens acme/web #479 (+96 −12)' },
  { t: '09:11', line: 'agent opens acme/api-gateway #481 (+212 −40)' },
  { t: '09:14', line: 'agent opens acme/api-gateway #482 (+218 −34)' },
  { t: '09:26', line: 'agent opens acme/infra #483 (+61 −58)' },
  { t: '09:38', line: '#479 merged — reviewer approved in 40 seconds' },
  { t: '09:41', line: '#482 merged — no human review recorded' },
  {
    t: '11:03',
    line: 'payments incident opened. first question: who wrote #482?',
  },
]

const signalReadout: Record<(typeof signals)[number], string> = {
  'diff size': '+218 −34',
  'sensitive paths': '2 hits',
  'test coverage': '2 gaps',
  'dependency changes': 'none',
  'migration files': 'none',
  'secret patterns': 'none',
  'API surface': '1 change',
  'lockfile drift': 'none',
}

const phases = ['contact', 'identify', 'score', 'clear / hold'] as const

const securityReadout = [
  {
    k: 'pipeline changes',
    v: 'none required',
    d: 'Installs as a GitHub App; reads pull requests through the GitHub API.',
  },
  {
    k: 'source storage',
    v: 'metadata only',
    d: 'Changed paths, risk signals, approvals, audit events. Full source files are never stored.',
  },
  {
    k: 'model execution',
    v: 'off by default',
    d: 'Scoring and attribution are rule-based. Nothing reaches a model provider unless you enable it with your own key.',
  },
  {
    k: 'credentials',
    v: 'encrypted',
    d: 'Customer-provided keys are encrypted before storage. Disconnect the app at any time.',
  },
]

function Mark({ size = 28 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-md border border-[var(--line)] bg-[var(--panel-2)]"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 32 32"
        width={size * 0.58}
        height={size * 0.58}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path
          d="M6.5 25 V7.5 L16 18.5 L25.5 7.5 V25"
          stroke="var(--text)"
          strokeWidth="3"
        />
        <path
          d="M10 21 L14.3 25 L23 15.25"
          stroke="var(--cyan)"
          strokeWidth="3"
        />
      </svg>
    </span>
  )
}

function PanelHeader({
  label,
  right,
}: {
  label: string
  right?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-2.5">
      <p className="apc-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">
        {label}
      </p>
      {right}
    </div>
  )
}

function VerdictChip({ verdict }: { verdict: Verdict }) {
  if (verdict === 'clear')
    return (
      <span className="apc-mono inline-flex items-center gap-1.5 rounded-sm border border-[var(--line)] px-2 py-0.5 text-[10px] tracking-[0.14em] text-[var(--clear)] uppercase">
        clear
      </span>
    )
  if (verdict === 'hold')
    return (
      <span className="apc-mono inline-flex items-center gap-1.5 rounded-sm border border-[var(--hold)] bg-[var(--hold-soft)] px-2 py-0.5 text-[10px] tracking-[0.14em] text-[var(--hold)] uppercase">
        hold
      </span>
    )
  return (
    <span className="apc-mono inline-flex items-center gap-1.5 rounded-sm border border-[var(--line)] px-2 py-0.5 text-[10px] tracking-[0.14em] text-[var(--dim)] uppercase">
      scoring
    </span>
  )
}

export default function ApproachControl() {
  return (
    <div className="apc">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="flex min-h-screen flex-col">
        {/* Status-bar nav */}
        <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur">
          <div className="border-b border-[var(--line)]/60">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-1.5 sm:px-8">
              <p className="apc-mono text-[10px] tracking-[0.2em] text-[var(--faint)] uppercase">
                merge boundary · monitored
              </p>
              <p className="apc-mono hidden items-center gap-2 text-[10px] tracking-[0.2em] text-[var(--faint)] uppercase sm:flex">
                <span
                  aria-hidden="true"
                  className="apc-pulse size-1.5 rounded-full bg-[var(--clear)]"
                />
                systems nominal
              </p>
            </div>
          </div>
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
            <Link href="/" className="flex items-center gap-2.5">
              <Mark />
              <span className="text-[15px] font-semibold tracking-tight">
                MergeAttest
              </span>
            </Link>
            <nav
              aria-label="Primary"
              className="apc-mono hidden items-center gap-7 text-[11px] tracking-[0.12em] text-[var(--dim)] uppercase md:flex"
            >
              <a className="apc-link" href="#board">
                Board
              </a>
              <a className="apc-link" href="#signals">
                Signals
              </a>
              <a className="apc-link" href="#sequence">
                Sequence
              </a>
              <a className="apc-link" href="#faq">
                FAQ
              </a>
            </nav>
            <div className="flex items-center gap-3 text-[13px]">
              <Link
                className="apc-link hidden text-[var(--dim)] sm:inline"
                href="/sign-in"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="apc-cta rounded-md px-4 py-2 text-[13px] font-semibold"
              >
                Start free
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {/* Hero: headline + merge board */}
          <section className="mx-auto w-full max-w-6xl px-5 pt-14 pb-16 sm:px-8 sm:pt-18">
            <div data-intro className="max-w-3xl">
              <p className="apc-mono text-[11px] tracking-[0.2em] text-[var(--cyan)] uppercase">
                approach control for the merge boundary
              </p>
              <h1 className="mt-5 text-[2.6rem] leading-[1.05] font-semibold tracking-tight text-balance sm:text-[3.4rem]">
                Agents are landing code faster than you can review it.
              </h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[var(--dim)] sm:text-base">
                MergeAttest sequences the traffic: every AI-assisted pull
                request is identified, scored deterministically, and cleared or
                held for human sign-off — with the whole decision on the record.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/sign-up"
                  className="apc-cta inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold"
                >
                  Take the board — free
                </Link>
                <a
                  href="#sequence"
                  className="apc-ghost inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium text-[var(--dim)]"
                >
                  See the sequence
                </a>
              </div>
            </div>

            {/* Merge board */}
            <div id="board" className="apc-panel mt-12 rounded-lg">
              <PanelHeader
                label="merge board · inbound pull requests"
                right={
                  <span className="apc-mono flex items-center gap-2 text-[10px] tracking-[0.16em] text-[var(--cyan)] uppercase">
                    <span
                      aria-hidden="true"
                      className="apc-pulse size-1.5 rounded-full bg-[var(--cyan)]"
                    />
                    sample traffic
                  </span>
                }
              />
              <div role="list" aria-label="Sample merge queue" className="p-2">
                {board.map((pr, i) => (
                  <div
                    key={pr.id}
                    role="listitem"
                    style={{ ['--strip-index' as string]: i }}
                    className={`apc-strip apc-settle mb-1.5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-md border p-3.5 last:mb-0 sm:grid-cols-[3.2rem_1.4fr_0.7fr_0.7fr_6.5rem_5rem] sm:items-center ${
                      pr.verdict === 'hold'
                        ? 'border-[var(--hold)]/50 bg-[var(--hold-soft)]/40'
                        : 'border-[var(--line)] bg-[var(--panel)]'
                    }`}
                  >
                    <span className="apc-mono apc-num text-[12px] text-[var(--faint)]">
                      {pr.id}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-medium">
                        {pr.title}
                      </span>
                      <span className="apc-mono mt-0.5 block text-[10.5px] text-[var(--faint)] sm:hidden">
                        {pr.repo} · {pr.agent} · {pr.note}
                      </span>
                    </span>
                    <span className="apc-mono hidden truncate text-[11.5px] text-[var(--dim)] sm:block">
                      {pr.repo}
                    </span>
                    <span className="apc-mono hidden text-[11.5px] text-[var(--dim)] sm:block">
                      {pr.agent}
                    </span>
                    <span className="col-start-1 flex items-center gap-2 sm:col-start-auto">
                      <span className="apc-mono apc-num w-7 text-[12px] font-medium">
                        {pr.score === null ? '——' : pr.score}
                      </span>
                      <span
                        aria-hidden="true"
                        className="block h-1 w-14 overflow-hidden rounded-full bg-[var(--line)]"
                      >
                        {pr.score !== null && (
                          <span
                            className="block h-full rounded-full"
                            style={{
                              width: `${pr.score}%`,
                              background:
                                pr.score >= 60
                                  ? 'var(--hold)'
                                  : pr.score >= 35
                                    ? 'var(--warn)'
                                    : 'var(--clear)',
                            }}
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
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] px-4 py-2.5">
                <p className="apc-mono text-[10.5px] text-[var(--faint)]">
                  holds require recorded human sign-off before merge
                </p>
                <p className="apc-mono apc-num text-[10.5px] text-[var(--faint)]">
                  2 held · 2 cleared · 1 scoring
                </p>
              </div>
            </div>
          </section>

          {/* Problem framing: incident log */}
          <section className="border-t border-[var(--line)]">
            <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
              <div data-reveal>
                <p className="apc-mono text-[11px] tracking-[0.2em] text-[var(--cyan)] uppercase">
                  why a tower exists
                </p>
                <h2 className="mt-4 text-[1.9rem] leading-tight font-semibold tracking-tight sm:text-[2.4rem]">
                  A morning without sequencing.
                </h2>
                <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-[var(--dim)]">
                  None of these events is unusual. Together they are how an
                  unattributed, unreviewed AI change ends up in production — and
                  why the first hour of the incident is spent on archaeology
                  instead of a fix.
                </p>
                <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-[var(--dim)]">
                  With MergeAttest on the boundary, #482 is held at 09:14 with
                  its risk spelled out, and the 11:03 question answers itself:
                  agent, evidence, approver, timestamp.
                </p>
              </div>
              <div data-reveal className="apc-panel self-start rounded-lg">
                <PanelHeader label="reconstructed timeline · composite example" />
                <ol className="p-4">
                  {incidentLog.map((entry, i) => (
                    <li
                      key={entry.t + entry.line}
                      className={`flex gap-4 py-2 ${
                        i >= 5 ? 'text-[var(--hold)]' : 'text-[var(--dim)]'
                      }`}
                    >
                      <span className="apc-mono apc-num shrink-0 text-[12px] text-[var(--faint)]">
                        {entry.t}
                      </span>
                      <span className="apc-mono text-[12px] leading-relaxed">
                        {entry.line}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          {/* Instrument cluster: the 8 signals */}
          <section id="signals" className="border-t border-[var(--line)]">
            <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
              <div data-reveal className="max-w-2xl">
                <p className="apc-mono text-[11px] tracking-[0.2em] text-[var(--cyan)] uppercase">
                  instrumentation
                </p>
                <h2 className="mt-4 text-[1.9rem] leading-tight font-semibold tracking-tight sm:text-[2.4rem]">
                  Eight signals on every diff. No model guesswork.
                </h2>
                <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-[var(--dim)]">
                  Scoring is deterministic and reproducible — the same diff
                  always reads the same. Readout below shows PR #482.
                </p>
              </div>
              <div
                data-reveal
                className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--line)] sm:grid-cols-4"
              >
                {signals.map((sig, i) => (
                  <div key={sig} className="bg-[var(--panel)] p-4 sm:p-5">
                    <p className="apc-mono apc-num text-[10px] text-[var(--faint)]">
                      S{two(i + 1)}
                    </p>
                    <p className="mt-2 text-[12.5px] font-medium capitalize">
                      {sig}
                    </p>
                    <p
                      className={`apc-mono apc-num mt-1.5 text-[12px] ${
                        signalReadout[sig] === 'none' ||
                        signalReadout[sig] === 'none detected'
                          ? 'text-[var(--faint)]'
                          : 'text-[var(--cyan)]'
                      }`}
                    >
                      {signalReadout[sig]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Sequencing ladder */}
          <section id="sequence" className="border-t border-[var(--line)]">
            <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
              <div data-reveal className="max-w-2xl">
                <p className="apc-mono text-[11px] tracking-[0.2em] text-[var(--cyan)] uppercase">
                  the sequence
                </p>
                <h2 className="mt-4 text-[1.9rem] leading-tight font-semibold tracking-tight sm:text-[2.4rem]">
                  Contact to clearance, in four phases.
                </h2>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {steps.map((s, i) => (
                  <div
                    key={s.title}
                    data-reveal
                    className="apc-panel rounded-lg"
                  >
                    <PanelHeader label={`phase ${two(i + 1)} · ${phases[i]}`} />
                    <div className="p-4">
                      <h3 className="text-[14.5px] font-semibold">{s.title}</h3>
                      <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--dim)]">
                        {s.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Per-agent scorecard */}
          <section className="border-t border-[var(--line)]">
            <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
              <div data-reveal>
                <p className="apc-mono text-[11px] tracking-[0.2em] text-[var(--cyan)] uppercase">
                  who&rsquo;s flying
                </p>
                <h2 className="mt-4 text-[1.9rem] leading-tight font-semibold tracking-tight sm:text-[2.4rem]">
                  Every agent, identified and scored over time.
                </h2>
                <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-[var(--dim)]">
                  Attribution works from commit trailers, bot accounts, emails,
                  and branch prefixes — each with a confidence score and the
                  evidence behind it. Trust scorecards accumulate per agent:
                  high-risk rate, test gaps, rule hits, merges without sign-off.
                </p>
                <ul className="mt-6 space-y-3">
                  {authorship.slice(0, 3).map((a) => (
                    <li key={a.title} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[var(--cyan)]"
                      />
                      <p className="text-[13px] leading-relaxed text-[var(--dim)]">
                        <span className="font-medium text-[var(--text)]">
                          {a.title}.
                        </span>{' '}
                        {a.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
              <div data-reveal className="apc-panel self-start rounded-lg">
                <PanelHeader label="attribution confidence · sample" />
                <div className="p-4">
                  {agents.map((a, i) => (
                    <div
                      key={a.name}
                      className="grid grid-cols-[2rem_6.5rem_1fr_3rem] items-center gap-3 border-b border-[var(--line)] py-3 last:border-b-0"
                    >
                      <span className="apc-mono apc-num text-[11px] text-[var(--faint)]">
                        {two(i + 1)}
                      </span>
                      <span
                        className={`text-[13px] font-medium ${i === 0 ? 'text-[var(--cyan)]' : ''}`}
                      >
                        {a.name}
                      </span>
                      <span
                        aria-hidden="true"
                        className="block h-1 w-full overflow-hidden rounded-full bg-[var(--line)]"
                      >
                        <span
                          className={`block h-full rounded-full ${i === 0 ? 'bg-[var(--cyan)]' : 'bg-[var(--line-strong)]'}`}
                          style={{ width: `${a.confidence}%` }}
                        />
                      </span>
                      <span className="apc-mono apc-num text-right text-[12px] text-[var(--dim)]">
                        {a.confidence}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Evidence export + security readout */}
          <section className="border-t border-[var(--line)]">
            <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-14">
              <div data-reveal>
                <p className="apc-mono text-[11px] tracking-[0.2em] text-[var(--cyan)] uppercase">
                  the paper trail
                </p>
                <h2 className="mt-4 text-[1.9rem] leading-tight font-semibold tracking-tight sm:text-[2.4rem]">
                  Compliance gets a packet, not a promise.
                </h2>
                <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-[var(--dim)]">
                  Export the AI-authorship ledger, approval records, and
                  per-agent scorecards as the evidence bundle EU AI Act
                  human-oversight and SOC2 reviews ask for — the record, not a
                  certification.
                </p>
                <div className="apc-panel mt-6 max-w-md rounded-lg">
                  <PanelHeader label="evidence packet" />
                  <ul className="apc-mono p-4 text-[12px] leading-7 text-[var(--dim)]">
                    <li>attestations.csv</li>
                    <li>approvals.json</li>
                    <li>agent-scorecards.csv</li>
                    <li>audit-log.json</li>
                  </ul>
                </div>
              </div>
              <div data-reveal>
                <p className="apc-mono text-[11px] tracking-[0.2em] text-[var(--cyan)] uppercase">
                  security readout
                </p>
                <h2 className="mt-4 text-[1.9rem] leading-tight font-semibold tracking-tight sm:text-[2.4rem]">
                  What it touches. What it never does.
                </h2>
                <dl className="mt-6 space-y-4">
                  {securityReadout.map((row) => (
                    <div
                      key={row.k}
                      className="border-t border-[var(--line)] pt-3.5"
                    >
                      <dt className="flex items-baseline justify-between gap-4">
                        <span className="apc-mono text-[11px] tracking-[0.14em] text-[var(--faint)] uppercase">
                          {row.k}
                        </span>
                        <span className="apc-mono text-[12px] text-[var(--clear)]">
                          {row.v}
                        </span>
                      </dt>
                      <dd className="mt-1.5 text-[13px] leading-relaxed text-[var(--dim)]">
                        {row.d}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="border-t border-[var(--line)]">
            <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
              <div data-reveal className="max-w-2xl">
                <p className="apc-mono text-[11px] tracking-[0.2em] text-[var(--cyan)] uppercase">
                  faq
                </p>
                <h2 className="mt-4 text-[1.9rem] leading-tight font-semibold tracking-tight sm:text-[2.4rem]">
                  Before you take the board.
                </h2>
              </div>
              <dl className="mt-10 grid gap-4 lg:grid-cols-2">
                {faqs.slice(0, 6).map((item) => (
                  <div
                    key={item.q}
                    data-reveal
                    className="apc-panel rounded-lg p-5"
                  >
                    <dt className="text-[14px] leading-snug font-semibold">
                      {item.q}
                    </dt>
                    <dd className="mt-2 text-[13px] leading-relaxed text-[var(--dim)]">
                      {item.a}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="apc-mono mt-6 text-[11.5px] text-[var(--faint)]">
                more questions →{' '}
                <a
                  className="apc-link text-[var(--cyan)]"
                  href="mailto:support@mergeattest.com"
                >
                  support@mergeattest.com
                </a>
              </p>
            </div>
          </section>

          {/* Final CTA strip */}
          <section className="border-t border-[var(--line)]">
            <div className="mx-auto w-full max-w-6xl px-5 py-18 sm:px-8">
              <div
                data-reveal
                className="apc-panel flex flex-col items-start justify-between gap-6 rounded-lg p-7 sm:p-9 lg:flex-row lg:items-center"
              >
                <div>
                  <h2 className="text-[1.7rem] leading-tight font-semibold tracking-tight sm:text-[2.1rem]">
                    Take the merge boundary.
                  </h2>
                  <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-[var(--dim)]">
                    Connect a repository and the board fills with your own
                    traffic in minutes. Free during early access — 3
                    repositories, 200 PR checks a month.
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                  <Link
                    href="/sign-up"
                    className="apc-cta inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold"
                  >
                    Start free
                  </Link>
                  <Link
                    href="/sign-in"
                    className="apc-ghost inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium text-[var(--dim)]"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-[var(--line)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-5 py-7 sm:flex-row sm:px-8">
            <div className="flex items-center gap-2.5">
              <Mark size={22} />
              <span className="text-sm font-semibold tracking-tight">
                MergeAttest
              </span>
            </div>
            <nav
              aria-label="Footer"
              className="flex flex-wrap items-center justify-center gap-5 text-[12px] text-[var(--dim)]"
            >
              <Link className="apc-link" href="/privacy">
                Privacy
              </Link>
              <Link className="apc-link" href="/terms">
                Terms
              </Link>
              <a className="apc-link" href="mailto:support@mergeattest.com">
                Contact
              </a>
              <Link className="apc-link" href="/design-directions">
                All directions
              </Link>
            </nav>
            <div className="flex flex-col items-center gap-1 sm:items-end">
              <p className="apc-mono text-[11px] text-[var(--faint)]">
                design direction preview 02/03 — not the production page
              </p>
              <p className="apc-mono text-[11px] text-[var(--faint)]">
                from the{' '}
                <a
                  href="https://eastbase.studio"
                  target="_blank"
                  rel="noopener"
                  className="apc-link text-[var(--cyan)]"
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
