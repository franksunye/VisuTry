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

  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as Locale)) {
    notFound()
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})

