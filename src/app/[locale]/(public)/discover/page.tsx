import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { DiscoverPage } from '@/components/discover/DiscoverPage'
import { getDiscoverContent } from '@/modules/store/application/get-discover-content'
import { createStoreRuntime } from '@/modules/store/application/runtime'
import { getDiscoverCopy } from '@/config/discover'
import { isValidLocale, type Locale } from '@/i18n'
import { generateI18nSEO } from '@/lib/seo'

type DiscoverPageProps = {
  params: Promise<{ locale: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata(props: DiscoverPageProps): Promise<Metadata> {
  const params = await props.params;
  setRequestLocale(params.locale)
  const copy = getDiscoverCopy(params.locale)
  const locale = isValidLocale(params.locale) ? params.locale : 'en'

  return generateI18nSEO({
    locale: locale as Locale,
    title: copy.metaTitle,
    description: copy.metaDescription,
    pathname: '/discover',
  })
}

export default async function DiscoverRoute(props: DiscoverPageProps) {
  const params = await props.params;
  if (!isValidLocale(params.locale)) notFound()
  setRequestLocale(params.locale)
  const content = await getDiscoverContent(params.locale, createStoreRuntime())
  return <DiscoverPage content={content} />
}
