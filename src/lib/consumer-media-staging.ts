import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { deleteR2Media } from '@/lib/consumer-r2-media'
import { logger } from '@/lib/logger'

// Keep crash/ambiguous uploads discoverable past the longest app request and storage retry.
const STAGING_DELAY_MS = 60 * 60 * 1000

export async function trackConsumerMedia(refs: string[], db: Prisma.TransactionClient = prisma) {
  await db.consumerMediaStaging.createMany({
    data: refs.map(reference => ({ reference, cleanupAfter: new Date(Date.now() + STAGING_DELAY_MS) })),
    skipDuplicates: true,
  })
}

export async function commitConsumerMedia<T>(
  refs: string[],
  create: (db: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async db => {
    // The row locks serialize publication against a cleanup claim.
    const released = await db.consumerMediaStaging.deleteMany({
      where: { reference: { in: refs }, cleanupAfter: { gt: new Date() } },
    })
    if (released.count !== refs.length) throw new Error('Consumer media staging window expired')
    return create(db)
  })
}

export async function cleanupConsumerMediaStaging(now: Date) {
  const due = await prisma.consumerMediaStaging.findMany({
    where: { cleanupAfter: { lte: now } },
    orderBy: { cleanupAfter: 'asc' },
    take: 100,
    select: { reference: true },
  })
  let failed = 0
  for (const { reference } of due) {
    try {
      await deleteR2Media(reference)
      await prisma.consumerMediaStaging.deleteMany({ where: { reference } })
    } catch {
      failed++
      await prisma.consumerMediaStaging.updateMany({
        where: { reference },
        data: { cleanupAfter: new Date(now.getTime() + STAGING_DELAY_MS) },
      })
      logger.warn('api', 'Consumer R2 staging deletion failed', { provider: 'r2' })
    }
  }
  return { scanned: due.length, failed }
}
