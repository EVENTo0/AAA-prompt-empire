import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import '../globals.css'

import { company, translator } from '@/lib/content'
import { LOCALES, direction, isLocale, otherLocale, localeLabel, pick, type Locale } from '@/lib/i18n'
import { navItems, siteOrigin } from '@/lib/routes'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import ServiceWorkerRegistrar from '@/components/service-worker'
import InstallPrompt from '@/components/install-prompt'
import AppNav from '@/components/app-nav'

export const dynamicParams = false

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#05070d',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: raw } = await params
  if (!isLocale(raw)) return {}
  const locale: Locale = raw

  return {
    metadataBase: new URL(siteOrigin()),
    title: {
      default: `${company.legalName} — ${pick(company.tagline, locale)}`,
      template: `%s — ${company.shortName}`,
    },
    description: pick(company.summary, locale),
    applicationName: company.shortName,
    appleWebApp: { capable: true, title: company.shortName, statusBarStyle: 'black-translucent' },
    // Declared explicitly so browsers use the SVG mark instead of probing for
    // a /favicon.ico that this app does not ship.
    icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }], apple: '/icon.svg' },
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(LOCALES.map((code) => [code, `/${code}`])),
    },
    openGraph: {
      type: 'website',
      siteName: company.legalName,
      locale: locale === 'ar' ? 'ar_SA' : 'en_US',
      title: `${company.legalName} — ${pick(company.tagline, locale)}`,
      description: pick(company.summary, locale),
      url: `/${locale}`,
    },
    robots: { index: true, follow: true },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale: Locale = raw
  const t = translator(locale)
  const alternate = otherLocale(locale)

  return (
    <html lang={locale} dir={direction(locale)}>
      <body>
        <a className="skipLink" href="#main">
          {t('nav.skip')}
        </a>

        <SiteHeader
          homeHref={`/${locale}`}
          brandName={company.shortName}
          brandSub={locale === 'ar' ? 'لتطوير المشاريع' : 'Project Development'}
          items={navItems(locale).map((item) => ({ href: item.href, label: t(item.key) }))}
          cta={{ href: `/${locale}/contact`, label: t('nav.contact') }}
          localeSwitch={{ href: `/${alternate}`, label: localeLabel[alternate] }}
          menuLabel={t('nav.menu')}
        />

        <main id="main">{children}</main>

        <SiteFooter locale={locale} />

        {/* Installed-app chrome. Both are inert for an ordinary browser
            visit: the bottom bar is hidden by a display-mode media query, and
            the install offer only renders when the browser actually reports
            the site as installable. */}
        <AppNav
          label={t('app.navLabel')}
          items={[
            { href: `/${locale}`, label: t('app.navHome'), icon: '\u25C7' },
            { href: `/${locale}/services`, label: t('app.navServices'), icon: '\u25C8' },
            { href: `/${locale}/projects`, label: t('app.navProjects'), icon: '\u25A4' },
            { href: `/${locale}/account`, label: t('app.navAccount'), icon: '\u25CB' },
          ]}
        />
        <InstallPrompt
          copy={{
            title: t('app.installTitle'),
            body: t('app.installBody'),
            install: t('app.installAction'),
            dismiss: t('app.installDismiss'),
            iosTitle: t('app.installIosTitle'),
            iosBody: t('app.installIosBody'),
          }}
        />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )
}
