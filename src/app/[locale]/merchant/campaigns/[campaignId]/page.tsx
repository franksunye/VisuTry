import { notFound } from 'next/navigation'
import { MerchantCampaignDetailWorkspace } from '@/components/merchant/MerchantCampaignDetailWorkspace'
import { MerchantWorkspaceShell } from '@/components/merchant/MerchantWorkspaceShell'
import { MerchantAccessError } from '@/modules/merchant/application/merchant-access'
import { requireOperatingMerchantPage } from '@/modules/merchant/application/merchant-operating-page'
import { getCampaign } from '@/modules/store/application/campaign-service'

export const dynamic = 'force-dynamic'

export default async function MerchantCampaignDetailPage({ params, searchParams }: {
  params: { locale: string; campaignId: string }
  searchParams?: { merchantId?: string }
}) {
  const { context } = await requireOperatingMerchantPage({ locale: params.locale, merchantId: searchParams?.merchantId })
  let campaign
  try {
    campaign = await getCampaign({ merchantId: context.selectedMerchantId, campaignId: params.campaignId })
  } catch (error) {
    if (error instanceof MerchantAccessError) notFound()
    throw error
  }
  const merchant = context.merchants.find((item) => item.id === context.selectedMerchantId)
  if (!merchant) notFound()
  return <MerchantWorkspaceShell locale={params.locale} merchants={context.merchants} selectedMerchantId={context.selectedMerchantId}>
    <MerchantCampaignDetailWorkspace locale={params.locale} merchantId={context.selectedMerchantId} merchantName={merchant.name} initialCampaign={campaign} />
  </MerchantWorkspaceShell>
}
