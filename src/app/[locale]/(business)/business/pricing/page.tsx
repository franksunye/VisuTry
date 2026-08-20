import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { BusinessMarketingPage } from '@/components/business/BusinessMarketingPage'
import { businessPages } from '@/config/business-site'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const page = businessPages.pricing
  return { title: page.metaTitle, description: page.metaDescription, alternates: { canonical: `https://www.visutry.com/${params.locale}${page.slug}` } }
}

export default function Page({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale)
  return <BusinessMarketingPage locale={params.locale} pageKey="pricing" />
}
