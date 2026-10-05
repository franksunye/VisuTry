import { MerchantCatalogWorkspace } from '@/components/merchant/MerchantCatalogWorkspace'
import { MerchantWorkspaceShell } from '@/components/merchant/MerchantWorkspaceShell'
import { requireOperatingMerchantPage } from '@/modules/merchant/application/merchant-operating-page'

export const dynamic = 'force-dynamic'

export default async function MerchantCatalogPage({ params, searchParams }: { params: { locale: string }; searchParams?: { merchantId?: string; frameId?: string } }) {
  const { context } = await requireOperatingMerchantPage({ locale: params.locale, merchantId: searchParams?.merchantId })
  const frameId = searchParams?.frameId?.trim()
  return <MerchantWorkspaceShell locale={params.locale} merchants={context.merchants} selectedMerchantId={context.selectedMerchantId}>
    <MerchantCatalogWorkspace key={context.selectedMerchantId} merchantId={context.selectedMerchantId} locale={params.locale} initialFrameId={frameId && frameId.length <= 120 ? frameId : undefined} />
  </MerchantWorkspaceShell>
}
