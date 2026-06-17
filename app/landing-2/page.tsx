import Link from 'next/link'
import { Fraunces } from 'next/font/google'
import { ArrowRight } from 'lucide-react'
import {
  agents,
  authorship,
  features,
  heroLede,
  samplePr,
  stats,
  steps,
} from '@/components/marketing/content'

const display = Fraunces({
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-display-fraunces',
})

export const metadata = {
  title: 'MergeAttest — Audit Ledger (landing exploration)',
  robots: { index: false, follow: false },
}

// Direction B — "Audit Ledger". Light ivory paper, an editorial Fraunces
// serif, hairline rules, oversized numerals, an affidavit-style record.
const styles = `
.la2 {
  --paper: #f5f1e8;
  --paper-2: #faf7f0;
  --card: #fffdf8;
  --ink: #1c1813;
  --ink-2: #463f34;
  --ink-dim: #837a6b;
  --ink-faint: #a89e8c;
  --rule: #ddd5c5;
  --rule-strong: #c6bca7;
  --oxblood: #9a3324;
  --oxblood-deep: #7a2519;
  --forest: #2f5d49;
  --gold: #9a6b1f;
  color: var(--ink);
  background: var(--paper);
  font-feature-settings: 'ss01' 1;
}
.la2-display { font-family: var(--font-display-fraunces), Georgia, 'Times New Roman', serif; font-optical-sizing: auto; }
.la2-mono { font-family: var(--font-geist-mono), ui-monospace, monospace; }
.la2-paper {
  background-image:
    radial-gradient(circle at 1px 1px, rgba(28,24,19,0.05) 1px, transparent 0);
  background-size: 22px 22px;
}
.la2-link { transition: color 0.18s ease; }
.la2-link:hover { color: var(--oxblood); }
.la2-cta {
  background: var(--ink);
  color: var(--paper-2);
  transition: background 0.2s ease, transform 0.15s ease;
}
.la2-cta:hover { background: var(--oxblood); transform: translateY(-1px); }
.la2-ghost { border: 1px solid var(--rule-strong); transition: border-color 0.2s ease, background 0.2s ease; }
.la2-ghost:hover { border-color: var(--ink); background: var(--paper-2); }
.la2-feature { transition: background 0.2s ease; }
.la2-feature:hover { background: var(--paper-2); }
.la2-seal {
  background: radial-gradient(circle, var(--card) 60%, transparent 61%),
              repeating-conic-gradient(var(--oxblood) 0deg 10deg, transparent 10deg 20deg);
}
`

const numberLabel = (n: number) => String(n).padStart(2, '0')

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="la2-mono text-[11px] uppercase tracking-[0.28em] text-[var(--oxblood)]">
      {children}
    </span>
  )
}

function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d="M6.5 25 V7.5 L16 18.5 L25.5 7.5 V25"
        stroke="var(--ink)"
        strokeWidth="2.6"
      />
      <path
        d="M10 21 L14.3 25 L23 15.25"
        stroke="var(--oxblood)"
        strokeWidth="2.6"
      />
    </svg>
  )
}

export default function LandingLedger() {
  return (
    <div className={`la2 ${display.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="la2-paper min-h-screen">
        {/* Nav */}
        <header className="border-b border-[var(--rule)]">
          <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between px-5 sm:px-8">
            <div className="flex items-center gap-2.5">
              <Mark />
              <span className="la2-display text-[20px] font-medium tracking-tight">
                MergeAttest
              </span>
            </div>
            <nav className="hidden items-center gap-9 text-[13px] text-[var(--ink-2)] md:flex">
              <a className="la2-link" href="#capabilities">
                Capabilities
              </a>
              <a className="la2-link" href="#authorship">
                Authorship
              </a>
              <a className="la2-link" href="#how">
                How it works
              </a>
            </nav>
            <div className="flex items-center gap-4 text-[13px]">
              <Link className="la2-link text-[var(--ink-2)]" href="/sign-in">
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="la2-cta rounded-full px-4 py-2 font-medium"
              >
                Start free
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="border-b border-[var(--rule)]">
          <div className="mx-auto grid w-full max-w-6xl gap-14 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div data-intro>
              <Eyebrow>GitHub-native · free early access</Eyebrow>
              <h1 className="la2-display mt-6 text-[3.4rem] font-medium leading-[1.02] tracking-[-0.02em] text-[var(--ink)] sm:text-[4.2rem] lg:text-[4.6rem]">
                Govern every AI pull request{' '}
                <span className="italic text-[var(--oxblood)]">
                  before it merges.
                </span>
              </h1>
              <p className="mt-7 max-w-xl text-[15px] leading-[1.7] text-[var(--ink-2)] sm:text-[16px]">
                {heroLede}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/sign-up"
                  className="la2-cta group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium"
                >
                  Start for free
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#how"
                  className="la2-ghost inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-[var(--ink-2)]"
                >
                  See how it works
                </a>
              </div>
              <p className="la2-mono mt-6 text-[11px] tracking-wide text-[var(--ink-faint)]">
                free plan available · no credit card required
              </p>
            </div>

            <div data-intro className="lg:pt-4">
              <AttestationRecord />
            </div>
          </div>
        </section>

        {/* Ledger stats */}
        <section className="border-b border-[var(--rule)] bg-[var(--paper-2)]">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px bg-[var(--rule)] px-5 sm:px-8 lg:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-[var(--paper-2)] px-2 py-8 sm:px-5"
              >
                <div className="la2-display text-[2.6rem] leading-none text-[var(--ink)]">
                  {s.value}
                </div>
                <div className="mt-2 text-[12px] leading-snug text-[var(--ink-dim)]">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Capabilities — editorial numbered list */}
        <section id="capabilities" className="border-b border-[var(--rule)]">
          <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8">
            <div
              data-reveal
              className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end"
            >
              <div>
                <Eyebrow>The capabilities</Eyebrow>
                <h2 className="la2-display mt-5 text-[2.6rem] font-medium leading-[1.05] tracking-tight sm:text-[3.2rem]">
                  The full record, not another comment stream
                </h2>
              </div>
              <p className="text-[15px] leading-[1.7] text-[var(--ink-2)] lg:pb-2">
                Comments speed up review. Governance needs the complete record:
                risk, tests, policies, reviewers, approvals, and what changed
                after the decision was made.
              </p>
            </div>

            <div className="mt-14 border-t border-[var(--rule)]">
              {features.map((f, i) => (
                <div
                  key={f.id}
                  data-reveal
                  className="la2-feature grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-b border-[var(--rule)] px-2 py-8 sm:grid-cols-[5rem_1fr_1.2fr] sm:gap-x-10 sm:px-4"
                >
                  <div className="la2-display text-[2.4rem] leading-none text-[var(--ink-faint)]">
                    {numberLabel(i + 1)}
                  </div>
                  <h3 className="la2-display self-center text-[1.5rem] font-medium leading-tight tracking-tight text-[var(--ink)]">
                    {f.title}
                  </h3>
                  <p className="col-span-2 text-[14px] leading-[1.7] text-[var(--ink-2)] sm:col-span-1 sm:self-center">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Authorship — ledger */}
        <section
          id="authorship"
          className="border-b border-[var(--rule)] bg-[var(--paper-2)]"
        >
          <div className="mx-auto grid w-full max-w-6xl gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div data-reveal>
              <Eyebrow>AI authorship</Eyebrow>
              <h2 className="la2-display mt-5 text-[2.6rem] font-medium leading-[1.05] tracking-tight sm:text-[3.2rem]">
                Know which agent wrote it —{' '}
                <span className="italic text-[var(--oxblood)]">
                  and prove it.
                </span>
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-[1.7] text-[var(--ink-2)]">
                Coding-agent adoption is near-universal; trust is not.
                MergeAttest attributes every PR to the agent behind it and turns
                its track record into audit-ready evidence.
              </p>
              <div className="mt-8 overflow-hidden rounded-xl border border-[var(--rule-strong)] bg-[var(--card)]">
                <div className="border-b border-[var(--rule)] px-4 py-2.5">
                  <span className="la2-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-faint)]">
                    attribution confidence
                  </span>
                </div>
                {agents.map((a) => (
                  <div
                    key={a.name}
                    className="flex items-center gap-4 border-b border-[var(--rule)] px-4 py-2.5 last:border-b-0"
                  >
                    <span className="w-28 text-[13px] font-medium text-[var(--ink)]">
                      {a.name}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--paper)]">
                      <div
                        className="h-full rounded-full bg-[var(--forest)]"
                        style={{ width: `${a.confidence}%` }}
                      />
                    </div>
                    <span className="la2-mono w-10 text-right text-[12px] text-[var(--ink-dim)]">
                      {a.confidence}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-px self-start overflow-hidden rounded-xl border border-[var(--rule-strong)] bg-[var(--rule)] sm:grid-cols-2">
              {authorship.map((a, i) => (
                <div key={a.title} data-reveal className="bg-[var(--card)] p-7">
                  <span className="la2-mono text-[11px] text-[var(--oxblood)]">
                    {numberLabel(i + 1)}
                  </span>
                  <h3 className="la2-display mt-3 text-[1.35rem] font-medium leading-tight tracking-tight">
                    {a.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-[1.65] text-[var(--ink-2)]">
                    {a.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-b border-[var(--rule)]">
          <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8">
            <div data-reveal>
              <Eyebrow>How it works</Eyebrow>
              <h2 className="la2-display mt-5 max-w-2xl text-[2.6rem] font-medium leading-[1.05] tracking-tight sm:text-[3.2rem]">
                Live in minutes, governed from day one
              </h2>
            </div>
            <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <div key={s.title} data-reveal>
                  <div className="flex items-baseline gap-3 border-t-2 border-[var(--ink)] pt-4">
                    <span className="la2-display text-[2.6rem] leading-none text-[var(--oxblood)]">
                      {numberLabel(i + 1)}
                    </span>
                  </div>
                  <h3 className="la2-display mt-3 text-[1.3rem] font-medium leading-tight tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-[1.65] text-[var(--ink-2)]">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="mx-auto w-full max-w-6xl px-5 py-28 sm:px-8">
            <div data-reveal className="mx-auto max-w-2xl text-center">
              <span className="la2-seal mx-auto flex size-14 items-center justify-center rounded-full">
                <Mark size={26} />
              </span>
              <h2 className="la2-display mt-7 text-[2.8rem] font-medium leading-[1.04] tracking-tight sm:text-[3.6rem]">
                Ship AI code with confidence
              </h2>
              <p className="mx-auto mt-5 max-w-md text-[15px] leading-[1.7] text-[var(--ink-2)]">
                Connect your first repository and see risk scores on your open
                pull requests in minutes.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/sign-up"
                  className="la2-cta group inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-medium"
                >
                  Start for free
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/sign-in"
                  className="la2-ghost inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-medium text-[var(--ink-2)]"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-[var(--rule)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 sm:flex-row sm:px-8">
            <div className="flex items-center gap-2.5">
              <Mark size={22} />
              <span className="la2-display text-[16px] font-medium tracking-tight">
                MergeAttest
              </span>
            </div>
            <p className="la2-mono text-[11px] text-[var(--ink-faint)]">
              landing exploration · direction B — audit ledger
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

function AttestationRecord() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--rule-strong)] bg-[var(--card)] shadow-[0_30px_60px_-30px_rgba(28,24,19,0.25)]">
      <div className="flex items-center justify-between border-b border-[var(--rule)] px-5 py-3">
        <span className="la2-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ink-faint)]">
          attestation record
        </span>
        <span className="la2-mono text-[11px] text-[var(--ink-faint)]">
          {samplePr.repo}
        </span>
      </div>

      <div className="px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="la2-mono text-[11px] text-[var(--ink-faint)]">
              {samplePr.id}
            </span>
            <h3 className="la2-display mt-1 text-[1.4rem] font-medium leading-tight tracking-tight">
              {samplePr.title}
            </h3>
            <p className="la2-mono mt-1 text-[11px] text-[var(--ink-dim)]">
              agent:{samplePr.agent} · {samplePr.diff}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="la2-display text-[3rem] leading-none text-[var(--oxblood)]">
              {samplePr.score}
            </div>
            <div className="la2-mono text-[10px] uppercase tracking-wider text-[var(--ink-faint)]">
              risk / 100
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-px overflow-hidden rounded-lg border border-[var(--rule)]">
          {samplePr.findings.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-3 border-b border-[var(--rule)] bg-[var(--paper-2)] px-3 py-2.5 last:border-b-0"
            >
              <span
                className="size-1.5 rounded-full"
                style={{
                  background:
                    f.tone === 'danger' ? 'var(--oxblood)' : 'var(--gold)',
                }}
              />
              <span className="text-[12px] text-[var(--ink-2)]">{f.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-dashed border-[var(--rule-strong)] pt-4">
          <div>
            <div className="la2-mono text-[10px] uppercase tracking-wider text-[var(--ink-faint)]">
              approved & attested by
            </div>
            <div className="la2-display mt-0.5 text-[1.05rem] italic text-[var(--ink)]">
              Dana Okafor
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--forest)] px-3 py-1 text-[11px] font-medium text-[var(--forest)]">
            <span className="size-1.5 rounded-full bg-[var(--forest)]" />
            On the record
          </span>
        </div>
      </div>
    </div>
  )
}
