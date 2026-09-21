import { redirect } from 'next/navigation'
import { getMerchantOperatingActivation } from './merchant-operating-reads'
import { requireMerchantWorkspaceContext, type MerchantWorkspaceContext } from './merchant-workspace-context'

export async function requireOperatingMerchantPage(input: {
  locale: string
  merchantId?: string
}): Promise<{ context: MerchantWorkspaceContext }> {
  const context = await requireMerchantWorkspaceContext(input)
  const activation = await getMerchantOperatingActivation({ merchantId: context.selectedMerchantId })
  if (!activation.storePreviewedAt) {
    redirect(`/${input.locale}/merchant?merchantId=${encodeURIComponent(context.selectedMerchantId)}`)
  }
  return { context }
}
