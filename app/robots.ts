import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl()

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/sign-in', '/sign-up', '/privacy', '/terms'],
      disallow: [
        '/api/',
        '/admin/',
        '/dashboard',
        '/pull-requests',
        '/repositories',
        '/approvals',
        '/audit-log',
        '/activity',
        '/reports',
        '/settings',
        '/forgot-password',
        '/reset-password',
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: new URL(base).host,
  }
}
