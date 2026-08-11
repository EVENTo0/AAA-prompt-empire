import type { Metadata } from 'next'
import { translator } from '@/lib/content'
import { resolveLocale } from '@/lib/i18n'
import DeliveryPipeline from '@/components/delivery-pipeline'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const t = translator(resolveLocale((await params).locale))
  return { title: t('method.title'), description: t('method.lead') }
}

export default async function MethodPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale)
  const t = translator(locale)

  return (
    <section className="section">
      <div className="shell">
        <div className="sectionHead">
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h1>{t('method.title')}</h1>
          <p className="lead">{t('method.lead')}</p>
        </div>
        <DeliveryPipeline locale={locale} />
      </div>
    </section>
  )
}
