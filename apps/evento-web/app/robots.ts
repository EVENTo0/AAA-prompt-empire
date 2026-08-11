import type { MetadataRoute } from 'next'
import { siteOrigin } from '@/lib/routes'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // `/api/context` is public business context and is deliberately
        // crawlable; every other API route is per-request or authenticated.
        allow: ['/', '/api/context', '/llms.txt'],
        disallow: ['/api/', '/ar/account', '/en/account'],
      },
    ],
    sitemap: `${siteOrigin()}/sitemap.xml`,
  }
}
