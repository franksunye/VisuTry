import { MerchantCampaignsWorkspace } from '@/components/merchant/MerchantCampaignsWorkspace'
import { MerchantWorkspaceShell } from '@/components/merchant/MerchantWorkspaceShell'
import { requireOperatingMerchantPage } from '@/modules/merchant/application/merchant-operating-page'
import { listCampaigns, type CampaignReadModel } from '@/modules/store/application/campaign-service'

export const dynamic = 'force-dynamic'

export default async function MerchantCampaignsPage({ params, searchParams }: { params: { locale: string }; searchParams?: { merchantId?: string } }) {
  const { context } = await requireOperatingMerchantPage({ locale: params.locale, merchantId: searchParams?.merchantId })
  const items: CampaignReadModel[] = []
  let cursor: string | null = null
  do {
    const page = await listCampaigns({ merchantId: context.selectedMerchantId, ...(cursor ? { cursor } : {}), limit: 100 })
    items.push(...page.items)
    cursor = page.nextCursor
  } while (cursor)
  return <MerchantWorkspaceShell locale={params.locale} merchants={context.merchants} selectedMerchantId={context.selectedMerchantId}>
    <MerchantCampaignsWorkspace locale={params.locale} merchantId={context.selectedMerchantId} campaigns={items} />
  </MerchantWorkspaceShell>
}
