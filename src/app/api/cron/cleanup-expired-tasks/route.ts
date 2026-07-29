import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'
import { logger } from '@/lib/logger'
import { sendRetentionDeletedEmail } from '@/lib/resend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RetentionUser = {
  id: string
  email: string | null
  name: string | null
  lastRetentionDeletedEmailSent: Date | null
}

type UserExpiry = {
  user: RetentionUser
  expiryDate: Date
}

/**
 * Cron job to clean up expired try-on and face-analysis data.
 *
 * Safety rule: associated blobs are deleted before database rows. If blob
 * deletion fails, records are retained so the job can retry with the original
 * URLs on the next run.
 *
 * Runs daily at 2:00 AM UTC.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn('api', 'Unauthorized cron access attempt', { endpoint: 'cleanup-expired-tasks' })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const results = {
    tryOnTasksDeleted: 0,
    faceAnalysisTasksDeleted: 0,
    blobsDeleted: 0,
    emailsSent: 0,
    emailsFailed: 0,
  }

  try {
    const [expiredTryOnTasks, expiredFaceAnalysisTasks] = await Promise.all([
      prisma.tryOnTask.findMany({
        where: { expiresAt: { lte: now } },
        select: {
          id: true,
          userId: true,
          userImageUrl: true,
          itemImageUrl: true,
          glassesImageUrl: true,
          resultImageUrl: true,
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
      }),
      prisma.faceAnalysisTask.findMany({
        where: { expiresAt: { lte: now } },
        select: {
          id: true,
          userId: true,
          userImageUrl: true,
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
      }),
    ])

    const expiredCount = expiredTryOnTasks.length + expiredFaceAnalysisTasks.length
    if (expiredCount === 0) {
      logger.info('api', 'No expired tasks to cleanup')
      return NextResponse.json({
        success: true,
        timestamp: now.toISOString(),
        message: 'No expired tasks',
        results,
      })
    }

    logger.info('api', 'Expired retention data found', {
      tryOnTasks: expiredTryOnTasks.length,
      faceAnalysisTasks: expiredFaceAnalysisTasks.length,
    })

    const urlsToDelete = Array.from(
      new Set(
        [
          ...expiredTryOnTasks.flatMap((task) => [
            task.userImageUrl,
            task.itemImageUrl,
            task.glassesImageUrl,
            task.resultImageUrl,
          ]),
          ...expiredFaceAnalysisTasks.map((task) => task.userImageUrl),
        ].filter((url): url is string => Boolean(url)),
      ),
    )

    if (urlsToDelete.length > 0) {
      try {
        await del(urlsToDelete)
        results.blobsDeleted = urlsToDelete.length
      } catch (blobError) {
        const error = blobError instanceof Error ? blobError : new Error(String(blobError))
        logger.error('api', 'Expired blob deletion failed; database records retained for retry', error, {
          blobCount: urlsToDelete.length,
        })
        return NextResponse.json(
          {
            error: 'Blob cleanup failed; records retained for retry',
            timestamp: now.toISOString(),
            results,
          },
          { status: 500 },
        )
      }
    }

    const [tryOnDeleteResult, faceAnalysisDeleteResult] = await prisma.$transaction([
      prisma.tryOnTask.deleteMany({
        where: { id: { in: expiredTryOnTasks.map((task) => task.id) } },
      }),
      prisma.faceAnalysisTask.deleteMany({
        where: { id: { in: expiredFaceAnalysisTasks.map((task) => task.id) } },
      }),
    ])

    results.tryOnTasksDeleted = tryOnDeleteResult.count
    results.faceAnalysisTasksDeleted = faceAnalysisDeleteResult.count

    const userExpiryMap = new Map<string, UserExpiry>()
    const registerUserExpiry = (userId: string, user: RetentionUser, expiresAt: Date | null) => {
      if (!user.email) return
      const expiryDate = expiresAt || now
      const existing = userExpiryMap.get(userId)
      if (!existing || expiryDate < existing.expiryDate) {
        userExpiryMap.set(userId, { user, expiryDate })
      }
    }

    expiredTryOnTasks.forEach((task) => registerUserExpiry(task.userId, task.user, task.expiresAt))
    expiredFaceAnalysisTasks.forEach((task) =>
      registerUserExpiry(task.userId, task.user, task.expiresAt),
    )

    for (const [userId, { user, expiryDate }] of userExpiryMap.entries()) {
      const lastSent = user.lastRetentionDeletedEmailSent
      if (lastSent && now.getTime() - lastSent.getTime() < 24 * 60 * 60 * 1000) {
        continue
      }

      const result = await sendRetentionDeletedEmail({
        id: user.id,
        email: user.email,
        name: user.name,
        expiryDate,
      })

      if (result.success) {
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
