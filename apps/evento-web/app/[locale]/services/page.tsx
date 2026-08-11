import type { Metadata } from 'next'
import { engagements, translator } from '@/lib/content'
import { pick, resolveLocale } from '@/lib/i18n'
import ServiceGrid from '@/components/service-grid'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale)
  return { title: translator(locale)('services.title'), description: translator(locale)('services.lead') }
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale)
  const t = translator(locale)

  return (
    <>
      <section className="section">
        <div className="shell">
          <div className="sectionHead">
            <p className="eyebrow">{t('home.eyebrow')}</p>
            <h1>{t('services.title')}</h1>
            <p className="lead">{t('services.lead')}</p>
          </div>
          <ServiceGrid locale={locale} detailed />
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="sectionHead">
            <h2>{t('services.engagements')}</h2>
            <p className="lead">{t('services.engagementsLead')}</p>
          </div>
          <div className="grid cols2">
            {engagements.map((engagement) => (
              <article className="card" key={engagement.id}>
                <h3>{pick(engagement.name, locale)}</h3>
                <dl className="stageMeta" style={{ borderBlockStart: 'none', paddingBlockStart: 0 }}>
                  <dt>{t('services.duration')}</dt>
                  <dd>{pick(engagement.duration, locale)}</dd>
                  <dt>{t('services.outcome')}</dt>
                  <dd>{pick(engagement.outcome, locale)}</dd>
                </dl>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
