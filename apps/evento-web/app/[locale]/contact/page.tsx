import type { Metadata } from 'next'
import { engagements, serviceById, services, translator } from '@/lib/content'
import { localeAlternates } from '@/lib/routes'
import { resolveLocale } from '@/lib/i18n'
import { currentSessionUser } from '@/lib/session'
import { accountsEnabled } from '@/lib/supabase'
import IntakeForm from '@/components/intake-form'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale)
  const t = translator(locale)
  return { title: t('contact.title'), description: t('contact.lead'), alternates: localeAlternates(locale, '/contact') }
}

export const dynamic = 'force-dynamic'

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const locale = resolveLocale((await params).locale)
  const query = await searchParams
  const t = translator(locale)

  const requested = typeof query.service === 'string' ? query.service : ''
  const defaultService = serviceById(requested)?.id ?? services[0].id

  const user = accountsEnabled() ? await currentSessionUser() : null

  return (
    <section className="section">
      <div className="shell">
        <div className="sectionHead">
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h1>{t('contact.title')}</h1>
          <p className="lead">{t('contact.lead')}</p>
        </div>

        <IntakeForm
          locale={locale}
          defaultService={defaultService}
          defaultEngagement={engagements[0].id}
          accountEmail={user?.email ?? null}
        />
      </div>
    </section>
  )
}
