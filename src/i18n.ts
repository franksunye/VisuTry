/**
 * Internationalization (i18n) Configuration
 * 
 * MVP Version: Supports 3 languages (English, Indonesian, Spanish)
 * 
 * This configuration can be easily extended to support additional languages
 * by adding new locale codes to the arrays and objects below.
 */

// Supported locales for MVP
export const locales = ['en', 'id', 'es'] as const
export type Locale = typeof locales[number]

// Default locale (fallback)
export const defaultLocale: Locale = 'en'

// Language names in their native form
export const localeNames: Record<Locale, string> = {
  en: 'English',
  id: 'Bahasa Indonesia',
  es: 'Español',
}

// Text direction for each locale
export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  id: 'ltr',
  es: 'ltr',
}

// Locale to Open Graph locale mapping
// Used for SEO meta tags
export const localeToOGLocale: Record<Locale, string> = {
  en: 'en_US',
  id: 'id_ID',
  es: 'es_ES',
}

// Language display names for UI (can be different from native names)
export const localeDisplayNames: Record<Locale, string> = {
  en: 'English',
  id: 'Indonesian',
  es: 'Spanish',
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

