import { prisma } from '@/lib/prisma'
import { MerchantAccessError } from './merchant-access'
import { buildMerchantSupportHandoffV1 } from '../domain/merchant-support-handoff-v1'

/**
 * Owner/Admin-authenticated adapter; the HTTP route enforces membership
 * before calling this read. The DB projection deliberately excludes shopper
 * records, tokens, contacts, emails, billing rows and analytics identities.
 */
export async function getMerchantSupportHandoff(input: { merchantId: string }) {
  const merchant = await prisma.merchant.findUnique({
    where: { id: input.merchantId },
    select: {
      slug: true, name: true, classification: true,
      logoUrl: true, accentColor: true,
      frames: {
        select: {
          id: true, sku: true, externalId: true, name: true,
          imageUrl: true, productUrl: true, source: true, status: true,
        },
      },
      experiences: {
        where: { type: { in: ['STORE', 'CAMPAIGN'] } },
        select: {
          type: true, slug: true, status: true,
          updatedAt: true, heroAssetUrl: true,
          frames: {
            where: { active: true },
            select: {
              merchantFrame: {
                select: {
                  id: true, sku: true, externalId: true, name: true,
                  imageUrl: true, productUrl: true, source: true, status: true,
                },
              },
            },
          },
        },
      },
    },
  })
  if (!merchant) throw new MerchantAccessError()
  return buildMerchantSupportHandoffV1(merchant)
}
