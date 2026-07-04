import Link from 'next/link'
import { Archivo } from 'next/font/google'
import { agents, faqs, signals, steps } from '@/components/marketing/content'
import { createPageMetadata } from '@/lib/seo/metadata'

export const metadata = createPageMetadata({
  title: 'Design direction — Zero Theater',
  description:
    'Landing page design exploration: MergeAttest as a printed specification — deterministic governance, no AI theater. Preview only.',
  path: '/design-directions/zero-theater',
  noIndex: true,
})

// "Zero Theater" direction: a typographic manifesto set like a printed
// specification. No cards, no dashboard chrome — heavy rules, numbered
// clauses, mono values. Scoped to `.zt`; light token family, ink-first.
const display = Archivo({
  subsets: ['latin'],
  variable: '--font-zt-display',
})

const styles = `
.zt {
  --paper: oklch(0.977 0.005 250);
  --ink: oklch(0.155 0.022 252);
  --ink-dim: oklch(0.4 0.028 252);
  --ink-faint: oklch(0.56 0.03 252);
  --rule: oklch(0.872 0.014 250);
  --mark: oklch(0.5 0.105 208);
  --mark-soft: oklch(0.93 0.045 205);
  --never: oklch(0.505 0.17 25);
  background: var(--paper);
  color: var(--ink);
}
.zt-display {
  font-family: var(--font-zt-display), system-ui, sans-serif;
  letter-spacing: -0.03em;
}
.zt-mono { font-family: var(--font-geist-mono), ui-monospace, monospace; }
.zt-num { font-variant-numeric: tabular-nums; }
.zt a:focus-visible,
.zt button:focus-visible {
  outline: 2px solid var(--mark);
  outline-offset: 3px;
}
.zt-rule-heavy { border-top: 2px solid var(--ink); }
.zt-link { transition: color 0.15s ease; }
.zt-link:hover { color: var(--mark); }
.zt-cta {
  background: var(--ink);
  color: var(--paper);
  transition: background 0.15s ease;
}
.zt-cta:hover { background: oklch(0.28 0.035 255); }
/* Signature moment: a one-time highlighter sweep under the key claim. */
.zt-sweep { position: relative; white-space: nowrap; }
.zt-sweep::after {
  content: '';
  position: absolute;
  inset: 12% -1% 6% -1%;
  background: var(--mark-soft);
  z-index: -1;
  transform-origin: left center;
  animation: zt-sweep 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.7s both;
}
@keyframes zt-sweep {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
`

const two = (n: number) => String(n).padStart(2, '0')

const spec = [
  {
    verb: 'Attribute',
    clause:
      'MUST identify the coding agent behind each PR — commit trailers, bot accounts, emails, branch prefixes — with confidence and evidence.',
    value: 'claude-code · 95%',
  },
  {
    verb: 'Score',
    clause:
      'MUST score risk from eight inspectable signals. Rule-based. The same diff always produces the same score.',
    value: '72/100 · high',
  },
  {
    verb: 'Detect',
    clause: 'MUST flag changed code paths that ship without test coverage.',
    value: '2 gaps',
  },
  {
    verb: 'Evaluate',
    clause:
      'MUST evaluate your repository rules on every PR — sensitive files, high-risk patterns.',
    value: '1 violation',
  },
  {
    verb: 'Record',
    clause:
      'MUST write every human approval down the moment it happens: who, in what role, on which evidence.',
    value: 'on the record',
  },
  {
    verb: 'Export',
    clause:
      'MUST export the evidence bundle auditors ask for in EU AI Act and SOC2 reviews.',
    value: 'json · csv',
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

const evidenceExcerpt = `{
  "record": "0482",
  "repository": "acme/api-gateway",
  "pull_request": 482,
  "attribution": {
    "agent": "claude-code",
    "confidence": 0.95,
    "evidence": ["commit_trailer", "bot_account"]
  },
  "risk": { "score": 72, "band": "high", "signals": 8 },
  "approval": { "recorded": true, "role": "owner" },
  "exported_for": ["eu_ai_act_oversight", "soc2"]
}`

export default function ZeroTheater() {
  return (
    <div className={`zt ${display.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="flex min-h-screen flex-col">
        {/* Minimal rule-framed nav */}
        <header className="border-b-2 border-[var(--ink)]">
          <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
            <Link
              href="/"
              className="zt-display text-[16px] font-extrabold tracking-tight"
            >
              MergeAttest
            </Link>
            <nav
              aria-label="Primary"
              className="zt-mono hidden items-center gap-7 text-[11px] tracking-[0.1em] text-[var(--ink-dim)] uppercase md:flex"
            >
              <a className="zt-link" href="#spec">
                Spec
              </a>
              <a className="zt-link" href="#will-not">
                Will not do
              </a>
              <a className="zt-link" href="#evidence">
                Evidence
              </a>
              <a className="zt-link" href="#faq">
                FAQ
              </a>
            </nav>
            <div className="flex items-center gap-4 text-[13px]">
              <Link
                className="zt-link hidden text-[var(--ink-dim)] sm:inline"
                href="/sign-in"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="zt-cta px-4 py-2 text-[13px] font-semibold"
              >
                Start free
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {/* Manifesto hero */}
          <section className="mx-auto w-full max-w-5xl px-5 pt-16 pb-14 sm:px-8 sm:pt-24">
            <p
              data-intro
              className="zt-mono text-[11px] tracking-[0.22em] text-[var(--ink-faint)] uppercase"
            >
              Deterministic governance for AI pull requests
            </p>
            <h1 className="zt-display mt-6 text-[3.2rem] leading-[0.98] font-extrabold sm:text-[5rem] lg:text-[6rem]">
              <span data-intro className="block">
                No AI theater.
              </span>
              <span
                data-intro
                style={{ ['--intro-index' as string]: 1 }}
                className="block text-[var(--ink-dim)]"
              >
                Same diff,
              </span>
              <span
                data-intro
                style={{ ['--intro-index' as string]: 2 }}
                className="block"
              >
                <span className="zt-sweep">same score.</span>
              </span>
            </h1>
            <div
              data-intro
              style={{ ['--intro-index' as string]: 3 }}
              className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14"
            >
              <p className="max-w-xl text-[16px] leading-relaxed text-[var(--ink-dim)] sm:text-[17px]">
                MergeAttest governs AI-assisted pull requests with rules you can
                read: it attributes every PR to the agent that wrote it, scores
                risk deterministically, records human approvals, and exports the
                evidence. It does not review your code with a model and call
                that governance.
              </p>
              <div className="flex flex-col items-start gap-3">
                <Link
                  href="/sign-up"
                  className="zt-cta inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold"
                >
                  Start free — no credit card
                </Link>
                <p className="zt-mono text-[11px] leading-5 text-[var(--ink-faint)]">
                  github-native · installs in minutes
                  <br />
                  no pipeline changes
                </p>
              </div>
            </div>
          </section>

          {/* SPEC/001 datasheet */}
          <section id="spec" className="mx-auto w-full max-w-5xl px-5 sm:px-8">
            <div className="zt-rule-heavy flex items-baseline justify-between pt-3">
              <h2 className="zt-mono text-[11px] tracking-[0.22em] text-[var(--ink-dim)] uppercase">
                Spec/001 — on every pull request
              </h2>
              <p className="zt-mono zt-num hidden text-[11px] text-[var(--ink-faint)] sm:block">
                sample values · pr #482
              </p>
            </div>
            <dl className="mt-6 pb-16">
              {spec.map((row, i) => (
                <div
                  key={row.verb}
                  className="grid grid-cols-[2.6rem_1fr] items-baseline gap-x-4 gap-y-1 border-t border-[var(--rule)] py-5 first:border-t-0 sm:grid-cols-[2.6rem_9rem_1fr_9rem]"
                >
                  <span className="zt-mono zt-num text-[11px] text-[var(--ink-faint)]">
                    {two(i + 1)}
                  </span>
                  <dt className="zt-display text-[1.3rem] font-bold sm:text-[1.5rem]">
                    {row.verb}
                  </dt>
                  <dd className="col-start-2 text-[13.5px] leading-relaxed text-[var(--ink-dim)] sm:col-start-3">
                    {row.clause}
                  </dd>
                  <dd className="zt-mono zt-num col-start-2 text-[12px] text-[var(--mark)] sm:col-start-4 sm:text-right">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* The claim economy */}
          <section className="mx-auto w-full max-w-5xl px-5 sm:px-8">
            <div className="zt-rule-heavy pt-3">
              <h2 className="zt-mono text-[11px] tracking-[0.22em] text-[var(--ink-dim)] uppercase">
                The claim economy
              </h2>
            </div>
            <blockquote className="zt-display mt-8 max-w-4xl text-[1.9rem] leading-[1.15] font-bold text-balance sm:text-[2.8rem]">
              Every tool in this market claims intelligence. Almost none of them
              can tell you who wrote pull request&nbsp;
              <span className="zt-num">#482</span> — or prove it.
            </blockquote>
            <div className="mt-8 grid max-w-4xl gap-6 pb-16 sm:grid-cols-2 sm:gap-10">
              <p className="text-[14px] leading-relaxed text-[var(--ink-dim)]">
                AI reviewers make review faster. Useful — and beside the point.
                The question your team actually faces is different: should this
                AI-assisted change be allowed to merge, who accepted the risk,
                and where is the evidence when someone asks?
              </p>
              <p className="text-[14px] leading-relaxed text-[var(--ink-dim)]">
                That question doesn&rsquo;t need a smarter model. It needs a
                record. Attribution with evidence, a reproducible score, a named
                approver, a timestamp — kept where the auditor can reach them.
              </p>
            </div>
          </section>

          {/* Requirements: 8 signals */}
          <section className="mx-auto w-full max-w-5xl px-5 sm:px-8">
            <div className="zt-rule-heavy flex items-baseline justify-between pt-3">
              <h2 className="zt-mono text-[11px] tracking-[0.22em] text-[var(--ink-dim)] uppercase">
                Requirements — signals read on every diff
              </h2>
            </div>
            <div className="mt-6 grid gap-x-12 pb-16 sm:grid-cols-2">
              {signals.map((sig, i) => (
                <div
                  key={sig}
                  className="flex items-baseline gap-4 border-t border-[var(--rule)] py-3.5 first:border-t-0 sm:[&:nth-child(2)]:border-t-0"
                >
                  <span className="zt-mono zt-num text-[11px] text-[var(--ink-faint)]">
                    R-{two(i + 1)}
                  </span>
                  <span className="text-[14.5px] font-medium capitalize">
                    {sig}
                  </span>
                  <span className="zt-mono ml-auto text-[11px] text-[var(--ink-faint)]">
                    MUST record
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* What it will not do */}
          <section
            id="will-not"
            className="mx-auto w-full max-w-5xl px-5 sm:px-8"
          >
            <div className="zt-rule-heavy pt-3">
              <h2 className="zt-mono text-[11px] tracking-[0.22em] text-[var(--never)] uppercase">
                What it will not do
              </h2>
            </div>
            <div className="mt-8 grid gap-x-12 gap-y-10 pb-16 sm:grid-cols-2">
              {willNot.map((item, i) => (
                <div key={item.title}>
                  <p className="zt-mono zt-num text-[11px] text-[var(--never)]">
                    N-{two(i + 1)}
                  </p>
                  <h3 className="zt-display mt-3 text-[1.35rem] leading-[1.15] font-bold sm:text-[1.6rem]">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-md text-[14px] leading-relaxed text-[var(--ink-dim)]">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Workflow in 4 oversized numerals */}
          <section className="mx-auto w-full max-w-5xl px-5 sm:px-8">
            <div className="zt-rule-heavy pt-3">
              <h2 className="zt-mono text-[11px] tracking-[0.22em] text-[var(--ink-dim)] uppercase">
                Procedure
              </h2>
            </div>
            <div className="mt-8 grid gap-x-10 gap-y-10 pb-16 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <div key={s.title}>
                  <p className="zt-display zt-num text-[3.4rem] leading-none font-extrabold text-[var(--rule)]">
                    {two(i + 1)}
                  </p>
                  <h3 className="mt-4 text-[15px] font-semibold">{s.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--ink-dim)]">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Evidence excerpt + agent table */}
          <section
            id="evidence"
            className="mx-auto w-full max-w-5xl px-5 sm:px-8"
          >
            <div className="zt-rule-heavy pt-3">
              <h2 className="zt-mono text-[11px] tracking-[0.22em] text-[var(--ink-dim)] uppercase">
                Exhibit A — the exported record
              </h2>
            </div>
            <div className="mt-8 grid gap-10 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
              <div className="min-w-0">
                <p className="max-w-md text-[14px] leading-relaxed text-[var(--ink-dim)]">
                  This is the artifact, not a mockup of one: a fragment of the
                  evidence bundle MergeAttest exports for EU AI Act
                  human-oversight and SOC2 reviews. The record, not a
                  certification.
                </p>
                <pre className="zt-mono mt-6 overflow-x-auto border border-[var(--rule)] bg-[oklch(0.992_0.003_250)] p-5 text-[11.5px] leading-[1.7] text-[var(--ink-dim)]">
                  {evidenceExcerpt}
                </pre>
              </div>
              <div className="min-w-0">
                <p className="max-w-md text-[14px] leading-relaxed text-[var(--ink-dim)]">
                  Attribution is named and confidence-scored. Built-in detection
                  covers the agents below; map your own bot accounts, trailers,
                  and branch prefixes when your team has its own conventions.
                </p>
                <table className="mt-6 w-full border-collapse">
                  <caption className="sr-only">
                    Coding agents with sample attribution confidence
                  </caption>
                  <thead>
                    <tr className="zt-mono border-b-2 border-[var(--ink)] text-left text-[10px] tracking-[0.16em] text-[var(--ink-faint)] uppercase">
                      <th scope="col" className="py-2 pr-4 font-medium">
                        №
                      </th>
                      <th scope="col" className="py-2 pr-4 font-medium">
                        Agent
                      </th>
                      <th scope="col" className="py-2 text-right font-medium">
                        Confidence
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((a, i) => (
                      <tr
                        key={a.name}
                        className="border-b border-[var(--rule)]"
                      >
                        <td className="zt-mono zt-num py-3 pr-4 text-[12px] text-[var(--ink-faint)]">
                          {two(i + 1)}
                        </td>
                        <td className="py-3 pr-4 text-[14px] font-medium">
                          {a.name}
                        </td>
                        <td className="zt-mono zt-num py-3 text-right text-[13px]">
                          {a.confidence}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="zt-mono mt-3 text-[10.5px] text-[var(--ink-faint)]">
                  sample values — evidence shown per PR in the product
                </p>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="mx-auto w-full max-w-5xl px-5 sm:px-8">
            <div className="zt-rule-heavy pt-3">
              <h2 className="zt-mono text-[11px] tracking-[0.22em] text-[var(--ink-dim)] uppercase">
                Direct answers
              </h2>
            </div>
            <dl className="mt-6 max-w-3xl pb-16">
              {faqs.slice(0, 5).map((item) => (
                <div
                  key={item.q}
                  className="border-t border-[var(--rule)] py-6 first:border-t-0"
                >
                  <dt className="zt-display text-[1.15rem] leading-snug font-bold">
                    {item.q}
                  </dt>
                  <dd className="mt-2.5 max-w-2xl text-[13.5px] leading-relaxed text-[var(--ink-dim)]">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Founder note + final CTA */}
          <section className="mx-auto w-full max-w-5xl px-5 pb-20 sm:px-8">
            <div className="zt-rule-heavy pt-3">
              <h2 className="zt-mono text-[11px] tracking-[0.22em] text-[var(--ink-dim)] uppercase">
                A note on where this is
              </h2>
            </div>
            <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div className="max-w-xl space-y-4 text-[14.5px] leading-relaxed text-[var(--ink-dim)]">
                <p>
                  MergeAttest is early access, built by a small studio. It is
                  free while we grow it — 3 repositories, 200 PR checks a month,
                  no credit card. Paid plans come later, for higher limits.
                </p>
                <p>
                  In the same spirit as the rest of this page: model-based
                  review is built but switched off. Email and Slack alerts
                  aren&rsquo;t built yet. If you need enterprise SSO today,
                  we&rsquo;re not it yet. What is built — attribution, scoring,
                  rules, approvals, the audit trail, the export — is real,
                  deterministic, and yours to inspect.
                </p>
                <p className="zt-mono text-[12px] text-[var(--ink-faint)]">
                  — Eastbase Studio ·{' '}
                  <a
                    className="zt-link text-[var(--mark)]"
                    href="mailto:support@mergeattest.com"
                  >
                    support@mergeattest.com
                  </a>
                </p>
              </div>
              <div className="flex flex-col items-start gap-4 lg:items-end">
                <p className="zt-display text-[1.8rem] leading-[1.05] font-extrabold sm:text-[2.2rem] lg:text-right">
                  Govern the diff,
                  <br />
                  not the hype.
                </p>
                <div className="flex gap-3">
                  <Link
                    href="/sign-up"
                    className="zt-cta inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold"
                  >
                    Start free
                  </Link>
                  <Link
                    href="/sign-in"
                    className="zt-link inline-flex items-center justify-center border border-[var(--ink)] px-7 py-3.5 text-sm font-medium"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t-2 border-[var(--ink)]">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 px-5 py-7 sm:flex-row sm:px-8">
            <p className="zt-display text-sm font-extrabold tracking-tight">
              MergeAttest
            </p>
            <nav
              aria-label="Footer"
              className="flex flex-wrap items-center justify-center gap-5 text-[12px] text-[var(--ink-dim)]"
            >
              <Link className="zt-link" href="/privacy">
                Privacy
              </Link>
              <Link className="zt-link" href="/terms">
                Terms
              </Link>
              <a className="zt-link" href="mailto:support@mergeattest.com">
                Contact
              </a>
              <Link className="zt-link" href="/design-directions">
                All directions
              </Link>
            </nav>
            <div className="flex flex-col items-center gap-1 sm:items-end">
              <p className="zt-mono text-[11px] text-[var(--ink-faint)]">
                design direction preview 03/03 — not the production page
              </p>
              <p className="zt-mono text-[11px] text-[var(--ink-faint)]">
                from the{' '}
                <a
                  href="https://eastbase.studio"
                  target="_blank"
                  rel="noopener"
                  className="zt-link"
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
