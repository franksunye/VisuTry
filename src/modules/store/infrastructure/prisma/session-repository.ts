import type { MerchantSession } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type {
  MerchantSessionRecord,
  MerchantSessionRepository,
} from '../../application/ports/repositories'
import type { MerchantSessionStatus } from '../../domain/enums'

function mapSession(row: MerchantSession): MerchantSessionRecord {
  return {
    id: row.id,
    merchantId: row.merchantId,
    anonymousVisitorId: row.anonymousVisitorId,
    photoAssetId: row.photoAssetId,
    capabilityTokenHash: row.capabilityTokenHash,
    locale: row.locale,
    status: row.status as MerchantSessionStatus,
    referenceData: row.referenceData,
    source: row.source,
    medium: row.medium,
    campaign: row.campaign,
    referrer: row.referrer,
    landingUrl: row.landingUrl,
    aiAgentSource: row.aiAgentSource,
    createdAt: row.createdAt,
    lastActiveAt: row.lastActiveAt,
    expiresAt: row.expiresAt,
  }
}

export function createPrismaMerchantSessionRepository(): MerchantSessionRepository {
  return {
    async create(input) {
      const row = await prisma.merchantSession.create({
        data: {
          merchantId: input.merchantId,
          capabilityTokenHash: input.capabilityTokenHash,
          anonymousVisitorId: input.anonymousVisitorId ?? null,
          locale: input.locale ?? null,
          expiresAt: input.expiresAt,
          referenceData: input.referenceData ?? false,
          source: input.source ?? null,
          medium: input.medium ?? null,
          campaign: input.campaign ?? null,
          referrer: input.referrer ?? null,
          landingUrl: input.landingUrl ?? null,
          aiAgentSource: input.aiAgentSource ?? null,
          status: 'ACTIVE',
          lastActiveAt: new Date(),
        },
      })
      return mapSession(row)
    },
    async findByMerchantAndId(merchantId, sessionId) {
      const row = await prisma.merchantSession.findFirst({
        where: { id: sessionId, merchantId },
      })
      return row ? mapSession(row) : null
    },
    async touch(merchantId, sessionId, lastActiveAt) {
      await prisma.merchantSession.updateMany({
        where: { id: sessionId, merchantId },
        data: { lastActiveAt },
      })
    },
    async markExpired(merchantId, sessionId) {
      await prisma.merchantSession.updateMany({
        where: { id: sessionId, merchantId },
        data: { status: 'EXPIRED' },
      })
    },
    async attachPhotoAsset({ merchantId, sessionId, photoAssetId }) {
      await prisma.merchantSession.updateMany({
        where: { id: sessionId, merchantId },
        data: {
          photoAssetId,
          lastActiveAt: new Date(),
        },
      })
    },
  }
}
