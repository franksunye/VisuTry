import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type {
  MerchantSponsoredUsageRepository,
  SponsoredUsageReservation,
} from '../../application/ports/repositories'

function mapReservation(row: {
  id: string
  status: string
}): SponsoredUsageReservation {
  return {
    id: row.id,
    status: row.status as SponsoredUsageReservation['status'],
  }
}

/**
 * Reserve one rolling-window allowance under a transaction-scoped advisory
 * lock. A fixed calendar bucket would not satisfy the rolling 24h contract.
 */
export function createPrismaMerchantSponsoredUsageRepository(): MerchantSponsoredUsageRepository {
  return {
    async reserve(input) {
      if (input.limit <= 0) return null
      const now = input.now ?? new Date()
      const cutoff = new Date(now.getTime() - input.rollingWindowHours * 60 * 60 * 1000)
      const lockKey = `${input.merchantId}:${input.shopperIdentityHash}:${input.usageType}`

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          return await prisma.$transaction(
            async (tx) => {
              const existing = await tx.merchantSponsoredUsage.findUnique({
                where: { idempotencyKey: input.idempotencyKey },
                select: { id: true, status: true },
              })
              if (existing) return mapReservation(existing)

              await tx.$executeRaw`
                SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))
              `

              const active = await tx.merchantSponsoredUsage.count({
                where: {
                  merchantId: input.merchantId,
                  usageType: input.usageType,
                  createdAt: { gte: cutoff },
                  status: { in: ['RESERVED', 'CONSUMED'] },
                  OR: [
                    { shopperIdentityHash: input.shopperIdentityHash },
                    ...(input.userId ? [{ userId: input.userId }] : []),
                  ],
                },
              })
              if (active >= input.limit) return null

              const row = await tx.merchantSponsoredUsage.create({
                data: {
                  merchantId: input.merchantId,
                  merchantSessionId: input.merchantSessionId ?? null,
                  experienceId: input.experienceId ?? null,
                  userId: input.userId ?? null,
                  shopperIdentityHash: input.shopperIdentityHash,
                  usageType: input.usageType,
                  status: 'RESERVED',
                  idempotencyKey: input.idempotencyKey,
                  reservedAt: now,
                  createdAt: now,
                },
                select: { id: true, status: true },
              })
              return mapReservation(row)
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
          )
        } catch (error) {
          const code = (error as { code?: string }).code
          if (code === 'P2002') {
            const existing = await prisma.merchantSponsoredUsage.findUnique({
              where: { idempotencyKey: input.idempotencyKey },
              select: { id: true, status: true },
            })
            if (existing) return mapReservation(existing)
          }
          if (code !== 'P2034' || attempt === 3) throw error
        }
      }
      throw new Error('Sponsored usage reservation retry limit exceeded')
    },

    async consume(reservationId) {
      const result = await prisma.merchantSponsoredUsage.updateMany({
        where: { id: reservationId, status: 'RESERVED' },
        data: { status: 'CONSUMED', consumedAt: new Date() },
      })
      return result.count > 0
    },

    async release(reservationId) {
      const result = await prisma.merchantSponsoredUsage.updateMany({
        where: { id: reservationId, status: 'RESERVED' },
        data: { status: 'RELEASED', releasedAt: new Date() },
      })
      return result.count > 0
    },
  }
}
