export const LOCALES = ['ar', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'ar'

export type Localized = { ar: string; en: string }
export type LocalizedList = { ar: string[]; en: string[] }

export function isLocale(value: string | undefined): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

export function resolveLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE
}

export function direction(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

export function pick(value: Localized, locale: Locale): string {
  return value[locale]
}

export function pickList(value: LocalizedList, locale: Locale): string[] {
  return value[locale]
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'ar' ? 'en' : 'ar'
}

export const localeLabel: Record<Locale, string> = {
  ar: 'العربية',
  en: 'English',
}
