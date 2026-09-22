import { MerchantAnalyticsWorkspace } from '@/components/merchant/MerchantAnalyticsWorkspace'
import { MerchantWorkspaceShell } from '@/components/merchant/MerchantWorkspaceShell'
import { getMerchantOperatingAnalytics } from '@/modules/merchant/application/merchant-operating-reads'
import { requireOperatingMerchantPage } from '@/modules/merchant/application/merchant-operating-page'

export const dynamic = 'force-dynamic'

export default async function MerchantAnalyticsPage({ params, searchParams }: { params: { locale: string }; searchParams?: { merchantId?: string } }) {
  const { context } = await requireOperatingMerchantPage({ locale: params.locale, merchantId: searchParams?.merchantId })
  const insights = await getMerchantOperatingAnalytics({ merchantId: context.selectedMerchantId })
  return <MerchantWorkspaceShell locale={params.locale} merchants={context.merchants} selectedMerchantId={context.selectedMerchantId}>
    <MerchantAnalyticsWorkspace locale={params.locale} merchantId={context.selectedMerchantId} insights={insights} />
  </MerchantWorkspaceShell>
}
