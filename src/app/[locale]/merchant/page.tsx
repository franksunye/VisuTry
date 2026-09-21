import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { listMerchantsForUser } from '@/modules/merchant/application/merchant-memberships'
import { listMerchantAgentCredentials } from '@/modules/merchant/application/merchant-agent-credentials'
import { getMerchantControlCenter } from '@/modules/merchant/application/merchant-control-center'
import { MerchantControlCenter } from '@/components/merchant/MerchantControlCenter'
import { MerchantWorkspaceOnboarding } from '@/components/merchant/MerchantWorkspaceOnboarding'
import { MerchantOperatingHome } from '@/components/merchant/MerchantOperatingHome'
import { MerchantWorkspaceShell } from '@/components/merchant/MerchantWorkspaceShell'
import type { MerchantBillablePlanCode } from '@/modules/merchant/domain/merchant-billing'
import { parseMerchantPurchaseIntent } from '@/modules/merchant/domain/merchant-purchase-intent'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'VisuTry Merchant Workspace',
  description: 'Manage your VisuTry Store, Campaign Experiences, catalog, credentials, and merchant performance signals.',
  robots: { index: false, follow: false },
}

function requestOrigin() {
  const requestHeaders = headers()
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host') || 'www.visutry.com'
  const protocol = requestHeaders.get('x-forwarded-proto') || 'https'
  return `${protocol}://${host}`
}

function billingPlan(value: string | undefined): MerchantBillablePlanCode | undefined {
  const normalized = value?.trim().toUpperCase()
  return normalized === 'LAUNCH' || normalized === 'GROWTH' || normalized === 'SCALE' || normalized === 'FOUNDING_PILOT' ? normalized : undefined
}

export default async function MerchantWorkspacePage({ params, searchParams }: { params: { locale: string }; searchParams?: { merchantId?: string; onboarding?: string; billing?: string; plan?: string; commercialIntent?: string } }) {
  const session = await getServerSession(authOptions)
  const purchaseIntent = parseMerchantPurchaseIntent(searchParams?.commercialIntent)
  if (!session?.user?.id) {
    const callbackUrl = purchaseIntent
      ? `/${params.locale}/merchant?commercialIntent=${purchaseIntent}`
      : `/${params.locale}/merchant`
    const encodedCallback = purchaseIntent ? encodeURIComponent(callbackUrl) : callbackUrl
    redirect(`/${params.locale}/auth/signin?callbackUrl=${encodedCallback}`)
  }

  const merchants = await listMerchantsForUser(session.user.id)
  if (merchants.length === 0) return <MerchantWorkspaceOnboarding locale={params.locale} commercialIntent={purchaseIntent ?? undefined} />
  const selected = searchParams?.merchantId
    ? merchants.find((entry) => entry.merchant.id === searchParams.merchantId)
    : merchants[0]
  if (!selected) notFound()
  if (purchaseIntent && purchaseIntent !== 'FREE') {
    redirect(`/${params.locale}/merchant/purchase?merchantId=${encodeURIComponent(selected.merchant.id)}&commercialIntent=${purchaseIntent}`)
  }
  await requireMerchantMembership({ userId: session.user.id, merchantId: selected.merchant.id, roles: ['OWNER', 'ADMIN'] })
  const control = await getMerchantControlCenter({ merchantId: selected.merchant.id })
  if (!control) notFound()
  const navigationMerchants = merchants.map(({ merchant, membership }) => ({ id: merchant.id, slug: merchant.slug, name: merchant.name, role: membership.role }))
  if (control.activation?.storePreviewedAt) {
    return (
      <MerchantWorkspaceShell locale={params.locale} merchants={navigationMerchants} selectedMerchantId={selected.merchant.id}>
        <MerchantOperatingHome locale={params.locale} merchantId={selected.merchant.id} control={control} />
      </MerchantWorkspaceShell>
    )
  }
  const credentials = await listMerchantAgentCredentials({ userId: session.user.id, merchantId: selected.merchant.id })
  const origin = requestOrigin()
  const skills = [
    { name: 'VisuTry Merchant', purpose: 'Set up your Store, create Campaigns, and understand performance in one conversation.', url: `${origin}/skills/merchant`, prompt: 'Help me set up my VisuTry Store.' },
  ]
  const onboardingState = searchParams?.onboarding === 'created' || searchParams?.onboarding === 'existing'
    ? searchParams.onboarding
    : undefined
  const billingState = searchParams?.billing === 'processing' || searchParams?.billing === 'cancelled'
    ? searchParams.billing
    : undefined
  return <MerchantControlCenter locale={params.locale} merchants={navigationMerchants} selectedMerchantId={selected.merchant.id} control={control} credentials={credentials} endpoint={`${origin}/api/mcp`} skills={skills} onboardingState={onboardingState} billingState={billingState} billingPlan={billingPlan(searchParams?.plan)} />
}
