import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-runtime'
import { requireMerchantMembership } from './merchant-access'
import { listMerchantsForUser } from './merchant-memberships'

export type MerchantWorkspaceNavigationMerchant = {
  id: string
  slug: string
  name: string
  role: string
}

export type MerchantWorkspaceContext = {
  userId: string
  locale: string
  merchants: MerchantWorkspaceNavigationMerchant[]
  selectedMerchantId: string
}

export async function requireMerchantWorkspaceContext(input: {
  locale: string
  merchantId?: string
}) : Promise<MerchantWorkspaceContext> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect(`/${input.locale}/auth/signin?callbackUrl=/${input.locale}/merchant`)
  }

  const memberships = await listMerchantsForUser(session.user.id)
  if (memberships.length === 0) redirect(`/${input.locale}/merchant`)

  const selected = input.merchantId
    ? memberships.find(({ merchant }) => merchant.id === input.merchantId)
    : memberships[0]
  if (!selected) notFound()

  await requireMerchantMembership({
    userId: session.user.id,
    merchantId: selected.merchant.id,
    roles: ['OWNER', 'ADMIN'],
  })

  return {
    userId: session.user.id,
    locale: input.locale,
    merchants: memberships.map(({ merchant, membership }) => ({
      id: merchant.id,
      slug: merchant.slug,
      name: merchant.name,
      role: membership.role,
    })),
    selectedMerchantId: selected.merchant.id,
  }
}

