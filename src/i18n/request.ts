/**
 * next-intl Request Configuration
 * 
 * This file configures how next-intl handles translation requests
 * in Server Components and API routes.
 */

import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales, type Locale } from '@/i18n'

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  return {
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})

