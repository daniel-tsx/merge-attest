import { faqs } from '@/components/marketing/content'
import { getSiteUrl } from '@/lib/env'
import { siteConfig } from '@/lib/site'

export function createHomeJsonLd() {
  const url = getSiteUrl()

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteConfig.name,
      url,
      description: siteConfig.description,
      inLanguage: 'en-US',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteConfig.name,
      url,
      description: siteConfig.description,
      logo: `${url}/icon.svg`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: siteConfig.name,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      url,
      description: siteConfig.description,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free early access with usage limits',
      },
      featureList: [
        'AI agent pull request attribution',
        'Deterministic risk scoring',
        'Missing test coverage detection',
        'Repository policy rules',
        'Human approval workflow',
        'Audit trail and evidence export',
        'GitHub-native integration',
      ],
    },
  ]
}
