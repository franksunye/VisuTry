import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { BusinessMarketingPage } from '@/components/business/BusinessMarketingPage'
import { businessPageMetadata } from '@/lib/business-metadata'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return businessPageMetadata(params.locale, 'pilot')
}

export default function Page({ params, searchParams }: {
  params: { locale: string }
  searchParams?: { plan?: string | string[] }
}) {
  setRequestLocale(params.locale)
  const plan = Array.isArray(searchParams?.plan) ? searchParams.plan[0] : searchParams?.plan
  const pilotIntent = plan === 'enterprise' ? 'enterprise_inquiry' : 'pilot_request'
  return <BusinessMarketingPage locale={params.locale} pageKey="pilot" pilotIntent={pilotIntent} />
}
