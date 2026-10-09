import type { MetadataRoute } from 'next'
import { LOCALES } from '@/lib/i18n'
import { pagePaths, siteOrigin } from '@/lib/routes'

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin()
  const lastModified = new Date()

  return LOCALES.flatMap((locale) =>
    pagePaths.map((path) => ({
      url: `${origin}/${locale}${path}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: path === '' ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(LOCALES.map((code) => [code, `${origin}/${code}${path}`])),
      },
    })),
  )
}
