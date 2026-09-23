import { redirect } from 'next/navigation'
import { getMerchantWorkspaceMode } from './merchant-operating-reads'
import { requireMerchantWorkspaceContext, type MerchantWorkspaceContext } from './merchant-workspace-context'

export async function requireOperatingMerchantPage(input: {
  locale: string
  merchantId?: string
}): Promise<{ context: MerchantWorkspaceContext }> {
  const context = await requireMerchantWorkspaceContext(input)
  const workspaceMode = await getMerchantWorkspaceMode({ merchantId: context.selectedMerchantId })
  if (workspaceMode.mode !== 'OPERATING') {
    redirect(`/${input.locale}/merchant?merchantId=${encodeURIComponent(context.selectedMerchantId)}`)
  }
  return { context }
}
