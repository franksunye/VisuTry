import { prisma } from '@/lib/prisma'
import { requireMerchantMembership } from './merchant-access'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'
import { MERCHANT_ACTIVATION_EVENT } from '../domain/merchant-activation'
import { recordMerchantActivationEventWithClient } from './merchant-activation'

export class MerchantProfileError extends Error {
  readonly code: 'INVALID_MERCHANT_NAME' | 'INVALID_WEBSITE_URL'

  constructor(code: MerchantProfileError['code'], message: string) {
    super(message)
    this.name = 'MerchantProfileError'
    this.code = code
  }
}

function normalizeWebsite(value: string | null | undefined) {
  if (value === undefined) return undefined
  if (value === null) return null
  const websiteUrl = value.trim() || null
  if (!websiteUrl) return null
  try {
    const parsed = new URL(websiteUrl)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('Unsupported protocol')
  } catch {
    throw new MerchantProfileError('INVALID_WEBSITE_URL', 'Website URL must be a valid http(s) URL.')
  }
  return websiteUrl
}

export async function updateMerchantProfile(input: {
  userId: string
  merchantId: string
  name?: string
  websiteUrl?: string | null
}) {
  await requireMerchantMembership({ userId: input.userId, merchantId: input.merchantId, roles: ['OWNER', 'ADMIN'] })
  const current = await prisma.merchant.findUnique({ where: { id: input.merchantId }, select: { id: true, name: true, websiteUrl: true, slug: true } })
  if (!current) throw new MerchantProfileError('INVALID_MERCHANT_NAME', 'Merchant workspace was not found.')

  const name = input.name === undefined ? current.name : input.name.trim()
  if (name.length < 2 || name.length > 120) throw new MerchantProfileError('INVALID_MERCHANT_NAME', 'Merchant name must be between 2 and 120 characters.')
  const websiteUrl = normalizeWebsite(input.websiteUrl)
  const meaningfulChange = name !== current.name || (websiteUrl !== undefined && websiteUrl !== current.websiteUrl)
  const updated = await withPublicDiscoveryInvalidation({
    target: { kind: 'merchant', merchantSlug: current.slug },
    mutation: () => prisma.$transaction(async (tx) => {
      const result = await tx.merchant.update({
        where: { id: input.merchantId },
        data: { name, ...(websiteUrl === undefined ? {} : { websiteUrl }) },
        select: { id: true, slug: true, name: true, websiteUrl: true },
      })
      if (meaningfulChange) {
        await recordMerchantActivationEventWithClient(tx, {
          merchantId: input.merchantId,
          eventType: MERCHANT_ACTIVATION_EVENT.PROFILE_UPDATED,
          source: 'SERVER',
        })
      }
      return result
    }),
  })
  return updated
}
