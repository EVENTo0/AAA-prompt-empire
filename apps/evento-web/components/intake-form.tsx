'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { services, engagements, translator, company } from '@/lib/content'
import { pick, type Locale } from '@/lib/i18n'

type Props = {
  locale: Locale
  defaultService: string
  defaultEngagement: string
  accountEmail: string | null
}

type Outcome =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'done'; reference: string }
  | { kind: 'error'; message: string }
  | { kind: 'unavailable' }

const fieldMessages: Record<string, Record<Locale, string>> = {
  name: { ar: 'الاسم غير صالح.', en: 'Name is not valid.' },
  email: { ar: 'البريد الإلكتروني غير صالح.', en: 'Email address is not valid.' },
  organization: { ar: 'اسم الجهة طويل جداً.', en: 'Organization name is too long.' },
  budget: { ar: 'نطاق الميزانية طويل جداً.', en: 'Budget range is too long.' },
  timeline: { ar: 'الإطار الزمني طويل جداً.', en: 'Timeline is too long.' },
  serviceId: { ar: 'اختر نوع العمل.', en: 'Select the type of work.' },
  engagementId: { ar: 'اختر نمط التعاقد.', en: 'Select an engagement model.' },
  summary: {
    ar: 'صف الهدف بما لا يقل عن ٤٠ حرفاً حتى نتمكن من تقييمه.',
    en: 'Describe the outcome in at least 40 characters so it can be assessed.',
  },
}

export default function IntakeForm({ locale, defaultService, defaultEngagement, accountEmail }: Props) {
  const t = translator(locale)
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'idle' })

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())
    setOutcome({ kind: 'sending' })

    try {
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, locale }),
      })
      const result = (await response.json()) as {
        reference?: string
        error?: string
        failures?: { field: string }[]
      }

      if (response.status === 503 && result.error === 'not-configured') {
        setOutcome({ kind: 'unavailable' })
        return
      }
      if (response.status === 429) {
        setOutcome({
          kind: 'error',
          message: locale === 'ar' ? 'محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.' : 'Too many attempts. Wait a moment and try again.',
        })
        return
      }
      if (!response.ok || !result.reference) {
        const first = result.failures?.[0]?.field
        setOutcome({
          kind: 'error',
          message: (first && fieldMessages[first]?.[locale]) || t('common.error'),
        })
        return
      }

      form.reset()
      setOutcome({ kind: 'done', reference: result.reference })
    } catch {
      setOutcome({ kind: 'error', message: t('common.error') })
    }
  }

  if (outcome.kind === 'done') {
    return (
      <div className="formCard">
        <div className="notice success">
          <h2 className="tightTop">{t('contact.successTitle')}</h2>
          <p>{t('contact.successBody')}</p>
          <p>
            {t('contact.reference')}: <span className="reference">{outcome.reference}</span>
          </p>
        </div>
        <div className="ctaRow">
          <button type="button" className="button secondary" onClick={() => setOutcome({ kind: 'idle' })}>
            {t('contact.another')}
          </button>
          <Link href={`/${locale}/account`} className="button primary">
            {t('nav.account')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form className="formCard" onSubmit={submit} noValidate>
      {outcome.kind === 'error' ? (
        <p className="notice error" role="alert">
          {outcome.message}
        </p>
      ) : null}

      {outcome.kind === 'unavailable' ? (
        <div className="notice info" role="status">
          <strong>{t('contact.fallbackTitle')}</strong>
          <p>{t('contact.fallbackBody')}</p>
          <p>
            <a href={`mailto:${company.contact.projects}`}>{company.contact.projects}</a>
          </p>
        </div>
      ) : null}

      <div className="fieldRow">
        <div className="field">
          <label htmlFor="name">{t('contact.name')}</label>
          <input id="name" name="name" autoComplete="name" required minLength={2} maxLength={120} />
        </div>
        <div className="field">
          <label htmlFor="email">{t('contact.email')}</label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={254}
            defaultValue={accountEmail ?? ''}
            dir="ltr"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="organization">{t('contact.organization')}</label>
        <input id="organization" name="organization" autoComplete="organization" maxLength={160} />
      </div>

      <div className="fieldRow">
        <div className="field">
          <label htmlFor="serviceId">{t('contact.service')}</label>
          <select id="serviceId" name="serviceId" required defaultValue={defaultService}>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {pick(service.name, locale)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="engagementId">{t('contact.engagement')}</label>
          <select id="engagementId" name="engagementId" required defaultValue={defaultEngagement}>
            {engagements.map((engagement) => (
              <option key={engagement.id} value={engagement.id}>
                {pick(engagement.name, locale)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="fieldRow">
        <div className="field">
          <label htmlFor="budget">{t('contact.budget')}</label>
          <input id="budget" name="budget" maxLength={80} />
        </div>
        <div className="field">
          <label htmlFor="timeline">{t('contact.timeline')}</label>
          <input id="timeline" name="timeline" maxLength={80} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="summary">{t('contact.summary')}</label>
        <span className="hint">{t('contact.summaryHint')}</span>
        <textarea id="summary" name="summary" required minLength={40} maxLength={4000} />
      </div>

      <button type="submit" className="button primary" disabled={outcome.kind === 'sending'}>
        {outcome.kind === 'sending' ? t('contact.submitting') : t('contact.submit')}
      </button>

      <p className="hint gapAbove">
        {t('contact.privacy')}
      </p>
    </form>
  )
}
