import type { Locale } from '@/lib/i18n'

/**
 * One decision about digits, enforced in one place.
 *
 * The site uses **Western digits in both languages**. Two reasons, and they
 * are design reasons rather than preferences:
 *
 * 1. Records are set in the ledger typeface, which carries Latin glyphs only.
 *    Arabic-Indic digits inside it would silently fall back to another face
 *    and break the alignment that tabular figures exist to provide.
 * 2. A reference code (`EV-2026-83BD7C`) is quoted in emails, invoices and
 *    support threads. Mixing numeral systems between the code and the dates
 *    beside it makes them harder to read back.
 *
 * Arabic month names are kept — only the numerals are unified, via the
 * `-u-nu-latn` numbering-system extension.
 */

const numberLocale: Record<Locale, string> = {
  ar: 'ar-u-nu-latn',
  en: 'en-GB',
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(numberLocale[locale]).format(value)
}

export function formatDate(value: string | Date, locale: Locale): string {
  return new Intl.DateTimeFormat(numberLocale[locale], {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(value))
}

/** Ledger index for an ordered sequence: 01, 02 … */
export function formatIndex(value: number): string {
  return String(value).padStart(2, '0')
}
