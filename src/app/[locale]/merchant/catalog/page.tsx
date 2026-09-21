import { MerchantCatalogSelfService } from '@/components/merchant/MerchantCatalogSelfService'
import { MerchantWorkspaceShell } from '@/components/merchant/MerchantWorkspaceShell'
import { getMerchantCatalogCount } from '@/modules/merchant/application/merchant-operating-reads'
import { requireOperatingMerchantPage } from '@/modules/merchant/application/merchant-operating-page'

export const dynamic = 'force-dynamic'

export default async function MerchantCatalogPage({ params, searchParams }: { params: { locale: string }; searchParams?: { merchantId?: string } }) {
  const { context } = await requireOperatingMerchantPage({ locale: params.locale, merchantId: searchParams?.merchantId })
  const initialTotal = await getMerchantCatalogCount({ merchantId: context.selectedMerchantId })
  return <MerchantWorkspaceShell locale={params.locale} merchants={context.merchants} selectedMerchantId={context.selectedMerchantId}>
    <MerchantCatalogSelfService merchantId={context.selectedMerchantId} initialTotal={initialTotal} />
  </MerchantWorkspaceShell>
}
