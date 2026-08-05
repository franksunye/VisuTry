import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { sendRetentionDeletedEmail } from '@/lib/resend'
import { cleanupExpiredTryOnTasks } from '@/modules/store/application/cleanup-expired-tryon-tasks'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Cron: blob-first TryOnTask retention cleanup (Consumer + Store).
 * Database rows are removed only after Blob deletion succeeds or is confirmed missing.
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
    // Collect consumer emails before deletion (URLs still present).
    const expiredForEmail = await prisma.tryOnTask.findMany({
      where: {
        expiresAt: { lte: now },
        origin: 'CONSUMER',
        retentionStatus: { in: ['ACTIVE', 'PENDING_DELETE', 'DELETE_BLOCKED'] },
        userId: { not: null },
      },
      take: 200,
      select: {
        userId: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            lastRetentionDeletedEmailSent: true,
          },
        },
      },
    })

    const cleanup = await cleanupExpiredTryOnTasks({ now, limit: 100, maxRounds: 5 })
    results.tasksDeleted = cleanup.deleted
    results.tasksFailed = cleanup.failed
    results.tasksScanned = cleanup.scanned
    results.blockedRetried = cleanup.blockedRetried

    const userTaskMap = new Map<
      string,
      { user: NonNullable<(typeof expiredForEmail)[0]['user']>; expiryDate: Date }
    >()
    for (const task of expiredForEmail) {
      if (task.userId && task.user?.email && !userTaskMap.has(task.userId)) {
        userTaskMap.set(task.userId, {
          user: task.user,
          expiryDate: task.expiresAt || now,
        })
      }
    }

    for (const [userId, { user, expiryDate }] of userTaskMap.entries()) {
      const lastSent = user.lastRetentionDeletedEmailSent
      if (lastSent && now.getTime() - lastSent.getTime() < 24 * 60 * 60 * 1000) {
        continue
      }

      const emailResult = await sendRetentionDeletedEmail({
        id: user.id,
        email: user.email,
        name: user.name,
        expiryDate,
      })

      if (emailResult.success) {
        await prisma.user.update({
          where: { id: userId },
          data: { lastRetentionDeletedEmailSent: now },
        })
        results.emailsSent++
      } else {
        results.emailsFailed++
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
