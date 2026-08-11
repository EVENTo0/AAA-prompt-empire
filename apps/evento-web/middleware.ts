import { NextResponse, type NextRequest } from 'next/server'
import { DEFAULT_LOCALE, LOCALES, isLocale } from '@/lib/i18n'
import { cookieNames } from '@/lib/locale-cookie'

/**
 * Every page lives under `/<locale>/…` so each language has a real, indexable
 * URL. Requests that arrive without a locale segment are rewritten onto the
 * visitor's remembered locale, falling back to `Accept-Language` and then to
 * the default.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const [, first] = pathname.split('/')
  if (isLocale(first)) return NextResponse.next()

  const locale = preferredLocale(request)
  const url = request.nextUrl.clone()
  url.pathname = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`
  return NextResponse.redirect(url)
}

function preferredLocale(request: NextRequest) {
  const remembered = request.cookies.get(cookieNames.locale)?.value
  if (isLocale(remembered)) return remembered

  const header = request.headers.get('accept-language') ?? ''
  for (const part of header.split(',')) {
    const tag = part.split(';')[0]?.trim().toLowerCase()
    const base = tag?.split('-')[0]
    if (base && (LOCALES as readonly string[]).includes(base)) return base
  }
  return DEFAULT_LOCALE
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|sw\\.js|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml|icon.*\\.svg|favicon\\.ico).*)'],
}
