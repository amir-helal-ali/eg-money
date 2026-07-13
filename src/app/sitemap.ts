import type { MetadataRoute } from 'next'

/**
 * Dynamic sitemap — lists all public pages + learn articles.
 * Submitted to Google Search Console for indexing.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://eg-money.com'
  const now = new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/help`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/learn`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ]

  // Learn articles — static list (could be dynamic from DB if needed)
  const articleSlugs = [
    'usdt-basics',
    'p2p-trading-guide',
    'security-best-practices',
    'market-analysis',
    'risk-management',
    'wallet-security',
    'trading-strategies',
    'technical-analysis',
    'fundamental-analysis',
    'arbitrage',
    'tax-regulations',
  ]
  const articlePages: MetadataRoute.Sitemap = articleSlugs.map((slug) => ({
    url: `${baseUrl}/learn/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...articlePages]
}
