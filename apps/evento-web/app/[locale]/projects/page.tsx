import type { Metadata } from 'next'
import { translator } from '@/lib/content'
import { localeAlternates } from '@/lib/routes'
import { resolveLocale } from '@/lib/i18n'
import ProjectGrid from '@/components/project-grid'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale)
  const t = translator(locale)
  return { title: t('projects.title'), description: t('projects.lead'), alternates: localeAlternates(locale, '/projects') }
}

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale)
  const t = translator(locale)

  return (
    <section className="section">
      <div className="shell">
        <div className="sectionHead">
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h1>{t('projects.title')}</h1>
          <p className="lead">{t('projects.lead')}</p>
        </div>
        <ProjectGrid locale={locale} />
      </div>
    </section>
  )
}
