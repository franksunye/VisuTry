import { MerchantAnalyticsWorkspace } from '@/components/merchant/MerchantAnalyticsWorkspace'
import { MerchantWorkspaceShell } from '@/components/merchant/MerchantWorkspaceShell'
import { getMerchantOperatingAnalytics } from '@/modules/merchant/application/merchant-operating-reads'
import { requireOperatingMerchantPage } from '@/modules/merchant/application/merchant-operating-page'

export const dynamic = 'force-dynamic'

type AnalyticsWindow = 7 | 30 | 90

function requestedWindow(value: string | undefined): AnalyticsWindow {
  return value === '7' || value === '7d' ? 7 : value === '90' || value === '90d' ? 90 : 30
}

export default async function MerchantAnalyticsPage({ params, searchParams }: { params: { locale: string }; searchParams?: { merchantId?: string; range?: string } }) {
  const { context } = await requireOperatingMerchantPage({ locale: params.locale, merchantId: searchParams?.merchantId })
  const rangeDays = requestedWindow(searchParams?.range)
  const to = new Date()
  const from = new Date(to.getTime() - rangeDays * 86_400_000)
  const insights = await getMerchantOperatingAnalytics({ merchantId: context.selectedMerchantId, from, to })
  return <MerchantWorkspaceShell locale={params.locale} merchants={context.merchants} selectedMerchantId={context.selectedMerchantId}>
    <MerchantAnalyticsWorkspace locale={params.locale} merchantId={context.selectedMerchantId} insights={insights} rangeDays={rangeDays} />
  </MerchantWorkspaceShell>
}
