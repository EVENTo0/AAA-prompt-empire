import Link from 'next/link'
import { services, translator } from '@/lib/content'
import { pick, pickList, type Locale } from '@/lib/i18n'

export default function ServiceGrid({ locale, detailed = false }: { locale: Locale; detailed?: boolean }) {
  const t = translator(locale)

  return (
    <div className="grid cols3">
      {services.map((service) => (
        <article className="card" key={service.id} id={service.id}>
          <span className="cardIcon" aria-hidden="true">
            {service.icon}
          </span>
          <h3>{pick(service.name, locale)}</h3>
          <p>{pick(service.summary, locale)}</p>

          {detailed ? (
            <>
              <p className="muted" style={{ fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {t('services.deliverables')}
              </p>
              <ul className="deliverables">
                {pickList(service.deliverables, locale).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="tagRow">
                {service.platforms.map((platform) => (
                  <span className="tag" key={platform}>
                    {platform}
                  </span>
                ))}
              </div>
              <Link
                href={`/${locale}/contact?service=${service.id}`}
                className="button secondary"
                style={{ marginBlockStart: 'auto' }}
              >
                {t('services.requestThis')}
              </Link>
            </>
          ) : null}
        </article>
      ))}
    </div>
  )
}
