import { company, services } from '@/lib/content'
import { pick, type Locale } from '@/lib/i18n'
import { siteOrigin } from '@/lib/routes'

/**
 * Organization structured data.
 *
 * Built from the same data files the pages render, so it cannot describe a
 * different company. It claims only what the site already states publicly —
 * no revenue, no headcount, no ratings, nothing unverifiable.
 */
export function organizationJsonLd(locale: Locale) {
  const origin = siteOrigin()

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${origin}/#organization`,
    name: company.legalName,
    alternateName: company.shortName,
    url: origin,
    logo: `${origin}/icon.svg`,
    description: pick(company.summary, locale),
    foundingDate: company.founded,
    email: company.contact.general,
    inLanguage: ['ar', 'en'],
    sameAs: [company.contact.github],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: company.contact.general,
        availableLanguage: ['Arabic', 'English'],
      },
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: company.contact.projects,
        availableLanguage: ['Arabic', 'English'],
      },
    ],
    makesOffer: services.map((service) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: pick(service.name, locale),
        description: pick(service.summary, locale),
      },
    })),
  }
}
