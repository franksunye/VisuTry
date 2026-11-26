import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { sendRetentionDeletedEmail } from '@/lib/resend'

const DAY_MS = 24 * 60 * 60 * 1000

/** The caller commits the deletion and its notification in the same transaction. */
export async function queueDeletionNotice(db: Prisma.TransactionClient, userId: string, now: Date) {
  await db.user.updateMany({
    where: { id: userId, email: { not: null }, retentionDeletedEmailPendingAt: null },
    data: { retentionDeletedEmailPendingAt: now },
  })
}

export async function sendPendingDeletionNotices(now: Date) {
  const users = await prisma.user.findMany({
    where: {
      retentionDeletedEmailPendingAt: { not: null },
      email: { not: null },
      OR: [
        { lastRetentionDeletedEmailSent: null },
        { lastRetentionDeletedEmailSent: { lte: new Date(now.getTime() - DAY_MS) } },
      ],
    },
    orderBy: { retentionDeletedEmailPendingAt: 'asc' },
    take: 100,
    select: { id: true, email: true, name: true, retentionDeletedEmailPendingAt: true },
  })

  let sent = 0
  let failed = 0
  for (const user of users) {
    const pendingAt = user.retentionDeletedEmailPendingAt
    if (!pendingAt || !user.email) continue
    const result = await sendRetentionDeletedEmail(
      { ...user, expiryDate: pendingAt },
      `retention-deleted/${user.id}/${pendingAt.getTime()}`,
    )
    if (!result.success) {
      failed++
      continue
    }
    await prisma.user.updateMany({
      where: { id: user.id, retentionDeletedEmailPendingAt: pendingAt },
      data: { retentionDeletedEmailPendingAt: null, lastRetentionDeletedEmailSent: now },
    })
    sent++
  }
  return { sent, failed }
}
