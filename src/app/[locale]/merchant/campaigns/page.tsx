import { MerchantCampaignsWorkspace } from '@/components/merchant/MerchantCampaignsWorkspace'
import { MerchantWorkspaceShell } from '@/components/merchant/MerchantWorkspaceShell'
import { getMerchantCampaignExperiences } from '@/modules/merchant/application/merchant-operating-reads'
import { requireOperatingMerchantPage } from '@/modules/merchant/application/merchant-operating-page'

export const dynamic = 'force-dynamic'

export default async function MerchantCampaignsPage({ params, searchParams }: { params: { locale: string }; searchParams?: { merchantId?: string } }) {
  const { context } = await requireOperatingMerchantPage({ locale: params.locale, merchantId: searchParams?.merchantId })
  const experiences = await getMerchantCampaignExperiences({ merchantId: context.selectedMerchantId })
  return <MerchantWorkspaceShell locale={params.locale} merchants={context.merchants} selectedMerchantId={context.selectedMerchantId}>
    <MerchantCampaignsWorkspace locale={params.locale} merchantId={context.selectedMerchantId} experiences={experiences} />
  </MerchantWorkspaceShell>
}
