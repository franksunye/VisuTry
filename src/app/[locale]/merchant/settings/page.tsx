import { MerchantWorkspaceSettings } from '@/components/merchant/MerchantWorkspaceSettings'
import { MerchantWorkspaceShell } from '@/components/merchant/MerchantWorkspaceShell'
import { getMerchantWorkspaceDetails } from '@/modules/merchant/application/merchant-operating-reads'
import { requireOperatingMerchantPage } from '@/modules/merchant/application/merchant-operating-page'

export const dynamic = 'force-dynamic'

export default async function MerchantSettingsPage({ params, searchParams }: { params: { locale: string }; searchParams?: { merchantId?: string } }) {
  const { context } = await requireOperatingMerchantPage({ locale: params.locale, merchantId: searchParams?.merchantId })
  const details = await getMerchantWorkspaceDetails({ merchantId: context.selectedMerchantId })
  if (!details) throw new Error('Merchant workspace not found')
  return <MerchantWorkspaceShell locale={params.locale} merchants={context.merchants} selectedMerchantId={context.selectedMerchantId}>
    <MerchantWorkspaceSettings merchantId={context.selectedMerchantId} initialName={details.name} initialWebsiteUrl={details.websiteUrl} />
  </MerchantWorkspaceShell>
}
