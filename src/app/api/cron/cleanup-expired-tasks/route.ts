import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { sendRetentionDeletedEmail } from '@/lib/resend'
import { cleanupExpiredTryOnTasks } from '@/modules/store/application/cleanup-expired-tryon-tasks'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Cron: blob-first TryOnTask retention cleanup (Consumer + Store).
 * Deletion emails are sent only for users whose tasks were confirmed deleted.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn('api', 'Unauthorized cron access attempt', { endpoint: 'cleanup-expired-tasks' })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const results = {
    tasksDeleted: 0,
    tasksFailed: 0,
    tasksScanned: 0,
    blockedRetried: 0,
    emailsSent: 0,
    emailsFailed: 0,
  }

  try {
    const cleanup = await cleanupExpiredTryOnTasks({ now, limit: 100, maxRounds: 5 })
    results.tasksDeleted = cleanup.deleted
    results.tasksFailed = cleanup.failed
    results.tasksScanned = cleanup.scanned
    results.blockedRetried = cleanup.blockedRetried

    const confirmedUserIds = Array.from(new Set(cleanup.deletedUserIds))
    if (confirmedUserIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: confirmedUserIds } },
        select: {
          id: true,
          email: true,
          name: true,
          lastRetentionDeletedEmailSent: true,
        },
      })

      for (const user of users) {
        if (!user.email) continue
        const lastSent = user.lastRetentionDeletedEmailSent
        if (lastSent && now.getTime() - lastSent.getTime() < 24 * 60 * 60 * 1000) {
          continue
        }

        const emailResult = await sendRetentionDeletedEmail({
          id: user.id,
          email: user.email,
          name: user.name,
          expiryDate: now,
        })

        if (emailResult.success) {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastRetentionDeletedEmailSent: now },
          })
          results.emailsSent++
        } else {
          results.emailsFailed++
        }
      }
    }

    logger.info('api', 'Cleanup expired tasks cron completed', results)

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('api', 'Cleanup expired tasks cron failed', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
