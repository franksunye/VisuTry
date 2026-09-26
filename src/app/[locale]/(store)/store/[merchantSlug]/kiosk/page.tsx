import type { Metadata } from 'next'
import { MerchantKioskRoute } from '@/components/store/MerchantKioskRoute'

export const metadata: Metadata = { robots: { index: false, follow: false } }
export const revalidate = 7 * 24 * 60 * 60
export const dynamicParams = true

export function generateStaticParams() {
  return []
}

export default function MerchantKioskPage({ params }: { params: { locale: string; merchantSlug: string } }) {
  return <MerchantKioskRoute locale={params.locale} merchantSlug={params.merchantSlug} />
}
