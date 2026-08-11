import type { MetadataRoute } from 'next'
import { siteOrigin } from '@/lib/routes'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/ar/account', '/en/account'] }],
    sitemap: `${siteOrigin()}/sitemap.xml`,
  }
}
