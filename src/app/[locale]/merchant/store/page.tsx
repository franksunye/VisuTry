import { MerchantStoreSelfService } from '@/components/merchant/MerchantStoreSelfService'
import { MerchantWorkspaceShell } from '@/components/merchant/MerchantWorkspaceShell'
import { requireOperatingMerchantPage } from '@/modules/merchant/application/merchant-operating-page'

export const dynamic = 'force-dynamic'

export default async function MerchantStorePage({ params, searchParams }: { params: { locale: string }; searchParams?: { merchantId?: string } }) {
  const { context, control } = await requireOperatingMerchantPage({ locale: params.locale, merchantId: searchParams?.merchantId })
  return <MerchantWorkspaceShell locale={params.locale} merchants={context.merchants} selectedMerchantId={context.selectedMerchantId}>
    <MerchantStoreSelfService merchantId={context.selectedMerchantId} initialCatalogCount={control.catalog.total} catalogAvailable={control.catalog.total > 0} />
  </MerchantWorkspaceShell>
}
