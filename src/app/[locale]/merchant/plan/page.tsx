import { MerchantPlanUsage } from '@/components/merchant/MerchantPlanUsage'
import { MerchantWorkspaceShell } from '@/components/merchant/MerchantWorkspaceShell'
import { requireOperatingMerchantPage } from '@/modules/merchant/application/merchant-operating-page'

export const dynamic = 'force-dynamic'

export default async function MerchantPlanPage({ params, searchParams }: { params: { locale: string }; searchParams?: { merchantId?: string } }) {
  const { context, control } = await requireOperatingMerchantPage({ locale: params.locale, merchantId: searchParams?.merchantId })
  return <MerchantWorkspaceShell locale={params.locale} merchants={context.merchants} selectedMerchantId={context.selectedMerchantId}>
    {control.commercial ? <MerchantPlanUsage commercial={control.commercial} merchantId={context.selectedMerchantId} locale={params.locale} storeStatus={control.store?.status ?? null} /> : <p className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-8 text-sm text-slate-500">Plan information is not available yet.</p>}
  </MerchantWorkspaceShell>
}

