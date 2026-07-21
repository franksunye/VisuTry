import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales, type Locale } from '@/i18n'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { GoogleTagManager } from '@/components/analytics/GoogleTagManager'
import { LocaleHtmlAttributes } from '@/components/layout/LocaleHtmlAttributes'
import { generateI18nSEO } from '@/lib/seo'
import { Metadata } from 'next'
import { ReactNode } from 'react'

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

  return (
    <>
      <LocaleHtmlAttributes locale={locale as Locale} />
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      {gaId && <GoogleAnalytics gaId={gaId} />}
      <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
    </>
  )
}
