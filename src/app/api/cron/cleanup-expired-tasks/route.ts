import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { sendRetentionDeletedEmail } from '@/lib/resend'
import { cleanupExpiredTryOnTasks } from '@/lib/retention'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Cron: blob-first TryOnTask retention cleanup (Consumer + Store).
 * Uses shared retention core (ADR-007) — not Store modules.
 * Deletion emails are sent only for users whose tasks were confirmed deleted.
 *
 * Consumer and Store batches run with isolated failure domains so a Store
 * cleanup exception cannot abort Consumer cleanup (or vice versa).
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
    consumerOk: true,
    storeOk: true,
    consumerError: null as string | null,
    storeError: null as string | null,
  }

  try {
    let consumerCleanup: Awaited<ReturnType<typeof cleanupExpiredTryOnTasks>> | null = null
    let storeCleanup: Awaited<ReturnType<typeof cleanupExpiredTryOnTasks>> | null = null

    try {
      consumerCleanup = await cleanupExpiredTryOnTasks({
        now,
        limit: 100,
        maxRounds: 5,
        origins: ['CONSUMER'],
      })
    } catch (error) {
      results.consumerOk = false
      results.consumerError = error instanceof Error ? error.message : String(error)
      logger.error(
        'api',
        'Consumer TryOnTask retention cleanup failed',
        error instanceof Error ? error : new Error(String(error)),
      )
    }

    try {
      storeCleanup = await cleanupExpiredTryOnTasks({
        now,
        limit: 100,
        maxRounds: 5,
        origins: ['STORE_DEMO', 'STORE_PILOT'],
      })
    } catch (error) {
      results.storeOk = false
      results.storeError = error instanceof Error ? error.message : String(error)
      logger.error(
        'api',
        'Store TryOnTask retention cleanup failed',
        error instanceof Error ? error : new Error(String(error)),
      )
    }

    for (const cleanup of [consumerCleanup, storeCleanup]) {
      if (!cleanup) continue
      results.tasksDeleted += cleanup.deleted
      results.tasksFailed += cleanup.failed
      results.tasksScanned += cleanup.scanned
      results.blockedRetried += cleanup.blockedRetried
    }

    const confirmedUserIds = Array.from(
      new Set([
        ...(consumerCleanup?.deletedUserIds ?? []),
        ...(storeCleanup?.deletedUserIds ?? []),
      ]),
    )
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

    const success = results.consumerOk || results.storeOk
    return NextResponse.json(
      {
        success,
        timestamp: now.toISOString(),
        results,
      },
      { status: success ? 200 : 500 },
    )
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('api', 'Cleanup expired tasks cron failed', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
