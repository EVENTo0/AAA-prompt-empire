import Link from 'next/link'
import { company, translator } from '@/lib/content'
import { pick, resolveLocale } from '@/lib/i18n'
import ServiceGrid from '@/components/service-grid'
import DeliveryPipeline from '@/components/delivery-pipeline'
import ProjectGrid from '@/components/project-grid'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale)
  const t = translator(locale)

  return (
    <>
      <section className="hero">
        <div className="shell">
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h1>{pick(company.tagline, locale)}</h1>
          <p className="heroLead">{pick(company.summary, locale)}</p>
          <div className="ctaRow">
            <Link href={`/${locale}/contact`} className="button primary">
              {t('home.ctaPrimary')}
            </Link>
            <Link href={`/${locale}/method`} className="button secondary">
              {t('home.ctaSecondary')}
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="sectionHead">
            <h2>{t('home.principles')}</h2>
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
            <h2>{t('home.servicesTitle')}</h2>
            <p className="lead">{t('home.servicesLead')}</p>
          </div>
          <ServiceGrid locale={locale} />
          <div className="ctaRow">
            <Link href={`/${locale}/services`} className="button secondary">
              {t('home.allServices')}
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="sectionHead">
            <h2>{t('home.methodTitle')}</h2>
            <p className="lead">{t('home.methodLead')}</p>
          </div>
          <DeliveryPipeline locale={locale} detailed={false} />
          <div className="ctaRow">
            <Link href={`/${locale}/method`} className="button secondary">
              {t('home.allStages')}
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="sectionHead">
            <h2>{t('home.projectsTitle')}</h2>
            <p className="lead">{t('home.projectsLead')}</p>
          </div>
          <ProjectGrid locale={locale} limit={4} />
          <div className="ctaRow">
            <Link href={`/${locale}/projects`} className="button secondary">
              {t('home.allProjects')}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
