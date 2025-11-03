import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Inter } from 'next/font/google'
import { locales, type Locale, localeDirections } from '@/i18n'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { GoogleTagManager } from '@/components/analytics/GoogleTagManager'
import { ReactNode } from 'react'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

type Props = {
  children: ReactNode
  params: { locale: string }
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: Props) {
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

        <SessionProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  )
}

