import { MerchantPlanUsage } from '@/components/merchant/MerchantPlanUsage'
import { MerchantWorkspaceShell } from '@/components/merchant/MerchantWorkspaceShell'
import { getMerchantOperatingPlan, getMerchantStoreStatus } from '@/modules/merchant/application/merchant-operating-reads'
import { requireOperatingMerchantPage } from '@/modules/merchant/application/merchant-operating-page'

export const dynamic = 'force-dynamic'

export default async function MerchantPlanPage({ params, searchParams }: { params: { locale: string }; searchParams?: { merchantId?: string } }) {
  const { context } = await requireOperatingMerchantPage({ locale: params.locale, merchantId: searchParams?.merchantId })
  const [commercial, storeStatus] = await Promise.all([
    getMerchantOperatingPlan({ merchantId: context.selectedMerchantId }),
    getMerchantStoreStatus({ merchantId: context.selectedMerchantId }),
  ])
  return <MerchantWorkspaceShell locale={params.locale} merchants={context.merchants} selectedMerchantId={context.selectedMerchantId}>
    <MerchantPlanUsage commercial={commercial} merchantId={context.selectedMerchantId} locale={params.locale} storeStatus={storeStatus} />
  </MerchantWorkspaceShell>
}
