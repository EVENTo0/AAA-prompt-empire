import type { MetadataRoute } from 'next'
import { company } from '@/lib/content'
import { DEFAULT_LOCALE } from '@/lib/i18n'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: company.legalName,
    short_name: company.shortName,
    description: company.summary[DEFAULT_LOCALE],
    lang: DEFAULT_LOCALE,
    dir: 'rtl',
    start_url: `/${DEFAULT_LOCALE}`,
    scope: '/',
    display: 'standalone',
    background_color: '#05070d',
    theme_color: '#05070d',
    orientation: 'portrait-primary',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: company.shortName, short_name: 'Home', url: `/${DEFAULT_LOCALE}` },
      { name: 'Start a project', short_name: 'Request', url: `/${DEFAULT_LOCALE}/contact` },
      { name: 'My account', short_name: 'Account', url: `/${DEFAULT_LOCALE}/account` },
    ],
  }
}
