/**
 * next-intl Request Configuration
 *
 * This file configures how next-intl handles translation requests
 * in Server Components and API routes.
 */

import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales, type Locale } from '@/i18n'

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale

  // For routes without locale (e.g., /admin, /api), use default locale
  // This prevents build errors when next-intl processes non-i18n routes
  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'en' // Use default locale for non-i18n routes
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})

