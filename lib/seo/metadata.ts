import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/env'
import { siteConfig } from '@/lib/site'

type PageMetadataInput = {
  title: string
  description: string
  path: string
  noIndex?: boolean
}

function absoluteUrl(path: string) {
  const base = getSiteUrl()
  if (path === '/') return base
  return `${base}${path}`
}

function pageTitle(title: string) {
  return `${title} | ${siteConfig.name}`
}

export function createPageMetadata(input: PageMetadataInput): Metadata {
  const url = absoluteUrl(input.path)

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    robots: input.noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    openGraph: {
      type: 'website',
      url,
      title: pageTitle(input.title),
      description: input.description,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle(input.title),
      description: input.description,
    },
  }
}

export function createRootMetadata(): Metadata {
  const url = getSiteUrl()

  return {
    metadataBase: new URL(url),
    title: {
      default: siteConfig.defaultTitle,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    applicationName: siteConfig.name,
    keywords: [...siteConfig.keywords],
    authors: [{ name: siteConfig.name, url }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title: siteConfig.defaultTitle,
      description: siteConfig.description,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
    },
    twitter: {
      card: 'summary_large_image',
      title: siteConfig.defaultTitle,
      description: siteConfig.description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
      shortcut: '/favicon.ico',
    },
    category: 'technology',
  }
}
