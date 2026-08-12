import { stages, translator } from '@/lib/content'
import { pick, type Locale } from '@/lib/i18n'
import { formatIndex } from '@/lib/format'

export default function DeliveryPipeline({ locale, detailed = true }: { locale: Locale; detailed?: boolean }) {
  const t = translator(locale)

  return (
    <ol className="stageList">
      {stages.map((stage) => (
        <li key={stage.id} className="stage">
          <div className="stageTop">
            <span className="stageNumber" aria-hidden="true">
              {formatIndex(stage.order)}
            </span>
            <h3>{pick(stage.name, locale)}</h3>
          </div>
          <p>{pick(stage.body, locale)}</p>

          {detailed ? (
            <dl className="stageMeta">
              <dt>{t('method.evidence')}</dt>
              <dd>{pick(stage.clientEvidence, locale)}</dd>
              <dt>{t('method.gate')}</dt>
              <dd>{stage.gate ? pick(stage.gate, locale) : t('method.noGate')}</dd>
            </dl>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
