import { portfolio, stageById, translator } from '@/lib/content'
import { pick, type Locale } from '@/lib/i18n'
import EvidenceBadge from '@/components/evidence-badge'

export default function ProjectGrid({ locale, limit }: { locale: Locale; limit?: number }) {
  const t = translator(locale)
  const items = typeof limit === 'number' ? portfolio.slice(0, limit) : portfolio

  return (
    <div className="grid cols2">
      {items.map((project) => {
        const stage = stageById(project.stage)
        return (
          <article className="card" key={project.id}>
            <div className="cardHead">
              <div>
                <p className="eyebrow" style={{ marginBottom: '0.2rem' }}>
                  {pick(project.kind, locale)}
                </p>
                <h3>{pick(project.name, locale)}</h3>
              </div>
              <EvidenceBadge state={project.evidence} locale={locale} />
            </div>

            <p>{pick(project.summary, locale)}</p>

            <dl className="stageMeta" style={{ borderBlockStart: 'none', paddingBlockStart: 0 }}>
              <dt>{t('projects.stage')}</dt>
              <dd>{stage ? pick(stage.name, locale) : project.stage}</dd>
              <dt>{t('method.evidence')}</dt>
              <dd>{pick(project.evidenceNote, locale)}</dd>
            </dl>

            <div className="tagRow">
              {project.platforms.map((platform) => (
                <span className="tag" key={platform}>
                  {platform}
                </span>
              ))}
            </div>
          </article>
        )
      })}
    </div>
  )
}
