import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Sora } from 'next/font/google'
import { ArrowRight, Plus } from 'lucide-react'
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

// "Blueprint Schematic" landing identity: a deep-navy technical canvas with
// cyan linework, monospaced annotations, and a schematic of the merge-gate
// pipeline. Self-contained and scoped to the `.mkt` class so it does not touch
// the token-driven product UI.
const display = Sora({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-mkt-display',
})

const styles = `
.mkt {
  --bg: #080d18;
  --bg-2: #0b1322;
  --panel: #0e1828;
  --panel-2: #111e30;
  --line: #1c2c44;
  --line-soft: #15233a;
  --text: #d7e3f2;
  --text-dim: #8ba0bd;
  --text-faint: #5a6f8e;
  --cyan: #45d6e6;
  --cyan-dim: #2a9fb0;
  --coral: #ff8a5c;
  --violet: #8aa0ff;
  color: var(--text);
  background: var(--bg);
  font-feature-settings: 'ss01' 1;
}
.mkt-display { font-family: var(--font-mkt-display), system-ui, sans-serif; }
.mkt-mono { font-family: var(--font-geist-mono), ui-monospace, monospace; }
.mkt-bp {
  background-image:
    linear-gradient(to right, rgba(69,214,230,0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(69,214,230,0.05) 1px, transparent 1px),
    linear-gradient(to right, rgba(69,214,230,0.025) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(69,214,230,0.025) 1px, transparent 1px);
  background-size: 120px 120px, 120px 120px, 24px 24px, 24px 24px;
}
.mkt-glow {
  background:
    radial-gradient(620px 420px at 80% 2%, rgba(69,214,230,0.12), transparent 62%),
    radial-gradient(520px 420px at 6% 18%, rgba(138,160,255,0.08), transparent 60%);
}
.mkt a:focus-visible,
.mkt button:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 3px;
  border-radius: 6px;
}
.mkt-link { transition: color 0.18s ease; }
.mkt-link:hover { color: var(--cyan); }
.mkt-cta {
  background: var(--cyan);
  color: #042027;
  transition: box-shadow 0.2s ease, transform 0.15s ease;
}
.mkt-cta:hover { box-shadow: 0 0 0 1px var(--cyan), 0 14px 44px -14px rgba(69,214,230,0.55); transform: translateY(-1px); }
.mkt-ghost { border: 1px solid var(--line); transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease; }
.mkt-ghost:hover { border-color: var(--cyan-dim); color: var(--text); background: var(--panel); }
.mkt-card { position: relative; background: var(--panel); border: 1px solid var(--line); transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease; }
.mkt-card:hover { border-color: var(--cyan-dim); background: var(--panel-2); transform: translateY(-2px); }
/* corner brackets for schematic cards */
.mkt-bracket::before, .mkt-bracket::after {
  content: ''; position: absolute; width: 10px; height: 10px; border-color: var(--cyan-dim);
}
.mkt-bracket::before { top: -1px; left: -1px; border-top: 1px solid; border-left: 1px solid; }
.mkt-bracket::after { bottom: -1px; right: -1px; border-bottom: 1px solid; border-right: 1px solid; }
.mkt-flow { stroke-dasharray: 5 6; animation: mkt-dash 1.1s linear infinite; }
@keyframes mkt-dash { to { stroke-dashoffset: -22; } }
@media (prefers-reduced-motion: reduce) {
  .mkt-flow { animation: none; }
}
`

const numberLabel = (n: number) => String(n).padStart(2, '0')

function Coord({ children }: { children: React.ReactNode }) {
  return (
    <span className="mkt-mono inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--cyan)]">
      <Plus className="size-3 text-[var(--cyan-dim)]" aria-hidden="true" />
      {children}
    </span>
  )
}

function Mark({ size = 28 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg"
      style={{
        width: size,
        height: size,
        background: 'var(--panel-2)',
        border: '1px solid var(--line)',
      }}
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

export default async function Home() {
  const session = await getServerSession()
  if (session) redirect('/dashboard')

  return (
    <div className={`mkt ${display.variable}`}>
      <JsonLd data={createHomeJsonLd()} />
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="mkt-glow relative flex min-h-screen flex-col overflow-hidden">
        <div className="mkt-bp pointer-events-none absolute inset-0 opacity-70" />

        {/* Nav */}
        <header className="sticky top-0 z-50 border-b border-[var(--line-soft)] bg-[var(--bg)]/85 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
            <Link href="/" className="flex items-center gap-2.5">
              <Mark />
              <span className="mkt-display text-[15px] font-semibold tracking-tight">
                MergeAttest
              </span>
            </Link>
            <nav
              aria-label="Primary"
              className="hidden items-center gap-8 text-[13px] text-[var(--text-dim)] md:flex"
            >
              <a className="mkt-link" href="#capabilities">
                Capabilities
              </a>
              <a className="mkt-link" href="#authorship">
                AI authorship
              </a>
              <a className="mkt-link" href="#how-it-works">
                How it works
              </a>
            </nav>
            <div className="flex items-center gap-3 text-[13px]">
              <Link
                className="mkt-link hidden text-[var(--text-dim)] sm:inline"
                href="/sign-in"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="mkt-cta rounded-full px-4 py-2 font-semibold"
              >
                Start free
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {/* Hero */}
          <section className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pt-16 pb-20 sm:px-8 sm:pt-20 lg:grid-cols-[1fr_1.05fr] lg:gap-10">
            <div data-intro>
              <Coord>GitHub-native · free early access</Coord>
              <h1 className="mkt-display mt-6 text-[3rem] leading-[1.04] tracking-[-0.025em] sm:text-[3.9rem] lg:text-[4.4rem]">
                <span className="font-bold">Govern every AI pull request</span>{' '}
                <span className="font-light text-[var(--text-dim)]">
                  before it merges.
                </span>
              </h1>
              <p className="mt-7 max-w-xl text-[15px] leading-relaxed text-[var(--text-dim)] sm:text-base">
                {heroLede}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/sign-up"
                  className="mkt-cta group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
                >
                  Start for free
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </Link>
                <a
                  href="#how-it-works"
                  className="mkt-ghost inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-[var(--text-dim)]"
                >
                  See how it works
                </a>
              </div>
              <p className="mkt-mono mt-6 text-[11px] tracking-wide text-[var(--text-faint)]">
                free plan available · no credit card required
              </p>
            </div>

            <div data-intro>
              <PipelineSchematic />
            </div>
          </section>

          {/* Signals strip */}
          <section className="relative z-10 border-y border-[var(--line-soft)] bg-[var(--bg-2)]/60">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:gap-7 sm:px-8">
              <Coord>signals / diff</Coord>
              <div className="flex flex-wrap gap-2">
                {signals.map((sig) => (
                  <span
                    key={sig}
                    className="mkt-mono rounded border border-[var(--line)] bg-[var(--panel)] px-2.5 py-1 text-[11px] text-[var(--text-dim)]"
                  >
                    {sig}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Stats readout */}
          <section
            aria-label="Key figures"
            className="relative z-10 mx-auto w-full max-w-6xl px-5 py-16 sm:px-8"
          >
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--line)] lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="bg-[var(--panel)] p-6">
                  <div className="mkt-display text-4xl font-bold text-[var(--cyan)]">
                    {s.value}
                  </div>
                  <div className="mt-2 text-[12px] leading-snug text-[var(--text-dim)]">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Capabilities — schematic bento */}
          <section
            id="capabilities"
            className="relative z-10 mx-auto w-full max-w-6xl px-5 py-16 sm:px-8"
          >
            <div data-reveal className="max-w-2xl">
              <Coord>capabilities</Coord>
              <h2 className="mkt-display mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-[2.9rem]">
                The control layer, fully wired
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-dim)]">
                CodeRabbit, Copilot, and Qodo help teams review faster.
                MergeAttest answers the next question: should this AI-assisted
                change be allowed to merge, who accepted the risk, and where is
                the evidence?
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <div
                  key={f.id}
                  data-reveal
                  className="mkt-card mkt-bracket rounded-xl p-7"
                >
                  <div className="flex items-center justify-between">
                    <span className="mkt-mono text-[11px] tracking-[0.16em] text-[var(--cyan)]">
                      M-{numberLabel(i + 1)}
                    </span>
                    <span className="size-1.5 rounded-full bg-[var(--cyan)] shadow-[0_0_10px_2px_rgba(69,214,230,0.5)]" />
                  </div>
                  <h3 className="mkt-display mt-6 text-[1.15rem] font-semibold tracking-tight">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-dim)]">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* AI authorship */}
          <section
            id="authorship"
            className="relative z-10 border-t border-[var(--line-soft)]"
          >
            <div className="mx-auto grid w-full max-w-6xl gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[0.95fr_1.05fr]">
              <div data-reveal>
                <Coord>ai authorship</Coord>
                <h2 className="mkt-display mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-[2.9rem]">
                  Know which agent wrote it —{' '}
                  <span className="text-[var(--cyan)]">and prove it.</span>
                </h2>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--text-dim)]">
                  Coding-agent adoption is near-universal; trust is not.
                  MergeAttest attributes every PR to the agent behind it and
                  turns its track record into audit-ready evidence — the white
                  space no AI reviewer owns.
                </p>
                <div className="mt-8 space-y-2.5">
                  {agents.map((a) => (
                    <div
                      key={a.name}
                      className="mkt-card flex items-center gap-4 rounded-lg px-4 py-3"
                    >
                      <span className="w-28 text-[13px] font-medium text-[var(--text)]">
                        {a.name}
                      </span>
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--line)]">
                        <div
                          className="h-full rounded-full bg-[var(--cyan)]"
                          style={{ width: `${a.confidence}%` }}
                        />
                      </div>
                      <span className="mkt-mono w-10 text-right text-[12px] text-[var(--cyan)]">
                        {a.confidence}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 self-start sm:grid-cols-2">
                {authorship.map((a, i) => (
                  <div
                    key={a.title}
                    data-reveal
                    className="mkt-card mkt-bracket rounded-xl p-6"
                  >
                    <span className="mkt-mono text-[11px] text-[var(--cyan)]">
                      {numberLabel(i + 1)}
                    </span>
                    <h3 className="mkt-display mt-3 text-[1.05rem] font-semibold leading-tight tracking-tight">
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

          {/* How it works — pipeline */}
          <section
            id="how-it-works"
            className="relative z-10 border-t border-[var(--line-soft)]"
          >
            <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
              <div data-reveal className="max-w-2xl">
                <Coord>how it works</Coord>
                <h2 className="mkt-display mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-[2.9rem]">
                  Live in minutes, governed from day one
                </h2>
                <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--text-dim)]">
                  Connect a repository and MergeAttest starts scoring pull
                  requests immediately — no pipeline changes required.
                </p>
              </div>
              <div className="relative mt-14">
                <span
                  aria-hidden="true"
                  className="absolute top-4 right-0 left-0 hidden h-px bg-[var(--line)] lg:block"
                />
                <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                  {steps.map((s, i) => (
                    <div key={s.title} data-reveal className="relative">
                      <span className="mkt-mono relative z-10 flex size-8 items-center justify-center rounded-full border border-[var(--cyan-dim)] bg-[var(--panel)] text-[12px] font-semibold text-[var(--cyan)]">
                        {numberLabel(i + 1)}
                      </span>
                      <h3 className="mkt-display mt-4 text-[1.05rem] font-semibold tracking-tight">
                        {s.title}
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-dim)]">
                        {s.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="relative z-10 border-t border-[var(--line-soft)]">
            <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8">
              <div
                data-reveal
                className="mkt-card relative overflow-hidden rounded-2xl px-8 py-16 text-center"
              >
                <div className="mkt-bp pointer-events-none absolute inset-0 opacity-50" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--cyan)] to-transparent" />
                <div className="relative">
                  <Mark size={48} />
                  <h2 className="mkt-display mt-7 text-4xl font-bold leading-tight tracking-tight sm:text-[3rem]">
                    Ship AI code with confidence
                  </h2>
                  <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-[var(--text-dim)]">
                    Connect your first repository and see risk scores on your
                    open pull requests in minutes.
                  </p>
                  <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                      href="/sign-up"
                      className="mkt-cta group inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold"
                    >
                      Start for free
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      />
                    </Link>
                    <Link
                      href="/sign-in"
                      className="mkt-ghost inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-medium text-[var(--text-dim)]"
                    >
                      Sign in
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-[var(--line-soft)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
            <div className="flex items-center gap-2.5">
              <Mark size={22} />
              <span className="mkt-display text-sm font-semibold tracking-tight">
                MergeAttest
              </span>
            </div>
            <nav
              aria-label="Footer"
              className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-[var(--text-dim)]"
            >
              <a className="mkt-link" href="#capabilities">
                Capabilities
              </a>
              <a className="mkt-link" href="#how-it-works">
                How it works
              </a>
              <Link className="mkt-link" href="/privacy">
                Privacy
              </Link>
              <Link className="mkt-link" href="/terms">
                Terms
              </Link>
              <Link className="mkt-link" href="/sign-in">
                Sign in
              </Link>
            </nav>
            <div className="flex flex-col items-center gap-1 sm:items-end">
              <p className="mkt-mono text-[11px] text-[var(--text-faint)]">
                © {new Date().getFullYear()} MergeAttest
              </p>
              <p className="mkt-mono text-[11px] text-[var(--text-faint)]">
                From the{' '}
                <a
                  href="https://eastbase.studio"
                  target="_blank"
                  rel="noopener"
                  aria-label="Eastbase studio"
                  className="mkt-link text-[var(--cyan)]"
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

function PipelineSchematic() {
  const agentNames = ['claude code', 'copilot', 'cursor']
  return (
    <div className="mkt-card mkt-bracket rounded-2xl p-5 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.8)]">
      <div className="mb-4 flex items-center justify-between">
        <span className="mkt-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
          merge-boundary schematic
        </span>
        <span className="mkt-mono inline-flex items-center gap-1.5 text-[11px] text-[var(--cyan)]">
          <span className="size-1.5 rounded-full bg-[var(--cyan)] shadow-[0_0_8px_2px_rgba(69,214,230,0.5)]" />
          live
        </span>
      </div>

      <svg
        viewBox="0 0 420 300"
        className="w-full"
        fill="none"
        role="img"
        aria-label="Schematic: AI coding agents flow into the MergeAttest gate, which scores risk and routes pull requests to merge or to human review."
      >
        {/* agent nodes */}
        {agentNames.map((name, i) => {
          const y = 50 + i * 80
          return (
            <g key={name}>
              <rect
                x="8"
                y={y - 18}
                width="108"
                height="36"
                rx="8"
                fill="var(--panel-2)"
                stroke="var(--line)"
              />
              <circle cx="26" cy={y} r="3" fill="var(--violet)" />
              <text
                x="40"
                y={y + 4}
                fill="var(--text-dim)"
                style={{ font: '11px var(--font-geist-mono), monospace' }}
              >
                {name}
              </text>
              {/* flow into gate */}
              <path
                className="mkt-flow"
                d={`M116 ${y} C 150 ${y}, 150 150, 184 150`}
                stroke="var(--cyan-dim)"
                strokeWidth="1.5"
              />
            </g>
          )
        })}

        {/* gate node */}
        <rect
          x="184"
          y="104"
          width="92"
          height="92"
          rx="14"
          fill="var(--panel-2)"
          stroke="var(--cyan)"
          strokeWidth="1.5"
        />
        <g transform="translate(214, 128)">
          <path
            d="M2 40 V6 L16 22 L30 6 V40"
            stroke="var(--text)"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 34 L14 42 L26 25"
            stroke="var(--cyan)"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <text
          x="230"
          y="188"
          textAnchor="middle"
          fill="var(--cyan)"
          style={{
            font: '9px var(--font-geist-mono), monospace',
            letterSpacing: '0.12em',
          }}
        >
          SCAN
        </text>

        {/* gate to outputs */}
        <path
          className="mkt-flow"
          d="M276 132 C 320 132, 320 70, 360 70"
          stroke="var(--cyan-dim)"
          strokeWidth="1.5"
        />
        <path
          className="mkt-flow"
          d="M276 168 C 320 168, 320 232, 360 232"
          stroke="var(--cyan-dim)"
          strokeWidth="1.5"
        />

        {/* merge output */}
        <rect
          x="304"
          y="50"
          width="108"
          height="40"
          rx="8"
          fill="var(--panel-2)"
          stroke="var(--line)"
        />
        <text
          x="320"
          y="68"
          fill="var(--text)"
          style={{ font: '600 12px var(--font-mkt-display), sans-serif' }}
        >
          approve
        </text>
        <text
          x="320"
          y="82"
          fill="var(--text-faint)"
          style={{ font: '9px var(--font-geist-mono), monospace' }}
        >
          on the record
        </text>

        {/* review output */}
        <rect
          x="304"
          y="212"
          width="108"
          height="40"
          rx="8"
          fill="var(--panel-2)"
          stroke="var(--coral)"
          strokeOpacity="0.55"
        />
        <text
          x="320"
          y="230"
          fill="var(--text)"
          style={{ font: '600 12px var(--font-mkt-display), sans-serif' }}
        >
          human review
        </text>
        <text
          x="320"
          y="244"
          fill="var(--coral)"
          style={{ font: '9px var(--font-geist-mono), monospace' }}
        >
          risk {samplePr.score}/100
        </text>
      </svg>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--line)] pt-4">
        {[
          { k: 'attributed', v: 'claude-code' },
          { k: 'risk', v: `${samplePr.score} · high` },
          { k: 'verdict', v: 'review' },
        ].map((m) => (
          <div key={m.k}>
            <div className="mkt-mono text-[9px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
              {m.k}
            </div>
            <div className="mkt-mono mt-0.5 text-[12px] text-[var(--text)]">
              {m.v}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
