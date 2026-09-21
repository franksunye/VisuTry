import { MerchantWorkspaceDetails } from '@/components/merchant/MerchantControlCenter'
import { MerchantWorkspaceShell } from '@/components/merchant/MerchantWorkspaceShell'
import { requireOperatingMerchantPage } from '@/modules/merchant/application/merchant-operating-page'

export const dynamic = 'force-dynamic'

export default async function MerchantSettingsPage({ params, searchParams }: { params: { locale: string }; searchParams?: { merchantId?: string } }) {
  const { context, control } = await requireOperatingMerchantPage({ locale: params.locale, merchantId: searchParams?.merchantId })
  return <MerchantWorkspaceShell locale={params.locale} merchants={context.merchants} selectedMerchantId={context.selectedMerchantId}>
    <MerchantWorkspaceDetails merchantId={context.selectedMerchantId} initialName={control.merchant.name} initialWebsiteUrl={control.merchant.websiteUrl} />
  </MerchantWorkspaceShell>
}

