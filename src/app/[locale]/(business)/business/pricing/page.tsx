import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { BusinessMarketingPage } from '@/components/business/BusinessMarketingPage'
import { businessPageMetadata } from '@/lib/business-metadata'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return businessPageMetadata(params.locale, 'pricing')
}

export default function Page({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale)
  return (
    <div className="[&>main>section:last-child]:hidden">
      <BusinessMarketingPage locale={params.locale} pageKey="pricing" />
    </div>
  )
}
