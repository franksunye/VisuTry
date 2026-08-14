import { prisma } from '@/lib/prisma'
import { requireMerchantMembership } from './merchant-access'

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
  const current = await prisma.merchant.findUnique({ where: { id: input.merchantId }, select: { id: true, name: true, websiteUrl: true } })
  if (!current) throw new MerchantProfileError('INVALID_MERCHANT_NAME', 'Merchant workspace was not found.')

  const name = input.name === undefined ? current.name : input.name.trim()
  if (name.length < 2 || name.length > 120) throw new MerchantProfileError('INVALID_MERCHANT_NAME', 'Merchant name must be between 2 and 120 characters.')
  const websiteUrl = normalizeWebsite(input.websiteUrl)
  const updated = await prisma.merchant.update({
    where: { id: input.merchantId },
    data: { name, ...(websiteUrl === undefined ? {} : { websiteUrl }) },
    select: { id: true, slug: true, name: true, websiteUrl: true },
  })
  return updated
}
