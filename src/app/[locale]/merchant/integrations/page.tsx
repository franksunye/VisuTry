import { MerchantAgentAccess } from '@/components/merchant/MerchantControlCenter'
import { MerchantWorkspaceShell } from '@/components/merchant/MerchantWorkspaceShell'
import { getMerchantWorkspaceAgentConfig } from '@/modules/merchant/application/merchant-workspace-agent'
import { listMerchantAgentCredentials } from '@/modules/merchant/application/merchant-agent-credentials'
import { requireOperatingMerchantPage } from '@/modules/merchant/application/merchant-operating-page'

export const dynamic = 'force-dynamic'

export default async function MerchantIntegrationsPage({ params, searchParams }: { params: { locale: string }; searchParams?: { merchantId?: string } }) {
  const { context } = await requireOperatingMerchantPage({ locale: params.locale, merchantId: searchParams?.merchantId })
  const [credentials, config] = await Promise.all([
    listMerchantAgentCredentials({ userId: context.userId, merchantId: context.selectedMerchantId }),
    getMerchantWorkspaceAgentConfig(),
  ])
  return <MerchantWorkspaceShell locale={params.locale} merchants={context.merchants} selectedMerchantId={context.selectedMerchantId}>
    <MerchantAgentAccess merchantId={context.selectedMerchantId} endpoint={config.endpoint} skills={config.skills} initialCredentials={credentials} />
  </MerchantWorkspaceShell>
}
