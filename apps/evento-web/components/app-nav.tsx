'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type AppNavItem = { href: string; label: string; icon: string }

/**
 * Bottom navigation shown only when the site is running as an installed app.
 *
 * Visibility is decided in CSS by `@media (display-mode: standalone)` rather
 * than by JavaScript, so there is no flash of the wrong chrome on first paint
 * and no hydration mismatch between server and client.
 */
export default function AppNav({ items, label }: { items: AppNavItem[]; label: string }) {
  const pathname = usePathname()

  return (
    <nav className="appNav" aria-label={label}>
      {items.map((item) => {
        // The home entry is an exact match; the rest match their subtree.
        const isHome = item.href.split('/').length === 2
        const active = isHome ? pathname === item.href : pathname.startsWith(item.href)
        return (
          <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}>
            <span className="appNavIcon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="appNavLabel">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
