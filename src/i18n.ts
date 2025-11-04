/**
 * Internationalization (i18n) Configuration
 *
 * Supports 9 languages for global reach and SEO optimization
 *
 * This configuration can be easily extended to support additional languages
 * by adding new locale codes to the arrays and objects below.
 */

// Supported locales (ordered by preference)
export const locales = ['en', 'id', 'ar', 'ru', 'de', 'ja', 'es', 'pt', 'fr'] as const
export type Locale = typeof locales[number]

// Default locale (fallback)
export const defaultLocale: Locale = 'en'

// Language names in their native form
export const localeNames: Record<Locale, string> = {
  en: 'English',
  id: 'Bahasa Indonesia',
  ar: 'العربية',
  ru: 'Русский',
  de: 'Deutsch',
  ja: '日本語',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
}

// Text direction for each locale
export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  id: 'ltr',
  ar: 'rtl', // Arabic is right-to-left
  ru: 'ltr',
  de: 'ltr',
  ja: 'ltr',
  es: 'ltr',
  pt: 'ltr',
  fr: 'ltr',
}

// Locale to Open Graph locale mapping
// Used for SEO meta tags
export const localeToOGLocale: Record<Locale, string> = {
  en: 'en_US',
  id: 'id_ID',
  ar: 'ar_AR',
  ru: 'ru_RU',
  de: 'de_DE',
  ja: 'ja_JP',
  es: 'es_ES',
  pt: 'pt_PT',
  fr: 'fr_FR',
}

// Language display names for UI (can be different from native names)
export const localeDisplayNames: Record<Locale, string> = {
  en: 'English',
  id: 'Indonesian',
  ar: 'Arabic',
  ru: 'Russian',
  de: 'German',
  ja: 'Japanese',
  es: 'Spanish',
  pt: 'Portuguese',
  fr: 'French',
}

/**
 * Check if a string is a valid locale
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

/**
 * Get locale from string with fallback to default
 */
export function getValidLocale(locale: string | undefined): Locale {
  if (!locale) return defaultLocale
  return isValidLocale(locale) ? locale : defaultLocale
}

