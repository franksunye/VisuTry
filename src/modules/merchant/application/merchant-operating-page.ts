import { redirect } from 'next/navigation'
import { getMerchantControlCenter, type MerchantControlCenter } from './merchant-control-center'
import { requireMerchantWorkspaceContext, type MerchantWorkspaceContext } from './merchant-workspace-context'

export async function requireOperatingMerchantPage(input: {
  locale: string
  merchantId?: string
}): Promise<{ context: MerchantWorkspaceContext; control: MerchantControlCenter }> {
  const context = await requireMerchantWorkspaceContext(input)
  const control = await getMerchantControlCenter({ merchantId: context.selectedMerchantId })
  if (!control) redirect(`/${input.locale}/merchant?merchantId=${encodeURIComponent(context.selectedMerchantId)}`)
  if (!control.activation?.storePreviewedAt) {
    redirect(`/${input.locale}/merchant?merchantId=${encodeURIComponent(context.selectedMerchantId)}`)
  }
  return { context, control }
}

