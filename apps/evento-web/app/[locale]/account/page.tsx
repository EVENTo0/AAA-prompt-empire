import type { Metadata } from 'next'
import Link from 'next/link'
import { engagementById, serviceById, stageById, translator } from '@/lib/content'
import { pick, resolveLocale, type Locale } from '@/lib/i18n'
import { formatDate } from '@/lib/format'
import { activeAccessToken, currentSessionUser } from '@/lib/session'
import { accountsEnabled, listOwnProjectRequests, type ProjectRequestRow } from '@/lib/supabase'
import AuthForm from '@/components/auth-form'
import SignOutButton from '@/components/sign-out-button'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const t = translator(resolveLocale((await params).locale))
  return { title: t('account.title'), description: t('account.lead'), robots: { index: false, follow: false } }
}

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale)
  const t = translator(locale)

  if (!accountsEnabled()) {
    return (
      <section className="section">
        <div className="shell">
          <div className="sectionHead">
            <h1>{t('account.title')}</h1>
          </div>
          <div className="notice info measured">
            <strong>{t('account.disabledTitle')}</strong>
            <p>{t('account.disabledBody')}</p>
          </div>
          <Link href={`/${locale}/contact`} className="button primary">
            {t('nav.contact')}
          </Link>
        </div>
      </section>
    )
  }

  const user = await currentSessionUser()
  if (!user) {
    return (
      <section className="shell authShell">
        <AuthForm locale={locale} />
      </section>
    )
  }

  const token = await activeAccessToken()
  const result = token ? await listOwnProjectRequests(token) : null
  const requests: ProjectRequestRow[] = result?.ok ? result.data : []
  const loadFailed = result !== null && !result.ok

  return (
    <section className="section">
      <div className="shell">
        <div className="sectionHead">
          <p className="eyebrow">{t('account.title')}</p>
          <h1 dir="ltr" className="breakAnywhere">
            {user.email}
          </h1>
          <p className="lead">{t('account.lead')}</p>
        </div>

        <div className="ctaRow tightTop gapBelow">
          <Link href={`/${locale}/contact`} className="button primary">
            {t('nav.contact')}
          </Link>
          <SignOutButton label={t('account.signOut')} locale={locale} />
        </div>

        <h2>{t('account.requests')}</h2>

        {loadFailed ? (
          <p className="notice error" role="alert">
            {t('common.error')}
          </p>
        ) : requests.length === 0 ? (
          <div className="notice info">
            <p>{t('account.noRequests')}</p>
            <p>
              <Link href={`/${locale}/contact`}>{t('account.startFirst')}</Link>
            </p>
          </div>
        ) : (
          <div className="grid">
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function RequestCard({ request, locale }: { request: ProjectRequestRow; locale: Locale }) {
  const t = translator(locale)
  const stage = stageById(request.stage)
  const service = serviceById(request.service_id)
  const engagement = engagementById(request.engagement_id)
  const submitted = formatDate(request.created_at, locale)

  return (
    <article className="requestRow">
      <header>
        <span className="reference">{request.reference}</span>
        <span className="tag">{stage ? pick(stage.name, locale) : request.stage}</span>
      </header>
      <div className="metaRow">
        <span>
          {t('account.submitted')}: {submitted}
        </span>
        {/* Fall back to the raw id if the catalog entry was retired after the
            request was filed, so an old request stays readable. */}
        <span>{service ? pick(service.name, locale) : request.service_id}</span>
        <span>{engagement ? pick(engagement.name, locale) : request.engagement_id}</span>
      </div>
      <p className="summaryText">{request.summary}</p>
    </article>
  )
}
