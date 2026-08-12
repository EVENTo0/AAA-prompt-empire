import type { MessageKey } from '@/lib/content'
import { LOCALES, type Locale } from '@/lib/i18n'

export const pagePaths = ['', '/services', '/method', '/projects', '/about', '/contact'] as const

export type NavEntry = { href: string; key: MessageKey }

export function navItems(locale: Locale): NavEntry[] {
  return [
    { href: `/${locale}`, key: 'nav.home' },
    { href: `/${locale}/services`, key: 'nav.services' },
    { href: `/${locale}/method`, key: 'nav.method' },
    { href: `/${locale}/projects`, key: 'nav.projects' },
    { href: `/${locale}/about`, key: 'nav.about' },
  ]
}

/** Absolute site origin, used for canonical URLs, sitemap and metadataBase. */
export function siteOrigin(): string {
  const configured = process.env.SITE_ORIGIN?.trim()
  if (configured) return configured.replace(/\/$/, '')
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (vercel) return `https://${vercel}`
  return 'http://localhost:3000'
}

/**
 * Correct canonical + hreflang for a specific page.
 *
 * Declaring these only on the layout would give every subpage the homepage's
 * alternates, which tells search engines the wrong thing about /ar/services.
 */
export function localeAlternates(locale: Locale, path: string) {
  return {
    canonical: `/${locale}${path}`,
    languages: Object.fromEntries(LOCALES.map((code) => [code, `/${code}${path}`])),
  }
}
