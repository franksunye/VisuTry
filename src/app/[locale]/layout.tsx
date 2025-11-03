import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Inter } from 'next/font/google'
import { locales, type Locale, localeDirections } from '@/i18n'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { GoogleTagManager } from '@/components/analytics/GoogleTagManager'
import { generateI18nSEO, SITE_CONFIG } from '@/lib/seo'
import { Metadata } from 'next'
import { ReactNode } from 'react'

const inter = Inter({ subsets: ['latin'] })

type Props = {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const t = await getTranslations({ locale: params.locale, namespace: 'meta.home' })

  return generateI18nSEO({
    locale: params.locale as Locale,
    title: t('title'),
    description: t('description'),
    pathname: '',
  })
}

export default async function LocaleLayout(props: Props) {
  const params = await props.params
  const locale = params.locale
  const { children } = props

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  // Providing all messages to the client side
  const messages = await getMessages()

  const gaId = process.env.NEXT_PUBLIC_GA_ID
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID

  return (
    <html lang={locale} dir={localeDirections[locale as Locale]}>
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />

        {/* DNS prefetch for additional performance */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className={inter.className}>
        {/* Google Tag Manager */}
        {gtmId && <GoogleTagManager gtmId={gtmId} />}

        {/* Google Analytics */}
        {gaId && <GoogleAnalytics gaId={gaId} />}

        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

