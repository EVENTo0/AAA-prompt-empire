import type { Metadata } from 'next'
import { company, translator } from '@/lib/content'
import { localeAlternates } from '@/lib/routes'
import { pick, resolveLocale } from '@/lib/i18n'
import { formatNumber } from '@/lib/format'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale)
  return { title: translator(locale)('about.title'), description: pick(company.summary, locale), alternates: localeAlternates(locale, '/about') }
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
          <dl className="stageMeta plain">
            <dt>{t('about.email')}</dt>
            <dd>
              <a href={`mailto:${company.contact.general}`} dir="ltr">
                {company.contact.general}
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
              <span className="ledger">{formatNumber(company.contact.responseTargetHours, locale)}</span>{' '}
              {t('about.hours')}
            </dd>
          </dl>
        </div>
      </section>
    </>
  )
}
