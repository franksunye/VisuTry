/**
 * Locale Root Layout
 *
 * This is the root layout for all locale-prefixed routes (e.g. /en, /ar, /ja).
 * It renders <html lang={locale} dir={direction}> with the correct language
 * and text direction attributes baked into the static HTML — no client-side
 * hydration needed, eliminating FOUC for RTL languages.
 *
 * Admin and API routes have their own separate root layouts and do not pass
 * through this file.
 */

import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Inter, Noto_Sans_Arabic } from 'next/font/google'
import { locales, localeDirections, type Locale } from '@/i18n'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { GoogleTagManager } from '@/components/analytics/GoogleTagManager'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { generateI18nSEO } from '@/lib/seo'
import { Metadata } from 'next'
import { ReactNode } from 'react'
import '../globals.css'

// Inter: default font for Latin-script locales (en, id, de, es, pt, fr, ru)
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Noto Sans Arabic: optimized font for Arabic locale
// preload is disabled because the font is only needed on /ar pages;
// next/font will still inline the @font-face and load on demand
const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
  preload: false,
})

type Props = {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  setRequestLocale(params.locale)
  const t = await getTranslations({ locale: params.locale, namespace: 'marketing.home' })

  return generateI18nSEO({
    locale: params.locale as Locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
    pathname: '',
  })
}

export default async function LocaleLayout(props: Props) {
  const params = await props.params
  const locale = params.locale
  const { children } = props

  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  // Enable static rendering for this locale (next-intl requirement)
  setRequestLocale(locale)

  const messages = await getMessages()

  const gaId = process.env.NEXT_PUBLIC_GA_ID
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID

  const direction = localeDirections[locale as Locale]

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className={`${inter.variable} ${notoSansArabic.variable}`} suppressHydrationWarning>
        <SessionProvider>
          {gtmId && <GoogleTagManager gtmId={gtmId} />}
          {gaId && <GoogleAnalytics gaId={gaId} />}
          <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
