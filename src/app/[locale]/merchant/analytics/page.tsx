import { MerchantCommerceIntelligence } from '@/components/merchant/MerchantControlCenter'
import { MerchantWorkspaceShell } from '@/components/merchant/MerchantWorkspaceShell'
import { merchantWorkspaceHref } from '@/modules/merchant/application/merchant-workspace-routes'
import { requireOperatingMerchantPage } from '@/modules/merchant/application/merchant-operating-page'

export const dynamic = 'force-dynamic'

export default async function MerchantAnalyticsPage({ params, searchParams }: { params: { locale: string }; searchParams?: { merchantId?: string } }) {
  const { context, control } = await requireOperatingMerchantPage({ locale: params.locale, merchantId: searchParams?.merchantId })
  return <MerchantWorkspaceShell locale={params.locale} merchants={context.merchants} selectedMerchantId={context.selectedMerchantId}>
    <MerchantCommerceIntelligence insights={control.commerceIntelligence} agentHref={merchantWorkspaceHref({ locale: params.locale, section: 'integrations', merchantId: context.selectedMerchantId })} />
  </MerchantWorkspaceShell>
}

