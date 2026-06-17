import type { CSSProperties } from 'react'
import Link from 'next/link'
import { Instrument_Serif } from 'next/font/google'
import {
  ArrowUpRight,
  Check,
  Fingerprint,
  GitPullRequest,
  ScrollText,
  ShieldHalf,
  TestTube2,
} from 'lucide-react'
import {
  agents,
  authorship,
  features,
  heroLede,
  samplePr,
  signals,
  stats,
  steps,
} from '@/components/marketing/content'

const display = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-display-serif',
})

export const metadata = {
  title: 'MergeAttest — Phosphor Terminal (landing exploration)',
  robots: { index: false, follow: false },
}

// Direction A — "Phosphor Terminal". Near-black instrument panel, a single
// signal-lime accent, editorial serif against monospaced telemetry.
const styles = `
.la1 {
  --ink: #07080a;
  --ink-2: #0c0e12;
  --panel: #101319;
  --panel-2: #14181f;
  --line: #20262f;
  --line-soft: #181d24;
  --text: #e8ebef;
  --text-dim: #9aa3ad;
  --text-faint: #5d6671;
  --signal: #c8f24a;
  --signal-dim: #9bbe3a;
  --alert: #ff6b4a;
  --warn: #ffb454;
  color: var(--text);
  background: var(--ink);
  font-feature-settings: 'ss01' 1, 'cv11' 1;
}
.la1-display { font-family: var(--font-display-serif), Georgia, serif; }
.la1-mono { font-family: var(--font-geist-mono), ui-monospace, monospace; }

/* Atmosphere: fine grid + radial signal glow + top vignette */
.la1-bg {
  background:
    radial-gradient(900px 520px at 78% -8%, rgba(200, 242, 74, 0.10), transparent 60%),
    radial-gradient(700px 600px at 8% 8%, rgba(120, 160, 255, 0.05), transparent 60%);
}
.la1-grid {
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.028) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.028) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(circle at 50% 22%, black, transparent 78%);
}
.la1-noise {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
  opacity: 0.035;
}
.la1-panel {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.018), transparent 40%),
    var(--panel);
  border: 1px solid var(--line);
  border-radius: 14px;
}
.la1-chip {
  border: 1px solid var(--line);
  background: var(--panel-2);
  border-radius: 999px;
}
.la1-tick {
  background-image: repeating-linear-gradient(
    90deg, var(--line-soft) 0 1px, transparent 1px 14px
  );
}
.la1-scan {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg, transparent, rgba(200, 242, 74, 0.16) 48%, transparent
  );
  height: 38%;
  filter: blur(0.5px);
  animation: la1-sweep 4.2s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}
.la1-link { transition: color 0.18s ease; }
.la1-link:hover { color: var(--signal); }
.la1-feature { transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease; }
.la1-feature:hover { border-color: #2c3a1d; background: var(--panel-2); transform: translateY(-2px); }
.la1-cta {
  background: var(--signal);
  color: #0a0c06;
  transition: box-shadow 0.2s ease, transform 0.15s ease;
}
.la1-cta:hover { box-shadow: 0 0 0 1px var(--signal), 0 12px 40px -12px rgba(200, 242, 74, 0.5); transform: translateY(-1px); }
.la1-ghost { border: 1px solid var(--line); transition: border-color 0.2s ease, color 0.2s ease; }
.la1-ghost:hover { border-color: var(--text-faint); color: var(--text); }

@keyframes la1-sweep {
  0% { transform: translateY(-110%); opacity: 0; }
  12% { opacity: 1; }
  88% { opacity: 1; }
  100% { transform: translateY(280%); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .la1-scan { animation: none; opacity: 0; }
}
`

const numberLabel = (n: number) => String(n).padStart(2, '0')

function Bracket({ children }: { children: React.ReactNode }) {
  return (
    <span className="la1-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-faint)]">
      [ {children} ]
    </span>
  )
}

const featureIcons = [
  ShieldHalf,
  Fingerprint,
  TestTube2,
  ScrollText,
  Check,
  GitPullRequest,
]

export default function LandingPhosphor() {
  return (
    <div className={`la1 ${display.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="la1-bg relative min-h-screen overflow-hidden">
        <div className="la1-grid pointer-events-none absolute inset-0" />
        <div className="la1-noise pointer-events-none absolute inset-0" />

        {/* Nav */}
        <header className="relative z-20 mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <Mark />
            <span className="text-[15px] font-medium tracking-tight">
              MergeAttest
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-[13px] text-[var(--text-dim)] md:flex">
            <a className="la1-link" href="#capabilities">
              Capabilities
            </a>
            <a className="la1-link" href="#authorship">
              Authorship
            </a>
            <a className="la1-link" href="#how">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-3 text-[13px]">
            <Link className="la1-link text-[var(--text-dim)]" href="/sign-in">
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="la1-cta rounded-full px-4 py-2 text-[13px] font-semibold"
            >
              Start free
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-14 px-5 pt-14 pb-20 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
          <div>
            <p
              data-intro
              style={introStyle(0)}
              className="la1-chip inline-flex items-center gap-2 px-3 py-1.5 text-[11px] tracking-wide text-[var(--text-dim)]"
            >
              <span className="size-1.5 rounded-full bg-[var(--signal)] shadow-[0_0_10px_2px_rgba(200,242,74,0.6)]" />
              <span className="la1-mono uppercase tracking-[0.18em]">
                GitHub-native · free early access
              </span>
            </p>

            <h1
              data-intro
              style={introStyle(1)}
              className="la1-display mt-7 text-[3.25rem] leading-[0.98] tracking-[-0.01em] text-[var(--text)] sm:text-[4.25rem] lg:text-[4.75rem]"
            >
              Govern every{' '}
              <span className="text-[var(--signal)]">AI pull request</span>{' '}
              <span className="italic text-[var(--text-dim)]">
                before it merges.
              </span>
            </h1>

            <p
              data-intro
              style={introStyle(2)}
              className="mt-7 max-w-xl text-[15px] leading-relaxed text-[var(--text-dim)] sm:text-base"
            >
              {heroLede}
            </p>

            <div
              data-intro
              style={introStyle(3)}
              className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Link
                href="/sign-up"
                className="la1-cta group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                Start for free
                <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <a
                href="#how"
                className="la1-ghost inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-[var(--text-dim)]"
              >
                See how it works
              </a>
            </div>

            <div
              data-intro
              style={introStyle(4)}
              className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3"
            >
              {stats.slice(0, 3).map((s) => (
                <div key={s.label}>
                  <div className="la1-display text-3xl text-[var(--text)]">
                    {s.value}
                  </div>
                  <div className="la1-mono mt-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instrument panel */}
          <div data-intro style={introStyle(3)} className="relative">
            <InstrumentPanel />
          </div>
        </section>

        {/* Signals ticker */}
        <section className="relative z-10 border-y border-[var(--line-soft)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:gap-7 sm:px-8">
            <Bracket>signals / diff</Bracket>
            <div className="flex flex-wrap gap-2">
              {signals.map((sig) => (
                <span
                  key={sig}
                  className="la1-mono rounded-md border border-[var(--line-soft)] bg-[var(--ink-2)] px-2.5 py-1 text-[11px] text-[var(--text-dim)]"
                >
                  {sig}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section
          id="capabilities"
          className="relative z-10 mx-auto w-full max-w-6xl px-5 py-24 sm:px-8"
        >
          <div data-reveal className="max-w-2xl">
            <Bracket>capabilities</Bracket>
            <h2 className="la1-display mt-5 text-4xl leading-tight tracking-tight sm:text-5xl">
              An instrument for the merge boundary
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-dim)]">
              Comments speed up review. Governance needs the full record: risk,
              tests, policies, reviewers, approvals, and what changed after the
              decision.
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = featureIcons[i] ?? ShieldHalf
              return (
                <div
                  key={f.id}
                  data-reveal
                  className="la1-feature flex flex-col bg-[var(--panel)] p-7"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--ink-2)] text-[var(--signal)]">
                      <Icon className="size-[18px]" aria-hidden="true" />
                    </span>
                    <span className="la1-mono text-[11px] text-[var(--text-faint)]">
                      {numberLabel(i + 1)}
                    </span>
                  </div>
                  <h3 className="mt-5 text-[15px] font-medium tracking-tight text-[var(--text)]">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-dim)]">
                    {f.description}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Authorship */}
        <section
          id="authorship"
          className="relative z-10 border-t border-[var(--line-soft)]"
        >
          <div className="mx-auto grid w-full max-w-6xl gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div data-reveal>
              <Bracket>ai authorship</Bracket>
              <h2 className="la1-display mt-5 text-4xl leading-tight tracking-tight sm:text-5xl">
                Know which agent wrote it — and{' '}
                <span className="italic text-[var(--signal)]">prove it.</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--text-dim)]">
                Coding-agent adoption is near-universal; trust is not.
                MergeAttest attributes every PR to the agent behind it and turns
                its track record into audit-ready evidence.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {agents.map((a) => (
                  <span
                    key={a.name}
                    className="la1-chip inline-flex items-center gap-2 px-3 py-1.5 text-[12px]"
                  >
                    <span className="size-1.5 rounded-full bg-[var(--signal)]" />
                    {a.name}
                    <span className="la1-mono text-[11px] text-[var(--text-faint)]">
                      {a.confidence}%
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
              {authorship.map((a, i) => (
                <div
                  key={a.title}
                  data-reveal
                  className="bg-[var(--panel)] p-7"
                >
                  <span className="la1-mono text-[11px] text-[var(--text-faint)]">
                    {numberLabel(i + 1)}
                  </span>
                  <h3 className="mt-3 text-[15px] font-medium tracking-tight">
                    {a.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-dim)]">
                    {a.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how"
          className="relative z-10 border-t border-[var(--line-soft)]"
        >
          <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8">
            <div data-reveal className="max-w-2xl">
              <Bracket>how it works</Bracket>
              <h2 className="la1-display mt-5 text-4xl leading-tight tracking-tight sm:text-5xl">
                Live in minutes, governed from day one
              </h2>
            </div>
            <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <div key={s.title} data-reveal>
                  <div className="la1-tick h-px w-full" />
                  <div className="la1-display mt-5 text-5xl text-[var(--signal-dim)]">
                    {numberLabel(i + 1)}
                  </div>
                  <h3 className="mt-3 text-[15px] font-medium tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-dim)]">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative z-10 border-t border-[var(--line-soft)]">
          <div className="mx-auto w-full max-w-6xl px-5 py-28 text-center sm:px-8">
            <div
              data-reveal
              className="la1-panel relative mx-auto max-w-3xl overflow-hidden px-8 py-16"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--signal)] to-transparent opacity-70" />
              <Mark className="mx-auto" big />
              <h2 className="la1-display mt-7 text-4xl leading-tight tracking-tight sm:text-5xl">
                Ship AI code with confidence
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-[var(--text-dim)]">
                Connect your first repository and see risk scores on your open
                pull requests in minutes.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/sign-up"
                  className="la1-cta group inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold"
                >
                  Start for free
                  <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <Link
                  href="/sign-in"
                  className="la1-ghost inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-medium text-[var(--text-dim)]"
                >
                  Sign in
                </Link>
              </div>
              <p className="la1-mono mt-6 text-[11px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
                free plan available · no credit card required
              </p>
            </div>
          </div>
        </section>

        <footer className="relative z-10 border-t border-[var(--line-soft)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
            <div className="flex items-center gap-2.5">
              <Mark />
              <span className="text-sm font-medium tracking-tight">
                MergeAttest
              </span>
            </div>
            <p className="la1-mono text-[11px] text-[var(--text-faint)]">
              landing exploration · direction A — phosphor terminal
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

function introStyle(index: number): CSSProperties {
  return { '--intro-index': index } as CSSProperties
}

function Mark({
  className = '',
  big = false,
}: {
  className?: string
  big?: boolean
}) {
  const size = big ? 40 : 28
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg ${className}`}
      style={{
        width: size,
        height: size,
        background: 'var(--panel-2)',
        border: '1px solid var(--line)',
      }}
    >
      <svg
        viewBox="0 0 32 32"
        width={big ? 22 : 16}
        height={big ? 22 : 16}
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
          stroke="var(--signal)"
          strokeWidth="3"
        />
      </svg>
    </span>
  )
}

function InstrumentPanel() {
  return (
    <div className="la1-panel relative overflow-hidden">
      {/* header */}
      <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-4 py-3">
        <span className="size-2 rounded-full bg-[var(--signal)] shadow-[0_0_8px_2px_rgba(200,242,74,0.5)]" />
        <span className="la1-mono text-[12px] text-[var(--text-dim)]">
          {samplePr.repo}
        </span>
        <span className="la1-mono ml-auto text-[11px] uppercase tracking-[0.16em] text-[var(--signal)]">
          scanning
        </span>
      </div>

      {/* body with scanline */}
      <div className="relative">
        <div className="la1-scan pointer-events-none" />
        <div className="relative p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-[#3a2410] bg-[#1c1408] px-2 py-0.5 text-[11px] font-medium text-[var(--warn)]">
                  High risk
                </span>
                <span className="la1-mono text-[11px] text-[var(--text-faint)]">
                  {samplePr.id}
                </span>
              </div>
              <h3 className="mt-2.5 text-[15px] font-medium tracking-tight text-[var(--text)]">
                {samplePr.title}
              </h3>
              <p className="la1-mono mt-1 text-[11px] text-[var(--text-faint)]">
                agent:{samplePr.agent} · {samplePr.diff}
              </p>
            </div>
            <ScoreDial score={samplePr.score} />
          </div>

          <div className="mt-5 space-y-2">
            {samplePr.findings.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2.5 rounded-lg border border-[var(--line-soft)] bg-[var(--ink-2)] px-3 py-2"
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    background:
                      f.tone === 'danger' ? 'var(--alert)' : 'var(--warn)',
                  }}
                />
                <span className="text-[12px] text-[var(--text-dim)]">
                  {f.label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg border border-[var(--line-soft)] bg-[var(--ink-2)] px-3 py-2.5">
            <span className="la1-mono text-[11px] text-[var(--text-faint)]">
              approval required · 2 reviewers
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--signal)] px-2.5 py-1 text-[11px] font-semibold text-[#0a0c06]">
              <Check className="size-3" aria-hidden="true" />
              Awaiting review
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScoreDial({ score }: { score: number }) {
  const C = 2 * Math.PI * 26
  const offset = C * (1 - score / 100)
  return (
    <div className="relative grid size-[68px] shrink-0 place-items-center">
      <svg viewBox="0 0 64 64" className="size-[68px] -rotate-90">
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          stroke="var(--line)"
          strokeWidth="5"
        />
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          stroke="var(--warn)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-semibold tabular-nums text-[var(--text)]">
          {score}
        </span>
        <span className="la1-mono text-[9px] uppercase tracking-wider text-[var(--text-faint)]">
          / 100
        </span>
      </div>
    </div>
  )
}
