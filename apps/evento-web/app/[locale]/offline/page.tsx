import type { Metadata } from 'next'
import Link from 'next/link'
import { translator } from '@/lib/content'
import { resolveLocale } from '@/lib/i18n'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const t = translator(resolveLocale((await params).locale))
  return { title: t('offline.title'), robots: { index: false, follow: false } }
}

export default async function OfflinePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale)
  const t = translator(locale)

  return (
    <section className="section">
      <div className="shell">
        <h1>{t('offline.title')}</h1>
        <p className="lead">{t('offline.body')}</p>
        <div className="ctaRow">
          <Link href={`/${locale}`} className="button primary">
            {t('common.backHome')}
          </Link>
        </div>
      </div>
    </section>
  )
}
