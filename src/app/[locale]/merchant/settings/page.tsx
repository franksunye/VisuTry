import { MerchantWorkspaceSettings } from '@/components/merchant/MerchantWorkspaceSettings'
import { MerchantWorkspaceShell } from '@/components/merchant/MerchantWorkspaceShell'
import { getMerchantBrandWorkspace } from '@/modules/merchant/application/merchant-brand-kit'
import { getMerchantWorkspaceDetails } from '@/modules/merchant/application/merchant-operating-reads'
import { requireOperatingMerchantPage } from '@/modules/merchant/application/merchant-operating-page'

export const dynamic = 'force-dynamic'

export default async function MerchantSettingsPage({ params, searchParams }: { params: { locale: string }; searchParams?: { merchantId?: string } }) {
  const { context } = await requireOperatingMerchantPage({ locale: params.locale, merchantId: searchParams?.merchantId })
  const [details, brand] = await Promise.all([
    getMerchantWorkspaceDetails({ merchantId: context.selectedMerchantId }),
    getMerchantBrandWorkspace(context.selectedMerchantId),
  ])
  if (!details) throw new Error('Merchant workspace not found')
  return <MerchantWorkspaceShell locale={params.locale} merchants={context.merchants} selectedMerchantId={context.selectedMerchantId}>
    <MerchantWorkspaceSettings merchantId={context.selectedMerchantId} initialName={details.name} initialWebsiteUrl={details.websiteUrl} initialLogoUrl={brand.logoUrl} initialAccentColor={brand.accentColor} liveExperiences={brand.liveExperiences} brandOwner={context.merchants.find(m => m.id === context.selectedMerchantId)?.role === 'OWNER'} />
  </MerchantWorkspaceShell>
}
