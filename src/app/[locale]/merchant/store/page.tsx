import { MerchantStoreWorkspace } from '@/components/merchant/MerchantStoreWorkspace'
import { MerchantWorkspaceShell } from '@/components/merchant/MerchantWorkspaceShell'
import { requireOperatingMerchantPage } from '@/modules/merchant/application/merchant-operating-page'

export const dynamic = 'force-dynamic'

export default async function MerchantStorePage(
  props: { params: Promise<{ locale: string }>; searchParams?: Promise<{ merchantId?: string }> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { context } = await requireOperatingMerchantPage({ locale: params.locale, merchantId: searchParams?.merchantId })
  return <MerchantWorkspaceShell locale={params.locale} merchants={context.merchants} selectedMerchantId={context.selectedMerchantId}>
    <MerchantStoreWorkspace key={context.selectedMerchantId} merchantId={context.selectedMerchantId} locale={params.locale} />
  </MerchantWorkspaceShell>
}
