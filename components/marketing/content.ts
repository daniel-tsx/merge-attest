/**
 * Shared marketing copy + facts for the landing page and the design
 * explorations. Pure data, no JSX — each direction composes it differently.
 * Sourced from README.md, docs/AGENT_START_HERE.md, and lib/site.ts.
 */

export const heroEyebrow = 'GitHub-native · free early access'

export const heroTitle = 'Govern every AI pull request before it merges.'

export const heroLede =
  'MergeAttest is the control layer around AI coding agents: it attributes every pull request to the agent that wrote it, scores risk deterministically, flags missing tests, enforces repository rules, records human approvals, and exports audit-ready evidence — all where your team already works.'

export const heroProofCaption = 'free plan available · no credit card required'

/** Agents MergeAttest attributes PRs to, with sample confidence. */
export const agents = [
  { name: 'Claude Code', confidence: 95 },
  { name: 'Copilot', confidence: 92 },
  { name: 'Codex', confidence: 90 },
  { name: 'Cursor', confidence: 88 },
  { name: 'Devin', confidence: 86 },
] as const

/** Deterministic signals inspected on every diff. */
export const signals = [
  'diff size',
  'sensitive paths',
  'test coverage',
  'dependency changes',
  'migration files',
  'secret patterns',
  'API surface',
  'lockfile drift',
] as const

/** Headline metrics used as a proof strip. */
export const stats = [
  { value: '8', label: 'risk signals scored per diff' },
  { value: '5+', label: 'coding agents attributed by name' },
  { value: '100%', label: 'merge decisions kept on the record' },
  { value: '0', label: 'pipeline changes to get started' },
] as const

export type Feature = {
  id: string
  title: string
  description: string
}

/** Core product capabilities. */
export const features: Feature[] = [
  {
    id: 'risk',
    title: 'Deterministic risk scoring',
    description:
      'Every pull request gets a transparent, rule-based score — reviewers see exactly which signals flagged a change. No model guesswork, so the same diff always scores the same.',
  },
  {
    id: 'attribution',
    title: 'Agent attribution with evidence',
    description:
      'Each PR is fingerprinted to Cursor, Copilot, Claude Code, Codex, or Devin from commit trailers, bot accounts, and emails — with a confidence score and the evidence behind it.',
  },
  {
    id: 'tests',
    title: 'Test-gap detection',
    description:
      'Surface code paths shipped without coverage, with path-based suggestions for the tests that are missing.',
  },
  {
    id: 'rules',
    title: 'Custom repository rules',
    description:
      'Define policies for sensitive files and high-risk patterns, then evaluate them automatically on every PR.',
  },
  {
    id: 'approvals',
    title: 'Human approval records',
    description:
      'Route risky changes to the right reviewers and record every approval decision the moment it happens.',
  },
  {
    id: 'audit',
    title: 'Audit-ready evidence export',
    description:
      'Track how much of your code AI wrote and how much carried a human sign-off. Export the evidence bundle auditors ask for in EU AI Act and SOC2 reviews.',
  },
]

/** AI-authorship narrative points. */
export const authorship = [
  {
    title: 'Attribute every PR to an agent',
    description:
      'Built-in detection works out of the box; map your own bot accounts, branch prefixes, and commit trailers when your team has its own conventions.',
  },
  {
    title: 'Per-agent trust scorecard',
    description:
      'See which agent ships the riskiest code: high-risk rate, test gaps, rule hits, reverts, and merges without sign-off — every deduction shown.',
  },
  {
    title: 'AI-authorship ledger',
    description:
      'Track what share of your codebase AI wrote, and how much of it carried a human attestation before it shipped.',
  },
  {
    title: 'Compliance evidence on demand',
    description:
      'Export a review packet that supports EU AI Act human-oversight and SOC2 reviews — the record, not a certification.',
  },
] as const

/** How it works, four steps. */
export const steps = [
  {
    title: 'Connect GitHub',
    description:
      'Install the MergeAttest GitHub App and sync the repositories you want to govern.',
  },
  {
    title: 'Score every AI PR',
    description:
      'New and updated pull requests are scored for risk and scanned for missing test coverage.',
  },
  {
    title: 'Review and approve',
    description:
      'Reviewers work a prioritized queue, apply repository rules, and record decisions.',
  },
  {
    title: 'Keep an audit trail',
    description:
      'Every decision is logged and retained, ready to export the moment compliance asks.',
  },
] as const

/** Landing FAQ — also mirrored into FAQPage JSON-LD for search. */
export const faqs = [
  {
    q: 'Do I need to change my CI pipeline?',
    a: 'No. MergeAttest installs as a GitHub App and reads pull requests through the GitHub API. There are no required workflow or pipeline changes — connect a repository and scoring starts on the next pull request.',
  },
  {
    q: 'How does it decide a pull request is risky?',
    a: 'Risk scoring is deterministic, not AI-generated. It inspects signals like diff size, sensitive paths, missing test coverage, dependency and migration changes, and secret patterns, then shows the exact reasons behind every score — so the same diff always scores the same.',
  },
  {
    q: 'Does MergeAttest use AI to review my code?',
    a: 'Risk scoring, agent attribution, and rule checks are all rule-based and run without any language model. An advisory AI review layer is built in and uses your own OpenRouter key, but model execution is turned off during early access — nothing is sent to a model provider unless you enable it.',
  },
  {
    q: 'Which coding agents can it attribute?',
    a: 'Built-in detection covers Claude Code, GitHub Copilot, Cursor, OpenAI Codex, and Devin, using commit trailers, bot accounts, emails, and branch prefixes — each with a confidence score and the evidence behind it. You can map your own signals in the agent identity registry when your team has its own conventions.',
  },
  {
    q: 'Is it built for teams?',
    a: 'Yes. Invite your team with roles, assign reviewers, leave review notes, and record who approved each risky change — every decision is kept in the audit trail.',
  },
  {
    q: 'What does it cost?',
    a: 'MergeAttest is free during early access, with no credit card required. The free plan covers up to 3 connected repositories, 200 PR checks per month, and 7 days of audit history. Paid plans for higher limits are planned for later.',
  },
  {
    q: 'What happens to my source code?',
    a: 'MergeAttest works from pull request metadata — changed file paths, risk signals, approvals, and audit events. It does not store your full source files. Customer-provided credentials, such as an OpenRouter key, are encrypted before storage.',
  },
  {
    q: 'Can I export my data or leave?',
    a: 'Yes. Export audit evidence and compliance reports whenever you need them, and disconnect the GitHub App at any time. Contact support to request deletion of your workspace data.',
  },
] as const

/** A sample PR used in hero mockups across directions. */
export const samplePr = {
  id: '#482',
  repo: 'acme/api-gateway',
  title: 'Add retry logic to payment webhook',
  agent: 'claude-code',
  diff: '+218 −34 · 6 files',
  score: 72,
  band: 'High',
  findings: [
    { label: '2 test gaps detected', tone: 'attention' as const },
    { label: '1 rule violation', tone: 'danger' as const },
    { label: 'Sensitive paths touched', tone: 'danger' as const },
  ],
} as const
