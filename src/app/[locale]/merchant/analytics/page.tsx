import { MerchantCommerceIntelligence } from '@/components/merchant/MerchantControlCenter'
import { MerchantWorkspaceShell } from '@/components/merchant/MerchantWorkspaceShell'
import { getMerchantOperatingAnalytics } from '@/modules/merchant/application/merchant-operating-reads'
import { merchantWorkspaceHref } from '@/modules/merchant/application/merchant-workspace-routes'
import { requireOperatingMerchantPage } from '@/modules/merchant/application/merchant-operating-page'

export const dynamic = 'force-dynamic'

export default async function MerchantAnalyticsPage({ params, searchParams }: { params: { locale: string }; searchParams?: { merchantId?: string } }) {
  const { context } = await requireOperatingMerchantPage({ locale: params.locale, merchantId: searchParams?.merchantId })
  const insights = await getMerchantOperatingAnalytics({ merchantId: context.selectedMerchantId })
  return <MerchantWorkspaceShell locale={params.locale} merchants={context.merchants} selectedMerchantId={context.selectedMerchantId}>
    <MerchantCommerceIntelligence insights={insights} agentHref={merchantWorkspaceHref({ locale: params.locale, section: 'integrations', merchantId: context.selectedMerchantId })} />
  </MerchantWorkspaceShell>
}
