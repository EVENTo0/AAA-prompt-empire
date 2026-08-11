import type { Metadata } from 'next'
import { company, translator } from '@/lib/content'
import { pick, resolveLocale } from '@/lib/i18n'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale)
  return { title: translator(locale)('about.title'), description: pick(company.summary, locale) }
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale)
  const t = translator(locale)

  return (
    <>
      <section className="section">
        <div className="shell">
          <div className="sectionHead">
            <p className="eyebrow">{t('home.eyebrow')}</p>
            <h1>{t('about.title')}</h1>
            <p className="lead">{pick(company.summary, locale)}</p>
          </div>

          <div className="grid cols2">
            {company.principles.map((principle) => (
              <article className="card" key={principle.id}>
                <h3>{pick(principle.title, locale)}</h3>
                <p>{pick(principle.body, locale)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="sectionHead">
            <h2>{t('about.contactTitle')}</h2>
          </div>
          <dl className="stageMeta" style={{ borderBlockStart: 'none', paddingBlockStart: 0, maxWidth: '46ch' }}>
            <dt>{t('about.email')}</dt>
            <dd>
              <a href={`mailto:${company.contact.email}`} dir="ltr">
                {company.contact.email}
              </a>
            </dd>
            <dt>{t('about.github')}</dt>
            <dd>
              <a href={company.contact.github} rel="noreferrer noopener" dir="ltr">
                {company.contact.github}
              </a>
            </dd>
            <dt>{t('about.responseTarget')}</dt>
            <dd>
              {new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US').format(
                company.contact.responseTargetHours,
              )}{' '}
              {t('about.hours')}
            </dd>
          </dl>
        </div>
      </section>
    </>
  )
}
