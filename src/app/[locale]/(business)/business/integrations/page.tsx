import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { BusinessMarketingPage } from '@/components/business/BusinessMarketingPage'
import { businessPageMetadata } from '@/lib/business-metadata'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  return businessPageMetadata(params.locale, 'integrations')
}

export default async function Page(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  setRequestLocale(params.locale)
  return <BusinessMarketingPage locale={params.locale} pageKey="integrations" />
}
