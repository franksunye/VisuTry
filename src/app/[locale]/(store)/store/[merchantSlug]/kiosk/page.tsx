import type { Metadata } from 'next'
import { MerchantKioskRoute } from '@/components/store/MerchantKioskRoute'

export const metadata: Metadata = { robots: { index: false, follow: false } }
export const revalidate = 604800
export const dynamicParams = true

export function generateStaticParams() {
  return []
}

export default async function MerchantKioskPage(props: { params: Promise<{ locale: string; merchantSlug: string }> }) {
  const params = await props.params;
  return <MerchantKioskRoute locale={params.locale} merchantSlug={params.merchantSlug} />
}
