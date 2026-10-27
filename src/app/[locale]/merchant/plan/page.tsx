import { getMerchantAiUsageSnapshot } from '@/modules/merchant/application/merchant-ai-usage-snapshot'
import { MerchantPlanUsage } from '@/components/merchant/MerchantPlanUsage'
import { MerchantWorkspaceShell } from '@/components/merchant/MerchantWorkspaceShell'
import { getMerchantOperatingPlan, getMerchantStoreStatus } from '@/modules/merchant/application/merchant-operating-reads'
import { requireOperatingMerchantPage } from '@/modules/merchant/application/merchant-operating-page'

export const dynamic = 'force-dynamic'

export default async function MerchantPlanPage({ params, searchParams }: { params: { locale: string }; searchParams?: { merchantId?: string } }) {
  const { context } = await requireOperatingMerchantPage({ locale: params.locale, merchantId: searchParams?.merchantId })
  const [commercial, storeStatus, aiUsage] = await Promise.all([
    getMerchantOperatingPlan({ merchantId: context.selectedMerchantId }),
    getMerchantStoreStatus({ merchantId: context.selectedMerchantId }),
    getMerchantAiUsageSnapshot(context.selectedMerchantId),
  ])
  return <MerchantWorkspaceShell locale={params.locale} merchants={context.merchants} selectedMerchantId={context.selectedMerchantId}>
    <MerchantPlanUsage aiUsage={aiUsage} commercial={commercial} merchantId={context.selectedMerchantId} locale={params.locale} storeStatus={storeStatus} />
  </MerchantWorkspaceShell>
}
