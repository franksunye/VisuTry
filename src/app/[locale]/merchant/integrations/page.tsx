import { MerchantIntegrationsWorkspace } from '@/components/merchant/MerchantIntegrationsWorkspace'
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
  const clientCredentials = credentials.map((credential) => ({
    ...credential,
    createdAt: credential.createdAt.toISOString(),
    lastUsedAt: credential.lastUsedAt?.toISOString() ?? null,
    revokedAt: credential.revokedAt?.toISOString() ?? null,
  }))
  return <MerchantWorkspaceShell locale={params.locale} merchants={context.merchants} selectedMerchantId={context.selectedMerchantId}>
    <MerchantIntegrationsWorkspace key={context.selectedMerchantId} locale={params.locale} merchantId={context.selectedMerchantId} endpoint={config.endpoint} skills={config.skills} initialCredentials={clientCredentials} />
  </MerchantWorkspaceShell>
}
