import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-runtime'
import { listMerchantsForUser } from '@/modules/merchant/application/merchant-memberships'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { getMerchantCommercialState } from '@/modules/merchant/application/merchant-commercial-entitlements'
import { getMerchantBillingState, hasMerchantFoundingPilotReceipt } from '@/modules/merchant/application/merchant-billing'
import { getMerchantPlanDefinition } from '@/modules/merchant/domain/merchant-commercial-plans'
import {
  merchantBillablePlanFromPurchaseIntent,
  parseMerchantPurchaseIntent,
  resolveMerchantPurchaseAction,
} from '@/modules/merchant/domain/merchant-purchase-intent'
import { MerchantPurchaseSummary } from '@/components/merchant/MerchantPurchaseSummary'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Choose your VisuTry Merchant plan',
  description: 'Review your VisuTry Merchant plan before secure checkout.',
  robots: { index: false, follow: false },
}

type Props = {
  params: { locale: string }
  searchParams?: { merchantId?: string; commercialIntent?: string }
}

export default async function MerchantPurchasePage({ params, searchParams }: Props) {
  const intent = parseMerchantPurchaseIntent(searchParams?.commercialIntent)
  if (!intent || intent === 'FREE') redirect(`/${params.locale}/business/pricing`)

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    const callbackUrl = `/${params.locale}/merchant?commercialIntent=${intent}`
    redirect(`/${params.locale}/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  const merchants = await listMerchantsForUser(session.user.id)
  if (merchants.length === 0) redirect(`/${params.locale}/merchant?commercialIntent=${intent}`)

  const selected = searchParams?.merchantId
    ? merchants.find((entry) => entry.merchant.id === searchParams.merchantId)
    : merchants[0]
  if (!selected) notFound()

  await requireMerchantMembership({ userId: session.user.id, merchantId: selected.merchant.id, roles: ['OWNER', 'ADMIN'] })
  const [commercial, billingState, foundingPilotConsumed] = await Promise.all([
    getMerchantCommercialState({ merchantId: selected.merchant.id }),
    getMerchantBillingState({ merchantId: selected.merchant.id }),
    intent === 'FOUNDING_PILOT'
      ? hasMerchantFoundingPilotReceipt({ merchantId: selected.merchant.id })
      : Promise.resolve(false),
  ])
  const planCode = merchantBillablePlanFromPurchaseIntent(intent)
  const action = resolveMerchantPurchaseAction({
    intent,
    currentPlanCode: commercial.planCode,
    commercialStatus: commercial.status,
    billingState: billingState.state,
    foundingPilotConsumed,
  })

  return <MerchantPurchaseSummary
    locale={params.locale}
    merchantId={selected.merchant.id}
    merchantName={selected.merchant.name}
    intent={intent}
    plan={getMerchantPlanDefinition(planCode)}
    action={action}
    currentPlanName={commercial.plan?.name ?? null}
    billingState={billingState.state}
  />
}
