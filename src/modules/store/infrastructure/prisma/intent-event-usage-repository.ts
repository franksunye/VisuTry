import type { MerchantEvent, MerchantIntent, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { sanitizeEventMetadata } from '../../domain/privacy'
import type {
  MerchantEventRecord,
  MerchantEventRepository,
  MerchantIntentRecord,
  MerchantIntentRepository,
  StoreUsageRepository,
} from '../../application/ports/repositories'
import type {
  MerchantIntentType,
  StoreEventSource,
  StoreEventType,
} from '../../domain/enums'

function mapIntent(row: MerchantIntent): MerchantIntentRecord {
  return {
    id: row.id,
    merchantId: row.merchantId,
    merchantSessionId: row.merchantSessionId,
    merchantFrameId: row.merchantFrameId,
    type: row.type as MerchantIntentType,
    idempotencyKey: row.idempotencyKey,
    email: row.email,
    name: row.name,
    note: row.note,
    createdAt: row.createdAt,
  }
}

function mapEvent(row: MerchantEvent): MerchantEventRecord {
  return {
    id: row.id,
    eventId: row.eventId,
    type: row.type as StoreEventType,
    merchantId: row.merchantId,
    merchantSessionId: row.merchantSessionId,
    merchantFrameId: row.merchantFrameId,
    tryOnTaskId: row.tryOnTaskId,
    source: row.source as StoreEventSource,
    locale: row.locale,
    deviceType: row.deviceType,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt,
  }
}

export function createPrismaMerchantIntentRepository(): MerchantIntentRepository {
  return {
    async createIdempotent(input) {
      const existing = await prisma.merchantIntent.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      })
      if (existing) {
        if (existing.merchantId !== input.merchantId) {
          throw new Error('Intent idempotency key belongs to another merchant')
        }
        return { record: mapIntent(existing), created: false }
      }

      try {
        const row = await prisma.merchantIntent.create({
          data: {
            merchantId: input.merchantId,
            merchantSessionId: input.merchantSessionId,
            merchantFrameId: input.merchantFrameId ?? null,
            type: input.type,
            idempotencyKey: input.idempotencyKey,
            email: input.email ?? null,
            name: input.name ?? null,
            note: input.note ?? null,
          },
        })
        return { record: mapIntent(row), created: true }
      } catch (error) {
        const code = (error as { code?: string }).code
        if (code === 'P2002') {
          const raced = await prisma.merchantIntent.findUnique({
            where: { idempotencyKey: input.idempotencyKey },
          })
          if (raced) return { record: mapIntent(raced), created: false }
        }
        throw error
      }
    },
    async listByMerchant(merchantId, limit = 50) {
      const rows = await prisma.merchantIntent.findMany({
        where: { merchantId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
      return rows.map(mapIntent)
    },
  }
}

export function createPrismaMerchantEventRepository(): MerchantEventRepository {
  return {
    async appendIdempotent(input) {
      const sanitized = sanitizeEventMetadata(input.metadata ?? undefined) ?? null
      const existing = await prisma.merchantEvent.findUnique({
        where: { eventId: input.eventId },
      })
      if (existing) {
        if (existing.merchantId !== input.merchantId) {
          throw new Error('Event idempotency key belongs to another merchant')
        }
        return { record: mapEvent(existing), created: false }
      }

      try {
        const row = await prisma.merchantEvent.create({
          data: {
            eventId: input.eventId,
            type: input.type,
            merchantId: input.merchantId,
            merchantSessionId: input.merchantSessionId ?? null,
            merchantFrameId: input.merchantFrameId ?? null,
            tryOnTaskId: input.tryOnTaskId ?? null,
            source: input.source,
            locale: input.locale ?? null,
            deviceType: input.deviceType ?? null,
            metadata: sanitized as Prisma.InputJsonValue,
          },
        })
        return { record: mapEvent(row), created: true }
      } catch (error) {
        const code = (error as { code?: string }).code
        if (code === 'P2002') {
          const raced = await prisma.merchantEvent.findUnique({
            where: { eventId: input.eventId },
          })
          if (raced) return { record: mapEvent(raced), created: false }
        }
        throw error
      }
    },
    async listByMerchant(merchantId, limit = 100) {
      const rows = await prisma.merchantEvent.findMany({
        where: { merchantId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
      return rows.map(mapEvent)
    },
  }
}

export function createPrismaStoreUsageRepository(): StoreUsageRepository {
  return {
    async record(input) {
      await prisma.merchantUsageLedger.create({
        data: {
          merchantId: input.merchantId,
          merchantSessionId: input.merchantSessionId ?? null,
          tryOnTaskId: input.tryOnTaskId ?? null,
          kind: input.kind,
        },
      })
    },
    async countSuccessfulRenders(merchantId) {
      return prisma.merchantUsageLedger.count({
        where: { merchantId, kind: 'RENDER_SUCCESS' },
      })
    },
    async countSessionSuccessfulRenders(merchantId, merchantSessionId) {
      return prisma.merchantUsageLedger.count({
        where: { merchantId, merchantSessionId, kind: 'RENDER_SUCCESS' },
      })
    },
    async countSessionAttempts(merchantId, merchantSessionId) {
      return prisma.merchantUsageLedger.count({
        where: {
          merchantId,
          merchantSessionId,
          kind: { in: ['RENDER_ATTEMPT', 'RENDER_SUCCESS', 'RENDER_FAILURE'] },
        },
      })
    },
  }
}
