import type {
  AgentIdentityMatchType,
  AgentIdentityRule,
  AgentSource,
  AttributionEvidence,
  AttributionSignal,
} from '@/lib/types'

/**
 * Deterministic, explainable agent attribution.
 *
 * Replaces naive substring guessing with weighted evidence drawn from commit
 * trailers, bot accounts, author emails, branch prefixes, PR labels, and titles,
 * plus admin-configured organization registry rules. Every determination carries
 * a confidence score and an evidence trail so reviewers can see *why* a pull
 * request was attributed to a given agent.
 */

export type AttributionCommit = {
  message?: string | null
  authorEmail?: string | null
  authorLogin?: string | null
  committerEmail?: string | null
}

export type AttributionInput = {
  author?: string | null
  authorEmail?: string | null
  title?: string
  branch?: string
  labels?: string[]
  commits?: AttributionCommit[]
  registry?: AgentIdentityRule[]
}

export type AttributionResult = {
  agentSource: AgentSource
  aiAssisted: boolean
  confidence: number
  evidence: AttributionEvidence[]
}

type KnownAgent = Exclude<AgentSource, 'manual' | 'unknown'>

type AgentMatchers = {
  agent: KnownAgent
  trailer: RegExp[]
  email: RegExp[]
  login: RegExp[]
  branchPrefix: RegExp[]
  title: RegExp[]
}

/** Built-in confidence weight (0-100) per built-in signal type. */
const SIGNAL_WEIGHT: Record<AttributionSignal, number> = {
  commit_trailer: 95,
  bot_account: 88,
  email_domain: 80,
  branch_prefix: 55,
  label: 50,
  title_keyword: 30,
  registry_rule: 90,
}

/** Admin registry rules are authoritative, so they weigh slightly higher. */
const REGISTRY_WEIGHT: Record<AgentIdentityMatchType, number> = {
  commit_trailer: 96,
  bot_login: 90,
  email_domain: 82,
  branch_prefix: 58,
  label: 52,
}

/**
 * Known agent fingerprints. These match how Claude Code, GitHub Copilot, Cursor,
 * Devin, and OpenAI Codex actually tag commits and accounts today.
 */
const KNOWN_AGENTS: AgentMatchers[] = [
  {
    agent: 'claude_code',
    trailer: [/co-authored-by:\s*claude/i, /generated with \[?claude code/i],
    email: [/@anthropic\.com$/i],
    login: [/^claude/i, /anthropic/i],
    branchPrefix: [/^claude\//i],
    title: [/\bclaude\b/i],
  },
  {
    agent: 'copilot',
    trailer: [/co-authored-by:\s*copilot/i],
    email: [/copilot@users\.noreply\.github\.com$/i, /copilot@github\.com$/i],
    login: [/^copilot$/i, /copilot.*\[bot\]/i, /copilot-swe-agent/i],
    branchPrefix: [/^copilot\//i],
    title: [/\bcopilot\b/i],
  },
  {
    agent: 'cursor',
    trailer: [/co-authored-by:\s*cursor/i, /cursoragent/i],
    email: [/@cursor\.(com|sh)$/i],
    login: [/^cursor/i, /cursoragent/i],
    branchPrefix: [/^cursor\//i],
    title: [/\bcursor\b/i],
  },
  {
    agent: 'devin',
    trailer: [/co-authored-by:\s*devin/i, /devin-ai-integration/i],
    email: [/@devin\.ai$/i],
    login: [/devin-ai-integration/i, /^devin/i],
    branchPrefix: [/^devin\//i],
    title: [/\bdevin\b/i],
  },
  {
    agent: 'codex',
    trailer: [/co-authored-by:\s*codex/i, /chatgpt-codex-connector/i],
    email: [/codex@openai\.com$/i],
    login: [/chatgpt-codex-connector/i, /^codex/i],
    branchPrefix: [/^codex\//i],
    title: [/\bcodex\b/i],
  },
]

/** Generic "this is a bot/agent but we don't know which" signals. */
const GENERIC_BOT_BRANCH = /(^|\/)agent\//i
const GENERIC_BOT_TITLE = /\[ai\]/i
const GENERIC_BOT_LOGIN = /\[bot\]|[-_.]bot$|^bot$/i

function nonEmpty(values: Array<string | null | undefined>): string[] {
  return values.filter((value): value is string =>
    Boolean(value && value.trim()),
  )
}

export function isUsableRegistryPattern(pattern: string): boolean {
  return pattern.trim().replaceAll('*', '').length >= 2
}

/** Case-insensitive substring match with optional `*` glob support. */
function textMatches(value: string, pattern: string): boolean {
  const normalized = value.toLowerCase()
  if (pattern.includes('*')) {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`^${escaped.replaceAll('*', '.*')}$`, 'i').test(value)
  }
  return normalized.includes(pattern)
}

function matchesEmailDomain(email: string, pattern: string): boolean {
  if (pattern.includes('*') || pattern.includes('@')) {
    return textMatches(email, pattern)
  }

  const domain = email.toLowerCase().split('@').at(-1)
  const normalizedPattern = pattern.replace(/^@/, '')
  return Boolean(
    domain &&
    (domain === normalizedPattern || domain.endsWith(`.${normalizedPattern}`)),
  )
}

function matchesBranchPrefix(branch: string, pattern: string): boolean {
  if (pattern.includes('*')) return textMatches(branch, pattern)
  return branch.toLowerCase().startsWith(pattern)
}

function matchesRegistryRule(
  rule: AgentIdentityRule,
  ctx: {
    logins: string[]
    emails: string[]
    branch: string
    labels: string[]
    messages: string[]
  },
): boolean {
  const pattern = rule.pattern.trim().toLowerCase()
  if (!isUsableRegistryPattern(pattern)) return false

  switch (rule.matchType) {
    case 'bot_login':
      return ctx.logins.some((login) => textMatches(login, pattern))
    case 'email_domain':
      return ctx.emails.some((email) => matchesEmailDomain(email, pattern))
    case 'branch_prefix':
      return matchesBranchPrefix(ctx.branch, pattern)
    case 'label':
      return ctx.labels.some((label) => textMatches(label, pattern))
    case 'commit_trailer':
      return ctx.messages.some((message) =>
        message.toLowerCase().includes(pattern),
      )
  }
}

export function attributeAgent(input: AttributionInput): AttributionResult {
  const commits = input.commits ?? []
  const messages = commits.map((commit) => commit.message ?? '')
  const logins = nonEmpty([
    input.author,
    ...commits.map((commit) => commit.authorLogin),
  ])
  const emails = nonEmpty([
    input.authorEmail,
    ...commits.flatMap((commit) => [commit.authorEmail, commit.committerEmail]),
  ])
  const branch = input.branch ?? ''
  const title = input.title ?? ''
  const labels = input.labels ?? []

  const evidence: AttributionEvidence[] = []
  const push = (
    signal: AttributionSignal,
    agentSource: AgentSource,
    detail: string,
    weight: number = SIGNAL_WEIGHT[signal],
  ) => {
    evidence.push({ signal, agentSource, detail, weight })
  }

  for (const def of KNOWN_AGENTS) {
    const trailerHits = messages.filter((message) =>
      def.trailer.some((pattern) => pattern.test(message)),
    ).length
    if (trailerHits) {
      push(
        'commit_trailer',
        def.agent,
        `Co-authored-by trailer on ${trailerHits} commit${trailerHits === 1 ? '' : 's'}`,
      )
    }

    const loginHit = logins.find((login) =>
      def.login.some((pattern) => pattern.test(login)),
    )
    if (loginHit) push('bot_account', def.agent, `Account ${loginHit}`)

    const emailHit = emails.find((email) =>
      def.email.some((pattern) => pattern.test(email)),
    )
    if (emailHit) push('email_domain', def.agent, `Author email ${emailHit}`)

    if (def.branchPrefix.some((pattern) => pattern.test(branch))) {
      push('branch_prefix', def.agent, `Branch ${branch}`)
    }

    if (def.title.some((pattern) => pattern.test(title))) {
      push(
        'title_keyword',
        def.agent,
        `Title mentions ${def.agent.replaceAll('_', ' ')}`,
      )
    }
  }

  // Generic agent/bot signals — AI-assisted, but agent unknown.
  if (GENERIC_BOT_BRANCH.test(branch)) {
    push('branch_prefix', 'unknown', `Agent branch ${branch}`)
  }
  if (GENERIC_BOT_TITLE.test(title)) {
    push('title_keyword', 'unknown', 'Title tagged [ai]')
  }
  const genericLogin = logins.find((login) => GENERIC_BOT_LOGIN.test(login))
  if (genericLogin)
    push('bot_account', 'unknown', `Bot account ${genericLogin}`)

  // Organization registry rules (admin-configured, authoritative).
  for (const rule of input.registry ?? []) {
    if (!rule.enabled) continue
    if (
      matchesRegistryRule(rule, { logins, emails, branch, labels, messages })
    ) {
      push(
        'registry_rule',
        rule.agentSource,
        `Registry rule: ${rule.matchType.replaceAll('_', ' ')} "${rule.pattern}"`,
        REGISTRY_WEIGHT[rule.matchType],
      )
    }
  }

  evidence.sort((left, right) => right.weight - left.weight)

  if (!evidence.length) {
    return {
      agentSource: 'manual',
      aiAssisted: false,
      confidence: 0,
      evidence: [],
    }
  }

  const namedEvidence = evidence.filter(
    (item) => item.agentSource !== 'unknown',
  )
  const pool = namedEvidence.length ? namedEvidence : evidence

  const byAgent = new Map<AgentSource, { max: number; total: number }>()
  for (const item of pool) {
    const bucket = byAgent.get(item.agentSource) ?? { max: 0, total: 0 }
    bucket.max = Math.max(bucket.max, item.weight)
    bucket.total += item.weight
    byAgent.set(item.agentSource, bucket)
  }

  let agentSource: AgentSource = 'unknown'
  let best = { max: -1, total: -1 }
  for (const [candidate, bucket] of byAgent) {
    if (
      bucket.max > best.max ||
      (bucket.max === best.max && bucket.total > best.total)
    ) {
      agentSource = candidate
      best = bucket
    }
  }

  return {
    agentSource,
    aiAssisted: true,
    confidence: Math.min(100, best.max),
    evidence,
  }
}
