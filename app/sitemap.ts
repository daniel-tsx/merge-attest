import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/env'
import { publicSitemapRoutes } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl()
  const lastModified = new Date()

  return publicSitemapRoutes.map((route) => ({
    url: route.path === '/' ? base : `${base}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
