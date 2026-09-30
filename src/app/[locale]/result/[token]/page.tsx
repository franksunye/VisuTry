import { notFound } from 'next/navigation'
import { getDecisionResultView } from '@/modules/store/application'
import { DecisionResultPageClient } from '@/components/store/DecisionResultPageClient'

export const dynamic = 'force-dynamic'

export default async function DecisionResultPage(
  props: { params: Promise<{ locale: string; token: string }>; searchParams?: Promise<{ deliveryProfile?: string }> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const result = await getDecisionResultView(params.token)
  if (!result) notFound()
  return <DecisionResultPageClient locale={params.locale} token={params.token} result={result} kioskMode={searchParams?.deliveryProfile === 'kiosk' && result.experience?.deliveryPolicy.kioskEnabled === true} />
}
