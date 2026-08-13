import { getServerSession } from 'next-auth'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getMerchantControlCenter, listMerchantAgentCredentials, listMerchantsForUser, requireMerchantMembership } from '@/modules/merchant'
import { MerchantControlCenter } from '@/components/merchant/MerchantControlCenter'
import { MerchantWorkspaceOnboarding } from '@/components/merchant/MerchantWorkspaceOnboarding'

export const dynamic = 'force-dynamic'

function requestOrigin() {
  const requestHeaders = headers()
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host') || 'www.visutry.com'
  const protocol = requestHeaders.get('x-forwarded-proto') || 'https'
  return `${protocol}://${host}`
}

export default async function MerchantWorkspacePage({ params, searchParams }: { params: { locale: string }; searchParams?: { merchantId?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect(`/${params.locale}/auth/signin?callbackUrl=/${params.locale}/merchant`)

  const merchants = await listMerchantsForUser(session.user.id)
  if (merchants.length === 0) return <MerchantWorkspaceOnboarding locale={params.locale} />
  const selected = searchParams?.merchantId
    ? merchants.find((entry) => entry.merchant.id === searchParams.merchantId)
    : merchants[0]
  if (!selected) notFound()
  await requireMerchantMembership({ userId: session.user.id, merchantId: selected.merchant.id, roles: ['OWNER', 'ADMIN'] })
  const control = await getMerchantControlCenter({ merchantId: selected.merchant.id })
  if (!control) notFound()
  const credentials = await listMerchantAgentCredentials({ userId: session.user.id, merchantId: selected.merchant.id })
  const origin = requestOrigin()
  const skills = [
    { name: 'Merchant Onboarding', purpose: 'Set up your Store from your catalog.', url: `${origin}/skills/merchant-onboarding`, prompt: 'Set up my eyewear Store on VisuTry.' },
    { name: 'Campaign Creation', purpose: 'Create and preview a Campaign draft.', url: `${origin}/skills/campaign-creation`, prompt: 'Create a Campaign for shoppers with small faces.' },
    { name: 'Commerce Analyst', purpose: 'Understand shopper intent and performance.', url: `${origin}/skills/commerce-analyst`, prompt: 'How is my Summer Sunglasses Campaign performing?' },
  ]
  return <MerchantControlCenter locale={params.locale} merchants={merchants.map(({ merchant, membership }) => ({ id: merchant.id, slug: merchant.slug, name: merchant.name, role: membership.role }))} selectedMerchantId={selected.merchant.id} control={control} credentials={credentials} endpoint={`${origin}/api/mcp`} skills={skills} />
}
