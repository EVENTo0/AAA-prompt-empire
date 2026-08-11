'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useState } from 'react'

export type NavItem = { href: string; label: string }

type Props = {
  homeHref: string
  brandName: string
  brandSub: string
  items: NavItem[]
  cta: NavItem
  localeSwitch: NavItem
  menuLabel: string
}

export default function SiteHeader({ homeHref, brandName, brandSub, items, cta, localeSwitch, menuLabel }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const panelId = useId()

  // A route change must never leave the mobile panel hanging open behind the
  // new page.
  useEffect(() => setOpen(false), [pathname])

  const current = (href: string) => (pathname === href ? 'page' : undefined)

  return (
    <header className="siteHeader">
      <div className="shell headerRow">
        <Link href={homeHref} className="brand">
          <span className="brandMark" aria-hidden="true">
            EV
          </span>
          <span className="brandText">
            <span className="brandName">{brandName}</span>
            <small>{brandSub}</small>
          </span>
        </Link>

        <nav className="primaryNav" aria-label={menuLabel}>
          {items.map((item) => (
            <Link key={item.href} href={item.href} aria-current={current(item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link href={cta.href} className="button primary headerCta" aria-current={current(cta.href)}>
          {cta.label}
        </Link>

        <Link href={localeSwitch.href} className="localeSwitch" lang={localeSwitch.href.split('/')[1]}>
          {localeSwitch.label}
        </Link>

        <button
          type="button"
          className="navToggle"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true">{open ? '✕' : '☰'}</span>
          <span className="srOnly">{menuLabel}</span>
        </button>
      </div>

      {open ? (
        <div className="shell">
          <nav className="mobileNav" id={panelId} aria-label={menuLabel}>
            {items.map((item) => (
              <Link key={item.href} href={item.href} aria-current={current(item.href)}>
                {item.label}
              </Link>
            ))}
            <Link href={cta.href} aria-current={current(cta.href)}>
              {cta.label}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
