import Link from 'next/link'
import { company, translator } from '@/lib/content'
import type { Locale } from '@/lib/i18n'
import { navItems } from '@/lib/routes'

export default function SiteFooter({ locale }: { locale: Locale }) {
  const t = translator(locale)
  const year = new Date().getUTCFullYear()

  return (
    <footer className="siteFooter">
      <div className="shell">
        <div className="footerGrid">
          <div>
            <h4>{company.shortName}</h4>
            <p className="muted">{t('footer.evidence')}</p>
          </div>

          <div>
            <h4>{t('nav.menu')}</h4>
            <ul className="footerLinks">
              {navItems(locale).map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{t(item.key)}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>{t('about.contactTitle')}</h4>
            <ul className="footerLinks">
              <li>
                <a href={`mailto:${company.contact.email}`}>{company.contact.email}</a>
              </li>
              <li>
                <a href={company.contact.github} rel="noreferrer noopener">
                  GitHub
                </a>
              </li>
              <li>
                <Link href={`/${locale}/account`}>{t('nav.account')}</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="footerBase">
          <span>
            © {year} {company.legalName}. {t('footer.rights')}.
          </span>
          <span>v{company.version}</span>
        </div>
      </div>
    </footer>
  )
}
