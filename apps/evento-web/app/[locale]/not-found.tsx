import Link from 'next/link'
import { t } from '@/lib/content'
import { LOCALES } from '@/lib/i18n'

/**
 * `not-found.tsx` cannot read route params, so the 404 shows both languages
 * rather than guessing one.
 */
export default function NotFound() {
  return (
    <section className="section">
      <div className="shell">
        {LOCALES.map((locale) => (
          <div key={locale} lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} style={{ marginBlockEnd: '2rem' }}>
            <h1>{t('common.notFound', locale)}</h1>
            <p className="lead">{t('common.notFoundBody', locale)}</p>
            <div className="ctaRow">
              <Link href={`/${locale}`} className="button secondary">
                {t('common.backHome', locale)}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
