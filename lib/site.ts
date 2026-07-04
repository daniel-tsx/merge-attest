export const siteConfig = {
  name: 'MergeAttest',
  tagline: 'AI Pull Request Governance',
  defaultTitle: 'MergeAttest — AI Pull Request Governance for GitHub Teams',
  description:
    'MergeAttest governs AI-assisted pull requests on GitHub: deterministic risk scoring, agent attribution, missing-test detection, repository rules, human approvals, and audit-ready evidence for compliance reviews.',
  locale: 'en_US',
  keywords: [
    'AI pull request governance',
    'AI code review governance',
    'GitHub AI agent attribution',
    'AI-assisted code compliance',
    'pull request risk scoring',
    'EU AI Act software evidence',
    'SOC2 AI oversight',
    'Cursor Copilot Claude Code governance',
    'deterministic PR risk scoring',
    'AI authorship audit trail',
  ],
} as const

export type SitemapRoute = {
  path: string
  changeFrequency: 'weekly' | 'monthly' | 'yearly'
  priority: number
}

/** Public marketing and legal routes included in the sitemap. */
export const publicSitemapRoutes: SitemapRoute[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/sign-up', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/sign-in', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.4 },
]

/** Paths reachable without authentication (also used by the edge proxy). */
export const publicAppPaths = [
  '/',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/privacy',
  '/terms',
  // Landing redesign explorations — noindex previews, not in the sitemap.
  // See docs/design/FABLE_LANDING_DIRECTIONS.md.
  '/design-directions',
] as const
