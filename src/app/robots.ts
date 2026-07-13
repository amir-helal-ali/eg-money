import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://eg-money.com'
  return {
    rules: [
      // Allow all crawlers on public pages
      {
        userAgent: '*',
        allow: ['/', '/help', '/learn', '/terms', '/privacy'],
        disallow: [
          '/api/',
          '/profile',
          '/transactions',
          '/security',
          '/notifications',
          '/dashboard',
          '/trade',
          '/p2p',
          '/wallet',
          '/admin',
        ],
      },
      // Specific crawler configs
      { userAgent: 'Googlebot', allow: '/' },
      { userAgent: 'Bingbot', allow: '/' },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
